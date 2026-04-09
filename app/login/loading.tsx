import { Loader2 } from "lucide-react";

export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
        <p className="text-body-md text-on-surface-variant">
          Loading...
        </p>
      </div>
    </div>
  );
}