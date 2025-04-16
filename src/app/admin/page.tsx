import { redirect } from 'next/navigation';

export default function AdminRedirectPage() {
  // Redirect to the admin login page
  // (middleware will handle redirecting to proper dashboard if already logged in)
  redirect('/admin/login');
}