import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const REVIEW_PATH_PREFIX = '/client-review';
const REALM = 'Real Wealth Client Review';

function authResponse(message = 'Authentication required') {
  return new NextResponse(message, {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Cache-Control': 'no-store',
    },
  });
}

function missingPasswordResponse() {
  return new NextResponse(
    'Client review password is not configured. Set CLIENT_REVIEW_PASSWORD in Vercel before sharing this route.',
    {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

function readCredentials(header: string | null) {
  if (!header?.startsWith('Basic ')) return null;

  try {
    const decoded = atob(header.slice('Basic '.length));
    const [username, ...passwordParts] = decoded.split(':');
    return {
      username,
      password: passwordParts.join(':'),
    };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith(REVIEW_PATH_PREFIX)) {
    return NextResponse.next();
  }

  const expectedPassword = process.env.CLIENT_REVIEW_PASSWORD;
  if (!expectedPassword) return missingPasswordResponse();

  const expectedUser = process.env.CLIENT_REVIEW_USER || 'realwealth';
  const credentials = readCredentials(request.headers.get('authorization'));

  if (
    credentials?.username === expectedUser &&
    credentials.password === expectedPassword
  ) {
    return NextResponse.next();
  }

  return authResponse(credentials ? 'Invalid credentials' : undefined);
}

export const config = {
  matcher: ['/client-review/:path*'],
};
