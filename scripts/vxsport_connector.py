"""
VXSport API Connector — exploration / debug utility.

Connects to the VXSport training report API and prints every field
returned for a given session date. Useful for inspecting new API
fields or verifying data before it hits the app.

This script is NOT part of the app's data pipeline — the sync
happens server-side via /api/stats/sync. Use this locally when
you need to poke at the raw API response.

Env vars (loaded from .env automatically):
    VXSPORT_API_KEY
    VXSPORT_ACTIVATION_CODE
    VXSPORT_TEAM_NAME
    VXSPORT_FUNCTION_KEY

Usage:
    python scripts/vxsport_connector.py
"""

import os
import json
from datetime import datetime, timedelta
from pathlib import Path

try:
    import requests
    import pandas as pd
    from pandas import json_normalize
except ImportError:
    import sys
    sys.exit("Run: pip install requests pandas")


def load_env_file():
    """Load key=value pairs from the root .env file into os.environ.
    Only sets a key if it isn't already set — shell env takes priority."""
    env_path = Path(__file__).parent.parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and val and not os.environ.get(key):
            os.environ[key] = val


load_env_file()

# Function key goes in the query string; credentials go in the POST body
URL = f"https://api.vxsport.com/api/trainingreport?code={os.environ['VXSPORT_FUNCTION_KEY']}"

CREDS = {
    "apiKey":         os.environ["VXSPORT_API_KEY"],
    "activationCode": os.environ["VXSPORT_ACTIVATION_CODE"],
    "team":           os.environ["VXSPORT_TEAM_NAME"],
    "SessionOnly":    True,  # session summaries only — much smaller payload
}


def fetch_day(date: datetime) -> pd.DataFrame:
    """Fetch all player rows for a single calendar day.
    Returns an empty DataFrame if the API returns no data."""
    payload = {
        **CREDS,
        "startDate": date.strftime("%Y-%m-%dT00:00:00.000Z"),
        "endDate":   date.strftime("%Y-%m-%dT23:59:59.999Z"),
    }
    resp = requests.post(URL, json=payload, timeout=120)
    resp.raise_for_status()
    data = resp.json()
    if not data:
        return pd.DataFrame()
    df = json_normalize(data)
    # type=="File" means one row per player per session file;
    # other types (e.g. "Split") are sub-session breakdowns we don't need
    if "type" in df.columns:
        df = df[df["type"] == "File"]
    return df


def fetch_range(start: datetime, end: datetime) -> pd.DataFrame:
    """Fetch and concatenate player rows across a date range, day by day."""
    frames = []
    cursor = start
    while cursor <= end:
        print(f"Fetching {cursor.date()} ...")
        try:
            df = fetch_day(cursor)
            if not df.empty:
                frames.append(df)
                print(f"  -> {len(df)} rows")
            else:
                print(f"  -> no data")
        except Exception as e:
            print(f"  -> ERROR: {e}")
        cursor += timedelta(days=1)
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()


def explore(df: pd.DataFrame):
    """Print a human-readable summary of all columns and a sample first row."""
    if df.empty:
        print("No data returned.")
        return

    print("\n" + "=" * 60)
    print(f"TOTAL ROWS: {len(df)}")
    print(f"TOTAL COLUMNS: {len(df.columns)}")
    print("=" * 60)

    print("\nALL COLUMNS:")
    for col in df.columns:
        non_null = df[col].notna().sum()
        sample = df[col].dropna().iloc[0] if non_null > 0 else None
        print(f"  {col:<50} ({non_null}/{len(df)} non-null)  sample: {repr(sample)[:80]}")

    print("\nFIRST ROW (raw):")
    print(json.dumps(df.iloc[0].dropna().to_dict(), indent=2, default=str))


if __name__ == "__main__":
    # Try known session dates one at a time; fall back to a broad range if all fail
    test_dates = [
        datetime(2026, 1, 26),
        datetime(2026, 2, 5),
        datetime(2026, 2, 9),
    ]

    print("=== Testing single known dates ===")
    for d in test_dates:
        print(f"\nTrying {d.date()}...")
        try:
            df = fetch_day(d)
            if not df.empty:
                print(f"  Got {len(df)} rows, {len(df.columns)} columns")
                explore(df)
                break
            else:
                print("  Empty response")
        except Exception as e:
            print(f"  ERROR: {e}")
    else:
        print("\n=== Trying broader range (Jan-Apr 2026) ===")
        df = fetch_range(datetime(2026, 1, 1), datetime(2026, 4, 30))
        explore(df)
