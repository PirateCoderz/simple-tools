"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/Topbar";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push("/");
                router.refresh();
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Topbar />
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
                {/* Background Image */}
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/background.jpg')" }}
                />

                <div className="w-full max-w-md px-4 relative z-10">
                    {/* Card */}
                    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
                            <p className="text-sm text-gray-600">Sign in to your account to continue</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <input
                                    id="signin-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                <input
                                    id="signin-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                id="signin-submit"
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 px-4 text-base font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Signing In..." : "Sign In"}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Don&apos;t have an account?{" "}
                                <Link href="/signup" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                                    Sign Up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
