import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (username === "badger" && password === "badger") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("badgeriq_auth", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // 8 hours
      maxAge: 60 * 60 * 8,
    });
    return res;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
