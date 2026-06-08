"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Heart } from "lucide-react";
import { toast } from "sonner";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, fullName || undefined);
    } catch (err) {
      // error already toasted in hook
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
          <div className="mt-3 flex justify-center">
            <div className="inline-flex items-center gap-1.5 text-xs tracking-[2px] text-primary/70 border border-primary/20 rounded-full px-4 py-1">
              <Heart className="h-3.5 w-3.5" /> BEGIN YOUR STORY
            </div>
          </div>
        </div>

        <Card className="shadow-lg premium-card">
          <CardContent className="p-9">
            <h1 className="font-serif text-3xl tracking-tight text-center mb-1">Save your progress</h1>
            <p className="text-center text-muted-foreground mb-8 text-sm">Create a free account to keep your wedding saved and access from any device. Explore the tools first without signing up.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="fullName">Full name (optional)</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="mt-1.5"
                />
              </div>
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
                Create free account
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
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline underline-offset-4">Sign in</Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground/60 mt-6 tracking-wide">
          By continuing you agree to our refined (but very reasonable) Terms &amp; Privacy.
        </p>
      </div>
    </div>
  );
}
