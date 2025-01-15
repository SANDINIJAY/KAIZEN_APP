"use client";
import { useAuth } from "../AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AppContent({ children }: { children: React.ReactNode }) {
  const { loading, isLoggedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current route

  // Handle redirection for protected pages
  useEffect(() => {
    if (!loading && !isLoggedIn && pathname !== "/") {
      router.replace("/"); // Redirect to login page
    }
  }, [loading, isLoggedIn, router, pathname]);

  // Show loading state until auth state is resolved
  if (loading) {
    return <div>Loading application...</div>;
  }

  // Allow rendering the login page even if not logged in
  if (!isLoggedIn && pathname === "/") {
    return <>{children}</>; // Render the login form
  }

  // Render the protected content if logged in
  if (isLoggedIn) {
    return <>{children}</>;
  }

  // Fallback: Render nothing during redirection
  return null;
}