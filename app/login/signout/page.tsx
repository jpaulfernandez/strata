"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/server/auth/client";
import { Loader2 } from "lucide-react";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    async function signOut() {
      try {
        await authClient.signOut();
      } catch (error) {
        console.error("Sign out error:", error);
      }
      router.push("/login");
    }
    signOut();
  }, [router]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-on-surface-variant" />
        <p className="text-on-surface-variant">Signing out...</p>
      </div>
    </div>
  );
}