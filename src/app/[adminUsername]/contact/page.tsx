import Contact from '@/app/contact/page';

// This is a wrapper component that uses the main Contact component
// but keeps the adminUsername in the URL for consistent navigation with navbar
export default function AdminContactPage() {
  return <Contact />;
} 