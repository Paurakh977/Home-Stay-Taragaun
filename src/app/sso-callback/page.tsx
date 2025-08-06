'use client';

import { useEffect, Suspense } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";

// Loading component to show while suspense is active
function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">
          Processing authentication...
        </h2>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-2 border-[#183636] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  );
}

// The actual callback handler component
function SSOCallbackContent() {
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything until Clerk is loaded
    if (!isSignInLoaded || !isSignUpLoaded) return;

    // Update the processOAuthCallback function to handle redirect_url properly
    const processOAuthCallback = async () => {
      try {
        // Extract the query parameters
        const createdSessionId = searchParams?.get("createdSessionId");
        const redirectUrl = searchParams?.get("redirect_url") || '/';
        
        if (!createdSessionId) {
          console.error("No createdSessionId found in URL");
          router.push("/sign-in");
          return;
        }
        
        // Handle sign-in callback
        try {
          await setSignInActive({ session: createdSessionId });
          router.push(redirectUrl);
          return;
        } catch (_) {
          console.log("Not a sign-in callback, trying sign-up...");
        }
        
        // If sign-in failed, try sign-up callback
        try {
          await setSignUpActive({ session: createdSessionId });
          router.push(redirectUrl);
        } catch (error) {
          console.error("Error processing OAuth callback:", error);
          router.push("/sign-in?error=oauth-callback-failed");
        }
      } catch (error) {
        console.error("Error in OAuth callback:", error);
        router.push("/sign-in?error=oauth-callback-error");
      }
    };

    processOAuthCallback();
  }, [isSignInLoaded, isSignUpLoaded, router, searchParams, setSignInActive, setSignUpActive]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">
          Processing authentication...
        </h2>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-2 border-[#183636] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Please wait while we complete your authentication.
        </p>
        {/* Add clerk-captcha element for OAuth flows */}
        <div id="clerk-captcha" className="mt-4"></div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function SSOCallback() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SSOCallbackContent />
    </Suspense>
  );
} 