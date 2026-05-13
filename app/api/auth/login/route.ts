import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const validUser = process.env.AUTH_USERNAME ?? "badger";
  const validPass = process.env.AUTH_PASSWORD ?? "badger";

  if (username === validUser && password === validPass) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("badgeriq_auth", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });
    return res;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
