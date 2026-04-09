"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Login page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        {/* Error Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-container rounded-full mb-6">
          <AlertTriangle className="w-8 h-8 text-on-secondary-container" />
        </div>

        {/* Error Message */}
        <h1 className="font-display text-display-sm text-on-surface mb-3">
          Something went wrong
        </h1>
        <p className="text-body-lg text-on-surface-variant mb-8">
          We encountered an error while loading the login page. Please try again.
        </p>

        {/* Error Details */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-left p-4 bg-surface-container-low rounded-md mb-8">
            <p className="text-sm text-on-surface-variant font-mono">
              {error.message || "Unknown error"}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 py-3 px-6 btn-primary font-body font-medium text-body-md"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 btn-secondary font-body font-medium text-body-md"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}