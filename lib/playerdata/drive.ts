/**
 * Google Drive access for PlayerData exports, via a service account.
 *
 * Env:
 *   GDRIVE_SERVICE_ACCOUNT_B64  base64 of the service account JSON key
 *   GDRIVE_FOLDER_ID            the shared folder exports are dropped into
 *
 * The folder is shared with the service account as Viewer, so this is
 * read-only (drive.readonly scope). Auth is a self-signed JWT exchanged for
 * an access token — no googleapis dependency needed.
 */

import crypto from "crypto";

// exports are named export1.csv, export2.csv, … — the ".csv" may be missing
// if Drive converted the upload into a Google Sheet
const EXPORT_NAME = /^export(\d+)(\.csv)?$/i;
const CSV_MIME    = "text/csv";
const SHEET_MIME  = "application/vnd.google-apps.spreadsheet";

export interface DriveExport {
  id:       string;
  name:     string;  // as it appears in Drive, e.g. "export3.csv"
  number:   number;  // 3 — used for ordering
  mimeType: string;
}

async function getAccessToken(): Promise<string> {
  const b64 = process.env.GDRIVE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error("GDRIVE_SERVICE_ACCOUNT_B64 is not set");
  const key = JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as { client_email: string; private_key: string };

  const now = Math.floor(Date.now() / 1000);
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${enc({ alg: "RS256", typ: "JWT" })}.${enc({
    iss:   key.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud:   "https://oauth2.googleapis.com/token",
    iat:   now,
    exp:   now + 3600,
  })}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), key.private_key).toString("base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion:  `${unsigned}.${signature}`,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Google auth failed: ${data.error_description ?? data.error ?? res.status}`);
  }
  return data.access_token as string;
}

export class DriveClient {
  private constructor(private token: string) {}

  static async connect(): Promise<DriveClient> {
    return new DriveClient(await getAccessToken());
  }

  /** All exportN files directly in the exports folder, sorted by N ascending. */
  async listExports(): Promise<DriveExport[]> {
    const folderId = process.env.GDRIVE_FOLDER_ID;
    if (!folderId) throw new Error("GDRIVE_FOLDER_ID is not set");

    const files: DriveExport[] = [];
    let pageToken: string | undefined;
    do {
      const params = new URLSearchParams({
        q:        `'${folderId}' in parents and trashed = false`,
        fields:   "nextPageToken, files(id, name, mimeType)",
        pageSize: "1000",
        ...(pageToken ? { pageToken } : {}),
      });
      const res  = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Drive list failed: ${data.error?.message ?? res.status}`);

      for (const f of data.files as { id: string; name: string; mimeType: string }[]) {
        const m = f.name.trim().match(EXPORT_NAME);
        if (m && (f.mimeType === CSV_MIME || f.mimeType === SHEET_MIME || f.mimeType === "application/vnd.ms-excel")) {
          files.push({ id: f.id, name: f.name.trim(), number: Number(m[1]), mimeType: f.mimeType });
        }
      }
      pageToken = data.nextPageToken;
    } while (pageToken);

    return files.sort((a, b) => a.number - b.number);
  }

  /** File contents as CSV text. Google Sheets are exported to CSV on the fly. */
  async download(file: DriveExport): Promise<string> {
    const url = file.mimeType === SHEET_MIME
      ? `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${encodeURIComponent(CSV_MIME)}`
      : `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${this.token}` } });
    if (!res.ok) throw new Error(`Drive download of ${file.name} failed: ${res.status}`);
    return res.text();
  }
}
