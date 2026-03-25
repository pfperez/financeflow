import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    github: !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
    google: !!(process.env.GOOGLE_ID && process.env.GOOGLE_SECRET),
  });
}
