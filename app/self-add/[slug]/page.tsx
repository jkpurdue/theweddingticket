"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { weddingService } from "@/lib/data-service";
import type { Wedding } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Heart, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function SelfAddPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    plusOnes: "1",
  });

  useEffect(() => {
    loadWedding();
  }, [slug]);

  async function loadWedding() {
    setLoading(true);
    const w = await weddingService.getWeddingBySlug(slug);
    if (!w) {
      toast.error("This wedding page could not be found.");
      setLoading(false);
      return;
    }
    setWedding(w);
    setLoading(false);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateForm = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wedding) return;

    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error("Please enter your full name and email address");
      return;
    }

    const plusOnesNum = parseInt(form.plusOnes) || 1;

    setSubmitting(true);
    try {
      await weddingService.addSelfAddedGuest(wedding.id, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        plusOnes: plusOnesNum,
      });

      setSubmitted(true);
      toast.success("You've been added to the guest list!");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">This self-add link is not valid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const coupleNames = `${wedding.partner1Name} & ${wedding.partner2Name}`;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="premium-card text-center">
            <CardContent className="pt-12 pb-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald/10 flex items-center justify-center mb-6">
                <Heart className="h-8 w-8 text-emerald" />
              </div>
              <h1 className="font-serif text-3xl tracking-tight mb-3">Thank you!</h1>
              <p className="text-lg text-muted-foreground mb-6">You&apos;ve been added to the guest list for {coupleNames}&apos;s wedding.</p>
              <p className="text-sm text-muted-foreground">The couple will review and confirm your details soon. We can&apos;t wait to celebrate with you!</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-primary" />
            <span className="text-sm uppercase tracking-[3px] text-muted-foreground">You&apos;re Invited</span>
          </div>
          <h1 className="font-serif text-4xl tracking-[-1.5px] mb-2">Join {coupleNames} Wedding</h1>
          <p className="text-muted-foreground">Add yourself to the guest list</p>
          <p className="text-xs text-muted-foreground mt-1">{formatDate(wedding.weddingDate)} · {wedding.venueCity}</p>
        </div>

        <Card className="premium-card">
          <CardContent className="pt-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="fullName" className="text-sm">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => updateForm("fullName", e.target.value)}
                  placeholder="Alex Rivera"
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm">Email Address <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  placeholder="you@email.com"
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="plusOnes" className="text-sm">How many in your party? (including yourself)</Label>
                <Input
                  id="plusOnes"
                  type="number"
                  min="1"
                  value={form.plusOnes}
                  onChange={(e) => updateForm("plusOnes", e.target.value)}
                  className="mt-1.5 w-24"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Default is 1 (just you). Add more for plus ones or family.</p>
              </div>

              <Button 
                type="submit" 
                variant="elegant" 
                className="w-full h-11 text-base" 
                disabled={submitting}
              >
                {submitting ? "Adding you..." : "Add Myself to Guest List"}
              </Button>

              <p className="text-[10px] text-center text-muted-foreground">
                Your details will be sent to the couple for confirmation. This is optional and graceful.
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-xs text-muted-foreground">
          Powered by The Wedding Ticket — 100% free for couples
        </div>
      </div>
    </div>
  );
}
