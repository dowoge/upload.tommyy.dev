import { NextRequest, NextResponse } from "next/server";
import {
  validatePassword,
  createSession,
  isValidSession,
  destroySession,
  getSessionCookieName,
  getSessionDurationMs,
} from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = createSession();
    const cookieName = getSessionCookieName();
    const maxAgeSeconds = Math.floor(getSessionDurationMs() / 1000);

    const response = NextResponse.json(
      { success: true, message: "Authenticated" },
      { status: 200 }
    );

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieName = getSessionCookieName();
  const token = request.cookies.get(cookieName)?.value;

  if (!token || !isValidSession(token)) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  return NextResponse.json(
    { authenticated: true },
    { status: 200 }
  );
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const cookieName = getSessionCookieName();
  const token = request.cookies.get(cookieName)?.value;

  if (token) {
    destroySession(token);
  }

  const response = NextResponse.json(
    { success: true, message: "Logged out" },
    { status: 200 }
  );

  response.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}