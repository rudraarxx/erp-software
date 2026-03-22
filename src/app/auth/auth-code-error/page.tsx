import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#1C1C1C]/10 rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-heading font-bold text-[#1C1C1C]">Sign-In Failed</h1>
        <p className="text-sm text-[#1C1C1C]/60 mt-3 leading-relaxed">
          There was a problem completing your sign-in. This can happen if the link
          expired, was already used, or Google sign-in is not configured.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full bg-[#1C1C1C] hover:bg-primary text-white font-medium py-3 rounded-lg transition-colors text-sm flex items-center justify-center"
          >
            Back to Login
          </Link>
          <Link
            href="/"
            className="w-full text-[#1C1C1C]/60 hover:text-[#1C1C1C] text-sm py-2 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
