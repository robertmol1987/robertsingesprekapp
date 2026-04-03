import { NextResponse } from "next/server";

export const config = {
  matcher: "/integrations/:path*",
};

export function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-createxyz-project-id", "40985f02-cd59-476c-a082-b3985cb22c01");
  requestHeaders.set("x-createxyz-project-group-id", "08e9e417-e640-4fce-98b6-2c217a1b5c5e");


  request.nextUrl.href = `https://www.anything.com/${request.nextUrl.pathname}`;

  return NextResponse.rewrite(request.nextUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}