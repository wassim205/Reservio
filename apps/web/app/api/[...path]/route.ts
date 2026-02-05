import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4000';

// Proxy all requests to the backend API
async function proxyRequest(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace('/api', '');
  const url = `${API_URL}${pathname}${request.nextUrl.search}`;

  // Get cookies directly from request headers
  const cookieHeader = request.headers.get('cookie') || '';

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Cookie': cookieHeader,
  };

  const response = await fetch(url, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' 
      ? await request.text() 
      : undefined,
  });

  // Forward the response with Set-Cookie headers
  const responseHeaders = new Headers();
  
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      responseHeaders.set(key, value);
    }
  });

  const nextResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });

  // Forward Set-Cookie headers
  const setCookieHeaders = response.headers.getSetCookie();
  for (const cookie of setCookieHeaders) {
    nextResponse.headers.append('Set-Cookie', cookie);
  }

  return nextResponse;
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}
