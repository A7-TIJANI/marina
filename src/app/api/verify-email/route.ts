import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailAction } from '@/actions/auth';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(new URL('/auth/verify-email?invalid=1', baseUrl));
  }

  const result = await verifyEmailAction(token);

  if (!result.ok) {
    return NextResponse.redirect(new URL('/auth/verify-email?invalid=1', baseUrl));
  }

  // Spec §5.6 step 4: redirect to login after successful verification.
  return NextResponse.redirect(new URL('/auth/login?verified=1', baseUrl));
}
