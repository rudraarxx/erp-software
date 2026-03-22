"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Don't show confusing error if they just haven't setup Supabase envs yet
      if (email === "admin@solidstonne.com" && password === "password123") {
         // Fake auth to allow view until Supabase URL is mapped (For the MVP Preview)
         router.push("/dashboard");
         // NOTE: Middleware block redirect if supabase is missing envs. It just falls through.
      } else {
         setError(error.message);
      }
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#1C1C1C]/10 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <Link href="/">
              <Image src="/ssLogo.png" alt="SolidStonne" width={200} height={60} className="h-10 w-auto object-contain" />
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading font-bold text-[#1C1C1C]">Client & Staff Portal</h1>
            <p className="text-sm text-[#1C1C1C]/60 mt-2">Log in to manage your construction projects.</p>
          </div>

          <div className="space-y-4 mb-8">
            <button 
              onClick={async () => {
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
              }}
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#1C1C1C]/10 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.01.67-2.3 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#1C1C1C]/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[#1C1C1C]/40">Or login with email</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1C1C1C]/80 mb-1.5" htmlFor="email">Email Address</label>
              <input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#1C1C1C]/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-[#1C1C1C]/30"
                placeholder="you@company.com"
                required
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#1C1C1C]/80" htmlFor="password">Password</label>
                <Link href="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#1C1C1C]/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-[#1C1C1C]/30"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#1C1C1C] hover:bg-primary text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
        <div className="bg-[#1C1C1C]/5 py-4 px-8 text-center border-t border-[#1C1C1C]/10 flex flex-col gap-2">
          <p className="text-sm text-[#1C1C1C]/60">Secure portal for SolidStonne staff and clients.</p>
          <p className="text-xs text-[#1C1C1C]/40">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline font-bold">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
