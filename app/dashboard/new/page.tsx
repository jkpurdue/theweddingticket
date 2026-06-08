"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { weddingService } from "@/lib/data-service";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function NewWeddingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    partner1Name: "",
    partner2Name: "",
    weddingDate: "",
    ceremonyTime: "16:30",
    venueName: "",
    venueAddress: "",
    venueCity: "",
  });

  // Support guest/demo mode — sign up is optional until you want to persist across devices
  const effectiveUserId = user?.id || 'guest-demo';

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.partner1Name || !form.partner2Name || !form.weddingDate || !form.venueName) {
      toast.error("Please fill out the required fields");
      return;
    }

    setLoading(true);
    try {
      const wedding = await weddingService.createWedding(effectiveUserId, {
        partner1Name: form.partner1Name,
        partner2Name: form.partner2Name,
        weddingDate: form.weddingDate,
        ceremonyTime: form.ceremonyTime,
        venueName: form.venueName,
        venueAddress: form.venueAddress || "Address to be confirmed",
        venueCity: form.venueCity || "Location",
      });

      toast.success(user ? "Wedding created successfully!" : "Wedding created in demo mode! Sign up anytime to save it across devices.");
      router.push(`/dashboard/weddings/${wedding.id}`);
    } catch (error) {
      toast.error("Failed to create wedding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="flex items-center">
          <img src="/the-wedding-ticket-logo.png" alt="The Wedding Ticket" className="h-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </Link>
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to dashboard
        </Link>
      </div>

      <div className="mb-10">
        <h1 className="font-serif text-5xl tracking-[-1.8px]">Create your wedding</h1>
        <p className="text-muted-foreground mt-3 leading-relaxed">This platform is for your one beautiful wedding. We'll start simple — perfect every detail in the planner.</p>
      </div>

      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="font-serif tracking-tight">The essentials</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Partner 1</Label>
                <Input 
                  value={form.partner1Name} 
                  onChange={(e) => update("partner1Name", e.target.value)} 
                  placeholder="Isabella Moreau" 
                  className="mt-1.5" 
                  required 
                />
              </div>
              <div>
                <Label>Partner 2</Label>
                <Input 
                  value={form.partner2Name} 
                  onChange={(e) => update("partner2Name", e.target.value)} 
                  placeholder="James Hale" 
                  className="mt-1.5" 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Wedding date</Label>
                <Input 
                  type="date" 
                  value={form.weddingDate} 
                  onChange={(e) => update("weddingDate", e.target.value)} 
                  className="mt-1.5" 
                  required 
                />
              </div>
              <div>
                <Label>Ceremony time</Label>
                <Input 
                  type="time" 
                  value={form.ceremonyTime} 
                  onChange={(e) => update("ceremonyTime", e.target.value)} 
                  className="mt-1.5" 
                />
              </div>
            </div>

            <div>
              <Label>Venue name</Label>
              <Input 
                value={form.venueName} 
                onChange={(e) => update("venueName", e.target.value)} 
                placeholder="The Conservatory at The Grand Estate" 
                className="mt-1.5" 
                required 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Venue address (optional)</Label>
                <Input 
                  value={form.venueAddress} 
                  onChange={(e) => update("venueAddress", e.target.value)} 
                  placeholder="1425 Willowbrook Lane" 
                  className="mt-1.5" 
                />
              </div>
              <div>
                <Label>City / Region</Label>
                <Input 
                  value={form.venueCity} 
                  onChange={(e) => update("venueCity", e.target.value)} 
                  placeholder="Napa Valley, California" 
                  className="mt-1.5" 
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" size="lg" onClick={() => router.back()} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="elegant" size="lg" disabled={loading} className="flex-1">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create & open planner"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
