import { redirect } from 'next/navigation';

export default function OfficerRedirectPage() {
  // Redirect to the officer login page
  // (middleware will handle redirecting to proper dashboard if already logged in)
  redirect('/officer/login');
} 