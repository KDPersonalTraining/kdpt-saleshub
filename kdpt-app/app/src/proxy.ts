import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isPublicPath } from '@/lib/auth/roles';

// Refreshes the Supabase session cookie on every request and sends signed-out
// visitors to sign in. Role checks happen in each area's layout, where the
// profile is read from the database.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Demo mode: no database, sign-in is a cookie saying who you're trying out.
  if (!url || !key) {
    if (request.cookies.has('kdpt_demo') || isPublicPath(request.nextUrl.pathname)) return NextResponse.next();
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet, headers) {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
        for (const [k, v] of Object.entries(headers ?? {})) response.headers.set(k, v);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const path = request.nextUrl.pathname;

  if (!signedIn && !isPublicPath(path)) {
    const to = request.nextUrl.clone();
    to.pathname = '/sign-in';
    to.search = '';
    return NextResponse.redirect(to);
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|kd-mark.png|assets/|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
};
