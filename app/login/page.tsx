"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await signIn(email);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6 py-12 bg-[radial-gradient(#e8e0d5_0.6px,transparent_1px)] dark:bg-[radial-gradient(#2f2923_0.6px,transparent_1px)] bg-[length:5px_5px]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-serif text-3xl tracking-[-1px]">
            <img src="/the-wedding-ticket-logo.png" alt="The Wedding Ticket" className="h-8 object-contain" />
          </Link>
        </div>

        <Card className="shadow-lg premium-card">
          <CardContent className="p-9">
            <h1 className="font-serif text-3xl tracking-tight text-center mb-1">Welcome back</h1>
            <p className="text-center text-muted-foreground mb-8 text-sm">Sign in to manage your wedding invitations</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourdomain.com"
                  required
                  className="mt-1.5"
                />
              </div>

              <Button type="submit" variant="elegant" className="w-full mt-2" size="lg" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign in
              </Button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <div className="text-xs text-muted-foreground tracking-widest">OR</div>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button onClick={handleGoogle} variant="outline" className="w-full" size="lg" disabled={loading}>
              Continue with Google
            </Button>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary underline underline-offset-4">Create one for free</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
