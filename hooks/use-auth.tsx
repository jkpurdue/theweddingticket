"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { weddingService } from "@/lib/data-service";
import type { User } from "@/types";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, fullName?: string) => Promise<void>;
  signIn: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load user from service on mount
    const current = weddingService.getCurrentUser();
    setUser(current);
    setLoading(false);
  }, []);

  const handleSignUp = async (email: string, fullName?: string) => {
    try {
      const newUser = await weddingService.signUp(email, fullName);
      setUser(newUser);
      toast.success("Welcome! Your account has been created.");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to sign up. Please try again.");
      throw error;
    }
  };

  const handleSignIn = async (email: string) => {
    try {
      const loggedIn = await weddingService.signIn(email);
      setUser(loggedIn);
      toast.success(`Welcome back, ${loggedIn.fullName?.split(" ")[0] || "friend"}.`);
      router.push("/dashboard");
    } catch (error) {
      toast.error("Sign in failed.");
      throw error;
    }
  };

  const handleGoogle = async () => {
    try {
      const googleUser = await weddingService.signInWithGoogle();
      setUser(googleUser);
      toast.success("Signed in with Google.");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Google sign-in unavailable right now.");
    }
  };

  const handleSignOut = async () => {
    await weddingService.signOut();
    setUser(null);
    toast.info("You've been signed out.");
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp: handleSignUp,
        signIn: handleSignIn,
        signInWithGoogle: handleGoogle,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
