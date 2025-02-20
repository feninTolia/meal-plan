import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-up(.*)',
  '/subscribe(.*)',
  '/api/webhook(.*)',
]);
const isSignUpRoute = createRouteMatcher(['/sign-up(.*)']);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const { origin } = request.nextUrl;

  if (!isPublicRoute(request) && !userId) {
    return NextResponse.redirect(new URL('/sign-up', origin));
  }

  if (isSignUpRoute(request) && userId) {
    return NextResponse.redirect(new URL('/meal-plan', origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
