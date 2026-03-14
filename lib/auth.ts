import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";

const MAX_FAILED_ATTEMPTS = 3;
const LOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                await connectDB();

                const user = await User.findOne({ email: credentials.email });
                if (!user) {
                    throw new Error("Invalid email or password");
                }

                // Check if account is locked
                if (user.lockUntil && user.lockUntil > new Date()) {
                    const remainingMs = user.lockUntil.getTime() - Date.now();
                    const remainingMin = Math.ceil(remainingMs / 60000);
                    throw new Error(
                        `Account is locked. Try again in ${remainingMin} minute(s).`
                    );
                }

                // If lock has expired, reset lockout fields
                if (user.lockUntil && user.lockUntil <= new Date()) {
                    user.failedLoginAttempts = 0;
                    user.lockUntil = null;
                    await user.save();
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    user.failedLoginAttempts += 1;

                    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
                        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
                        await user.save();
                        throw new Error(
                            "Account locked due to too many failed login attempts. Try again in 1 hour."
                        );
                    }

                    await user.save();
                    const remaining = MAX_FAILED_ATTEMPTS - user.failedLoginAttempts;
                    throw new Error(
                        `Invalid password. ${remaining} attempt(s) remaining.`
                    );
                }

                // Successful login - reset failed attempts
                user.failedLoginAttempts = 0;
                user.lockUntil = null;
                await user.save();

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/signin",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { id?: string }).id = token.id as string;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || "account-lockout-secret-key-2026",
};
