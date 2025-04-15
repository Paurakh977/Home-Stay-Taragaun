import About from '@/app/about/page';

// This is a wrapper component that uses the main About component
// but keeps the adminUsername in the URL for consistent navigation with navbar
export default function AdminAboutPage() {
  return <About />;
} 