"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { weddingService, DEFAULT_CUSTOMIZATION, DEFAULT_RSVP_CONFIG } from "@/lib/data-service";
import type { Wedding, Guest, WeddingTemplate, Rsvp } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Users, 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  ExternalLink, 
  Copy,
  ArrowRight,
  QrCode
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import Papa from "papaparse";
import { InvitationPreview } from "@/components/invitation-preview";
import { GuestTable } from "@/components/guest-table";
import { RsvpList } from "@/components/rsvp-list";
import { SeatingChart } from "@/components/seating-chart";
import { WeddingChecklist } from "@/components/wedding-checklist";
import { CsvImportModal } from "@/components/csv-import-modal";
import { EmailPreviewModal } from "@/components/email-preview-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QRCodeCanvas } from "qrcode.react";

export default function WeddingBuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const weddingId = params.id;

  // Stripe simulation key (moved up for hook order)
  const stripeKey = `stripe-connected-${weddingId}`;

  // Support legacy tab values from old links / history / previous 6-chapter stepper
  const getCanonicalTab = (raw: string | null): string => {
    if (!raw) return "dashboard";
    const legacyMap: Record<string, string> = {
      details: "foundation",
      planning: "foundation",
      design: "invitations",
      email: "invitations",
      seating: "guests",
      rsvps: "guests",
    };
    const valid = ["dashboard", "foundation", "budget", "guests", "invitations"];
    return legacyMap[raw] || (valid.includes(raw) ? raw : "dashboard");
  };

  const initialTab = getCanonicalTab(searchParams.get("tab"));

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const qrRef = useRef<HTMLCanvasElement | null>(null);

  // Controlled tab for the clean 5-step planner (always canonical)
  const [activeTab, setActiveTab] = useState(initialTab);

  // Stripe simulation (demo only, persisted per-wedding in localStorage) - moved up to ensure hooks are called unconditionally before any early returns
  const [isStripeConnected, setIsStripeConnected] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(stripeKey) === 'true';
  });
  const [showMoneyDetails, setShowMoneyDetails] = useState(false);

  // If activeTab ever becomes a legacy value (e.g. via Tabs onValueChange or direct state), normalize it + URL
  const safeSetActiveTab = (next: string) => {
    const canonical = getCanonicalTab(next);
    setActiveTab(canonical);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", canonical);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // On initial mount, if the URL had a legacy tab, rewrite it to the canonical 5-step value (clean address bar)
  useEffect(() => {
    const raw = searchParams.get("tab");
    const canonical = getCanonicalTab(raw);
    if (raw && raw !== canonical) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", canonical);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, []); // run once on mount

  const [giftSummary, setGiftSummary] = useState<{ expected: number; received: number; countReceived: number } | null>(null);

  // Quick gift recording state for Step E polish
  const [quickGiftGuestId, setQuickGiftGuestId] = useState("");
  const [quickGiftAmount, setQuickGiftAmount] = useState(0);

  // Form state for details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [details, setDetails] = useState<any>({});

  useEffect(() => {
    if (weddingId) loadAll();
  }, [weddingId]);

  // Guided tour hint from onboarding
  useEffect(() => {
    if (searchParams.get("tour") === "true" && wedding) {
      toast.success("Welcome to Our Wedding.", {
        description: "Follow the 4 clear steps. Start with The Foundation.",
      });
    }
  }, [searchParams, wedding]);

  async function loadAll() {
    setLoading(true);
    const w = await weddingService.getWeddingById(weddingId);
    if (!w) {
      toast.error("Wedding not found");
      router.push("/dashboard");
      return;
    }
    setWedding(w);
    setDetails({
      ...w,
      customization: { ...w.customization },
      rsvpConfig: { ...w.rsvpConfig },
    });

    const g = await weddingService.getGuestsForWedding(weddingId);
    setGuests(g);

    const r = await weddingService.getRsvpsForWedding(weddingId);
    setRsvps(r);

    const gSum = await weddingService.getGiftSummary(weddingId);
    setGiftSummary(gSum);

    setLoading(false);
  }

  const saveWedding = async (updates: Partial<Wedding>) => {
    if (!wedding) return;
    setSaving(true);
    try {
      const updated = await weddingService.updateWedding(wedding.id, updates);
      setWedding(updated);
      setDetails({
        ...updated,
        customization: { ...updated.customization },
        rsvpConfig: { ...updated.rsvpConfig },
      });
      toast.success("Saved");
    } catch (e) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Details handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateDetail = (key: string, value: any) => {
    const newDetails = { ...details, [key]: value };
    setDetails(newDetails);
  };

  const saveDetails = async () => {
    const { customization, rsvpConfig, budget, ...rest } = details;
    await saveWedding({ ...rest, customization, rsvpConfig, budget });
    // Also persist budget via dedicated method for richer data
    if (budget) {
      try {
        await weddingService.updateWeddingBudget(weddingId, budget);
      } catch {}
    }
  };

  // Template & Customization
  const updateTemplate = (template: WeddingTemplate) => {
    const newCustomization = { ...details.customization };
    saveWedding({ template, customization: newCustomization });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateCustomization = (key: keyof Wedding["customization"], value: any) => {
    const newCust = { ...details.customization, [key]: value };
    setDetails({ ...details, customization: newCust });
    // Auto save on color / style change for nice live feel
    saveWedding({ customization: newCust });
  };

  // Guest management
  const addGuest = async () => {
    const name = prompt("Guest full name?");
    if (!name) return;
    const suggested = details.budget?.suggestedPerGuestGift || 150;
    const g = await weddingService.addGuest(weddingId, {
      fullName: name,
      side: "both",
      plusOne: false,
      suggestedContribution: suggested,
    });
    setGuests([...guests, g]);
    toast.success("Guest added with suggested contribution");
  };

  // CSV import now uses beautiful column mapper modal (PR7)
  const openCsvImport = () => setCsvModalOpen(true);

  const handleDeleteGuest = async (guestId: string) => {
    await weddingService.deleteGuest(guestId);
    setGuests(guests.filter((g) => g.id !== guestId));
  };

  const handleUpdateGuestStatus = async (guestId: string, status: Guest["status"]) => {
    const updated = await weddingService.updateGuest(guestId, { status });
    setGuests(guests.map((g) => (g.id === guestId ? updated : g)));
  };

  const handleGiftUpdate = async (guestId: string, updates: Partial<Guest>) => {
    const updated = await weddingService.updateGuest(guestId, updates);
    setGuests(guests.map((g) => (g.id === guestId ? updated : g)));
    // Optionally refresh dashboard-like summaries if needed
  };

  // RSVP Config
  const toggleRsvpField = (field: keyof Wedding["rsvpConfig"]) => {
    const current = { ...details.rsvpConfig };
    (current as unknown as Record<string, boolean | string[]>)[field] = !(current as unknown as Record<string, boolean | string[]>)[field];
    setDetails({ ...details, rsvpConfig: current });
    saveWedding({ rsvpConfig: current });
  };

  const updateMealChoices = (val: string) => {
    const choices = val.split(",").map((s) => s.trim()).filter(Boolean);
    const newCfg = { ...details.rsvpConfig, mealChoices: choices };
    setDetails({ ...details, rsvpConfig: newCfg });
  };

  const copyLink = () => {
    if (!wedding) return;
    const url = `${window.location.origin}/invite/${wedding.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Invitation link copied to clipboard");
  };

  if (loading || !wedding) {
    return <div className="p-12 text-center text-muted-foreground">Loading beautiful details…</div>;
  }

  const publicUrl = `/invite/${wedding.slug}`;

  // Budget calculations - accurate and live
  const budget = details.budget || { total: 0, spent: 0, categories: [] as unknown[] };
  const sumCategories = (budget.categories || []).reduce((sum: number, c: unknown) => sum + ((c as Record<string, number>).budgeted || 0), 0);
  const remaining = (budget.total || 0) - sumCategories;
  const isOverBudget = sumCategories > (budget.total || 0);

  // New smart attendee calculations (live)
  const totalExpectedInvitees = budget.totalExpectedInvitees ?? 175;
  const expectedAttendanceRate = budget.expectedAttendanceRate ?? 75;
  const expectedAttendees = Math.round(totalExpectedInvitees * (expectedAttendanceRate / 100));
  const computedSuggested = (budget.total || 0) > 0 && expectedAttendees > 0 
    ? Math.round((budget.total || 0) / expectedAttendees) 
    : 150;
  const displayedSuggested = budget.suggestedPerGuestGift ?? computedSuggested;

  // Quick metrics for dashboard overview
  const emailsSent = guests.filter((g: unknown) => (g as Guest & { emailSentAt?: string }).emailSentAt).length;

  // Simple readiness %
  const readiness = Math.round(
    ((guests.length > 0 ? 1 : 0) +
     (rsvps.length > 0 ? 1 : 0) +
     (emailsSent > 0 ? 1 : 0) +
     ((budget.total || 0) > 0 ? 1 : 0)) / 4 * 100
  );

  // For dashboard summaries
  const totalGuests = guests.length;
  const rsvpsReceived = rsvps.length;
  const pending = Math.max(0, totalGuests - rsvpsReceived);

  // Note: isStripeConnected and showMoneyDetails useState moved to top of component for proper hook ordering (before early return)
  const stripeAccount = isStripeConnected ? 'acct_****1234 (Demo Stripe Express)' : null;

  const handleStripeConnect = () => {
    const newConnected = !isStripeConnected;
    setIsStripeConnected(newConnected);
    if (typeof window !== 'undefined') {
      localStorage.setItem(stripeKey, newConnected.toString());
    }
    if (newConnected) {
      toast.success('Stripe account connected!', {
        description: 'Demo mode: This would launch Stripe Express Connect onboarding in production.',
      });
    } else {
      toast.info('Stripe account disconnected (demo)');
    }
  };

  // Recent contributions for the section
  const recentContributions = [...guests]
    .filter((g: any) => g.giftReceived && g.actualGiftAmount && g.actualGiftAmount > 0)
    .slice(-5)
    .reverse()
    .map((g: any) => ({
      name: g.fullName,
      amount: g.actualGiftAmount,
      date: 'Recently', // demo
    }));

  const totalReceived = giftSummary?.received || 0;
  const pendingPayout = Math.floor(totalReceived * 0.2); // demo pending
  const availablePayout = totalReceived - pendingPayout;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <img src="/the-wedding-ticket-logo.png" alt="The Wedding Ticket" className="h-5 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <span className="text-sm tracking-[1px]">Back to Our Wedding</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={copyLink} className="text-sm">
              <Copy className="h-4 w-4 mr-2" /> Copy link
            </Button>
            <Button variant="elegant" asChild className="text-sm">
              <Link href={publicUrl} target="_blank">Preview invitation</Link>
            </Button>
          </div>
        </div>
        <div>
          <div className="font-serif text-5xl md:text-6xl tracking-[-1.8px] leading-none mb-1">{wedding.partner1Name} &amp; {wedding.partner2Name}</div>
          <div className="text-lg text-muted-foreground tracking-tight flex items-center gap-2">
            {formatDate(wedding.weddingDate)} · {wedding.venueCity}
            <span className="text-primary/20 mx-1">·</span>
            <span className="text-sm font-medium">Readiness {readiness}%</span>
            <span className="text-primary/20 mx-1">·</span>
            <Link href={publicUrl} target="_blank" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              View invitation <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5-Step Navigation — Clean, prominent, elegant */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="text-xs uppercase tracking-[3px] text-muted-foreground">Your Wedding • 5 Clear Steps</div>
          <div className="text-xs text-muted-foreground tabular-nums">Step {["dashboard","foundation","budget","guests","invitations"].indexOf(activeTab) + 1} of 5</div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { key: "dashboard", label: "The Dashboard", number: "01" },
            { key: "foundation", label: "The Foundation", number: "02" },
            { key: "budget", label: "The Budget", number: "03" },
            { key: "guests", label: "The Guests", number: "04" },
            { key: "invitations", label: "The Invitations", number: "05" },
          ].map((s, idx) => {
            const isActive = activeTab === s.key;
            const isPast = ["dashboard","foundation","budget","guests","invitations"].indexOf(activeTab) > idx;
            return (
              <button
                key={idx}
                onClick={() => safeSetActiveTab(s.key)}
                className={`px-5 py-2 text-sm rounded-full border transition-all flex items-center gap-2 ${isActive ? "bg-foreground text-background border-foreground" : isPast ? "bg-emerald/5 border-emerald/20 text-emerald hover:bg-emerald/10" : "bg-background hover:bg-muted border-border text-foreground"}`}
              >
                <span className="font-mono text-xs opacity-60">{s.number}</span>
                <span className={isActive ? "font-medium" : ""}>{s.label}</span>
              </button>
            );
          })}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1.5 px-1">Five clear steps to plan your wedding with clarity and calm.</div>
      </div>

      <Tabs value={activeTab} onValueChange={safeSetActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto hidden">
          {/* 5-step navigation is the prominent pills above; this list kept for a11y / keyboard users */}
          <TabsTrigger value="dashboard">01 — The Dashboard</TabsTrigger>
          <TabsTrigger value="foundation">02 — The Foundation</TabsTrigger>
          <TabsTrigger value="budget">03 — The Budget</TabsTrigger>
          <TabsTrigger value="guests">04 — The Guests</TabsTrigger>
          <TabsTrigger value="invitations">05 — The Invitations</TabsTrigger>
        </TabsList>

        {/* 1. THE DASHBOARD — command center with funding, responses, invite preview */}
        <TabsContent value="dashboard" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left / Main Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Funding & Payments (Stripe integration demo) */}
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="font-serif">Funding &amp; Payments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Stripe Connection Status */}
                  <div>
                    <div className="text-xs tracking-[2px] text-muted-foreground mb-2">STRIPE CONNECTION</div>
                    {isStripeConnected ? (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-emerald/5 border-emerald/20">
                        <div>
                          <div className="font-medium text-emerald">Connected to Stripe</div>
                          <div className="text-xs text-muted-foreground">{stripeAccount}</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleStripeConnect}>
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                        <div className="text-sm text-muted-foreground">No Stripe account connected</div>
                        <Button variant="elegant" size="sm" onClick={handleStripeConnect}>
                          Connect Stripe Account
                        </Button>
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground mt-1">In production this uses Stripe Express Connect for instant onboarding and payouts.</div>
                  </div>

                  {/* Key Money Metrics */}
                  <div>
                    <div className="text-xs tracking-[2px] text-muted-foreground mb-2">MONEY METRICS</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 border rounded-lg">
                        <div className="text-xs text-muted-foreground">TOTAL RECEIVED</div>
                        <div className="text-2xl font-light tabular-nums mt-1">${totalReceived.toLocaleString()}</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="text-xs text-muted-foreground">AVAILABLE TO PAYOUT</div>
                        <div className="text-2xl font-light tabular-nums mt-1 text-emerald">${availablePayout.toLocaleString()}</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="text-xs text-muted-foreground">PENDING</div>
                        <div className="text-2xl font-light tabular-nums mt-1 text-amber-600">${pendingPayout.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Contributions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs tracking-[2px] text-muted-foreground">RECENT CONTRIBUTIONS</div>
                      <Button variant="ghost" size="sm" className="text-xs h-auto p-0" onClick={() => safeSetActiveTab('guests')}>
                        View all →
                      </Button>
                    </div>
                    {recentContributions.length > 0 ? (
                      <div className="space-y-2 text-sm">
                        {recentContributions.map((c, idx) => (
                          <div key={idx} className="flex justify-between border rounded px-3 py-1.5 bg-background">
                            <span>{c.name}</span>
                            <span className="font-medium tabular-nums">${c.amount}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground p-3 border rounded bg-muted/30">No contributions yet.</div>
                    )}
                  </div>

                  {/* Money In / Out - simple expandable */}
                  <div>
                    <button
                      onClick={() => setShowMoneyDetails(!showMoneyDetails)}
                      className="flex w-full items-center justify-between text-xs tracking-[2px] text-muted-foreground mb-2 hover:text-foreground"
                    >
                      <span>MONEY IN / OUT</span>
                      <span>{showMoneyDetails ? '−' : '+'}</span>
                    </button>
                    {showMoneyDetails && (
                      <div className="text-xs border rounded p-3 bg-muted/30 space-y-1">
                        <div className="flex justify-between"><span>Guest contributions (in)</span><span className="tabular-nums">+${totalReceived}</span></div>
                        <div className="flex justify-between text-muted-foreground"><span>Payouts / fees (out)</span><span>—</span></div>
                        <div className="pt-1 border-t flex justify-between font-medium"><span>Net (demo)</span><span className="tabular-nums">+${totalReceived}</span></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Funding Progress Bar */}
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="font-serif">Funding Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const target = budget.total || 0;
                    const funded = giftSummary?.received || 0;
                    const percent = target > 0 ? Math.min(100, Math.round((funded / target) * 100)) : 0;
                    return (
                      <>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Total Budget: ${target.toLocaleString()}</span>
                          <span className="font-medium">Funded: ${funded.toLocaleString()} ({percent}%)</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden mb-1">
                          <div 
                            className="h-3 bg-sage rounded-full transition-all" 
                            style={{ width: `${percent}%` }} 
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Guest contributions towards budget
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Quick Guest Responses summary */}
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="font-serif">Guest Responses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-light tabular-nums tracking-tight text-sage">{rsvpsReceived}</div>
                      <div className="text-xs tracking-[1.5px] text-muted-foreground mt-1">RSVP RECEIVED</div>
                    </div>
                    <div>
                      <div className="text-3xl font-light tabular-nums tracking-tight">{pending}</div>
                      <div className="text-xs tracking-[1.5px] text-muted-foreground mt-1">PENDING</div>
                    </div>
                    <div>
                      <div className="text-3xl font-light tabular-nums tracking-tight">{totalGuests}</div>
                      <div className="text-xs tracking-[1.5px] text-muted-foreground mt-1">TOTAL GUESTS</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1">
              {/* Wedding Invitation Preview */}
              <Card className="premium-card h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="font-serif">Wedding Invitation Preview</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div 
                    className="flex-1 border rounded-lg p-4 bg-white text-center mb-4 flex flex-col justify-center"
                    style={{ borderColor: details.customization?.accentColor || '#C5A46E' }}
                  >
                    <div className="font-serif text-lg tracking-tight mb-1">
                      {wedding.partner1Name} &amp; {wedding.partner2Name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(wedding.weddingDate)} · {wedding.venueCity}
                    </div>
                    {details.customization?.showCoverPhoto && details.customization?.coverPhotoUrl && (
                      <div 
                        className="mt-3 h-12 bg-cover bg-center rounded border" 
                        style={{ backgroundImage: `url(${details.customization.coverPhotoUrl})` }} 
                      />
                    )}
                    <div className="mt-2 text-[10px] uppercase tracking-[2px] text-muted-foreground/70">
                      {details.template || 'Classic'} Design
                    </div>
                  </div>
                  <Button 
                    variant="elegant" 
                    className="w-full" 
                    onClick={() => safeSetActiveTab('invitations')}
                  >
                    Preview Invitation
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 2. THE FOUNDATION — details, vision, party (via notes), checklist */}
        <TabsContent value="foundation" className="space-y-8">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="font-serif">Wedding Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Partner 1</Label>
                  <Input value={details.partner1Name} onChange={(e) => updateDetail("partner1Name", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Partner 2</Label>
                  <Input value={details.partner2Name} onChange={(e) => updateDetail("partner2Name", e.target.value)} className="mt-1.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Wedding Date</Label>
                  <Input type="date" value={details.weddingDate} onChange={(e) => updateDetail("weddingDate", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Ceremony Time</Label>
                  <Input type="time" value={details.ceremonyTime} onChange={(e) => updateDetail("ceremonyTime", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Reception Time (optional)</Label>
                  <Input type="time" value={details.receptionTime || ""} onChange={(e) => updateDetail("receptionTime", e.target.value)} className="mt-1.5" />
                </div>
              </div>

              <div>
                <Label>Venue Name</Label>
                <Input value={details.venueName} onChange={(e) => updateDetail("venueName", e.target.value)} className="mt-1.5" />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Address</Label>
                  <Input value={details.venueAddress} onChange={(e) => updateDetail("venueAddress", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>City, State</Label>
                  <Input value={details.venueCity} onChange={(e) => updateDetail("venueCity", e.target.value)} className="mt-1.5" />
                </div>
              </div>

              <div>
                <Label>Dress Code</Label>
                <Input value={details.dressCode || ""} onChange={(e) => updateDetail("dressCode", e.target.value)} placeholder="Black Tie / Cocktail / Garden Attire" className="mt-1.5" />
              </div>

              <div>
                <Label>Welcome Message (shown on invitation)</Label>
                <Textarea 
                  value={details.welcomeMessage || ""} 
                  onChange={(e) => updateDetail("welcomeMessage", e.target.value)} 
                  rows={3} 
                  className="mt-1.5" 
                  placeholder="We joyfully invite you to celebrate our marriage..." 
                />
              </div>

              <div>
                <Label>Additional Information for Guests</Label>
                <Textarea 
                  value={details.additionalInfo || ""} 
                  onChange={(e) => updateDetail("additionalInfo", e.target.value)} 
                  rows={3} 
                  className="mt-1.5" 
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button onClick={saveDetails} variant="elegant" disabled={saving}>
                  {saving ? "Saving..." : "Save Wedding Details"}
                </Button>
                <Button variant="outline" onClick={() => safeSetActiveTab("budget")}>
                  Next: The Budget <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Checklist lives here in The Foundation per the 5-step structure */}
          <WeddingChecklist 
            weddingId={weddingId} 
            weddingDate={wedding.weddingDate} 
            onUpdate={async () => {
              // component is self-contained; dashboard stats refresh on return
            }} 
          />
        </TabsContent>

        {/* 2. THE BUDGET — total, saved, categories, suggested per guest, remaining — all live */}
        <TabsContent value="budget" className="space-y-6">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="font-serif">The Budget</CardTitle>
              <p className="text-sm text-muted-foreground">Plan your total, break it into categories, see how much you have saved, and get a smart suggested contribution per expected guest. Everything updates live.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="text-xs">Total Budget</Label>
                  <Input 
                    type="number" 
                    value={budget.total || 0} 
                    onChange={(e) => {
                      const total = parseInt(e.target.value) || 0;
                      const invitees = budget.totalExpectedInvitees ?? 175;
                      const rate = budget.expectedAttendanceRate ?? 75;
                      const att = Math.round(invitees * (rate / 100));
                      const sug = att > 0 && total > 0 ? Math.round(total / att) : (budget.suggestedPerGuestGift ?? 150);
                      const newBudget = { ...(details.budget || {}), total, suggestedPerGuestGift: sug };
                      updateDetail("budget", newBudget);
                    }} 
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-xs">Amount Saved / Out of Pocket</Label>
                  <Input 
                    type="number" 
                    value={budget.spent || 0} 
                    onChange={(e) => {
                      const spent = parseInt(e.target.value) || 0;
                      const newBudget = { ...(details.budget || {}), spent };
                      updateDetail("budget", newBudget);
                    }} 
                    className="mt-1" 
                  />
                  <div className="text-[10px] text-muted-foreground mt-0.5">Separate from planned categories (your actual contribution so far)</div>
                </div>
                <div>
                  <Label className="text-xs">Remaining</Label>
                  <div className={`mt-1 h-11 flex items-center px-3 border rounded bg-muted/30 font-medium tabular-nums ${isOverBudget ? 'text-red-600 border-red-300' : 'text-sage'}`}>
                    ${remaining.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Total Budget − Sum of Categories</div>
                </div>
              </div>

              {/* Smart attendee-based fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-xs">Total Expected Invitees</Label>
                  <Input 
                    type="number" 
                    value={budget.totalExpectedInvitees ?? 175} 
                    onChange={(e) => {
                      const invitees = Math.max(0, parseInt(e.target.value) || 175);
                      const total = budget.total || 0;
                      const rate = budget.expectedAttendanceRate ?? 75;
                      const att = Math.round(invitees * (rate / 100));
                      const sug = att > 0 && total > 0 ? Math.round(total / att) : (budget.suggestedPerGuestGift ?? 150);
                      const newBudget = { ...(details.budget || {}), totalExpectedInvitees: invitees, suggestedPerGuestGift: sug };
                      updateDetail("budget", newBudget);
                    }} 
                    className="mt-1" 
                  />
                  <div className="text-[10px] text-muted-foreground mt-0.5">How many people you plan to invite</div>
                </div>
                <div>
                  <Label className="text-xs">Expected Attendance Rate</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <input 
                      type="range" 
                      min="50" 
                      max="100" 
                      step="1" 
                      value={budget.expectedAttendanceRate ?? 75} 
                      onChange={(e) => {
                        const rate = parseInt(e.target.value) || 75;
                        const total = budget.total || 0;
                        const invitees = budget.totalExpectedInvitees ?? 175;
                        const att = Math.round(invitees * (rate / 100));
                        const sug = att > 0 && total > 0 ? Math.round(total / att) : (budget.suggestedPerGuestGift ?? 150);
                        const newBudget = { ...(details.budget || {}), expectedAttendanceRate: rate, suggestedPerGuestGift: sug };
                        updateDetail("budget", newBudget);
                      }} 
                      className="flex-1 accent-rose" 
                    />
                    <span className="w-12 text-right text-sm tabular-nums font-medium">{budget.expectedAttendanceRate ?? 75}%</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Expected Attendees: <span className="font-medium">{Math.round((budget.totalExpectedInvitees ?? 175) * ((budget.expectedAttendanceRate ?? 75) / 100))}</span>
                    <span className="ml-1">— Most weddings see 70-80% attendance</span>
                  </div>
                </div>
              </div>

              {/* Common Categories */}
              {budget.categories && budget.categories.length > 0 && (
                <div>
                  <Label className="text-xs mb-2 block">Common Wedding Categories (Planned Amounts)</Label>
                  <div className="flex justify-between text-xs mb-1 font-medium">
                    <span>Sum of Categories (auto)</span>
                    <span className={isOverBudget ? 'text-red-600' : ''}>
                      ${sumCategories.toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {budget.categories.map((cat: unknown, i: number) => {
                      const c = cat as { id?: string; name?: string; budgeted?: number };
                      return (
                        <div key={c.id || i} className="flex justify-between border rounded px-3 py-1.5 bg-background">
                          <span className="text-xs truncate pr-2">{c.name}</span>
                          <Input 
                            type="number" 
                            value={c.budgeted || 0} 
                            onChange={(e) => {
                              const newCats = [...(details.budget.categories || [])];
                              newCats[i] = { ...newCats[i], budgeted: parseInt(e.target.value) || 0 };
                              const newB = { ...(details.budget || {}), categories: newCats };
                              updateDetail("budget", newB);
                            }} 
                            className="w-24 h-7 text-xs text-right" 
                          />
                        </div>
                      );
                    })}
                  </div>
                  {isOverBudget && (
                    <div className="text-xs text-red-600 mt-1 font-medium">⚠ Sum of planned categories exceeds Total Budget</div>
                  )}
                  <div className="text-[10px] text-muted-foreground mt-1">These are your target spends per category. Adjust as needed. Sum updates automatically.</div>
                </div>
              )}

              {/* Smart Suggested Contribution per Guest */}
              <div className="mt-4">
                <Label className="text-xs">Suggested Contribution per Guest</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    type="number" 
                    value={displayedSuggested} 
                    onChange={(e) => {
                      const sug = parseInt(e.target.value) || 0;
                      const newBudget = { ...(details.budget || {}), suggestedPerGuestGift: sug };
                      updateDetail("budget", newBudget);
                    }} 
                    className="w-32" 
                  />
                  <span className="text-xs text-muted-foreground">per guest (shown on invites as optional gift)</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  This is the average amount needed per guest to cover your budget (Total Budget ÷ Expected Attendees). You can override this value.
                </div>
              </div>

              <div className="mt-3 text-[10px] text-muted-foreground">
                Numbers feed your guest suggestions, gift tracking, and dashboard progress.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={saveDetails} variant="elegant" disabled={saving}>
                  {saving ? "Saving..." : "Save Budget"}
                </Button>
                <Button variant="outline" onClick={() => safeSetActiveTab("guests")}>
                  Next: The Guests <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. THE GUESTS — list, CSV, RSVP tracking, seating chart, gift contributions */}
        <TabsContent value="guests" className="space-y-8">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="font-serif flex items-center gap-2">
                <Users className="h-5 w-5" /> Guest List
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button onClick={openCsvImport} variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" /> Import CSV / Excel
                </Button>
                <Button onClick={addGuest} variant="elegant" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Add guest
                </Button>
                <Button onClick={() => setQrModalOpen(true)} variant="outline" size="sm">
                  <QrCode className="h-4 w-4 mr-2" /> Generate Self-Add QR Code
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    const csv = Papa.unparse(guests.map(g => ({
                      name: g.fullName, email: g.email || "", phoneNumber: g.phone || "", plusOnes: g.plusOnes ?? (g.plusOne ? 1 : 0), side: g.side, selfAdded: g.selfAdded ? "yes" : ""
                    })));
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${wedding.slug}-guests.csv`;
                    a.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-1.5" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-3">
                Supports: name (or fullName), email, phoneNumber (or phone), plusOnes (or plusOne). Missing values ok. Use the mapper for custom columns.
              </div>
              <GuestTable 
                guests={guests} 
                onDelete={handleDeleteGuest} 
                onStatusChange={handleUpdateGuestStatus} 
                onGiftUpdate={handleGiftUpdate}
              />
            </CardContent>
          </Card>

          {/* Self-Add QR Code Modal */}
          <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-serif">Self-Add QR Code</DialogTitle>
                <DialogDescription>
                  Share this QR code with friends &amp; family so they can add themselves to the guest list.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center py-4">
                {wedding && (
                  <>
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                      <QRCodeCanvas 
                        ref={qrRef}
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/self-add/${wedding.slug}`} 
                        size={220}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                    <div className="text-xs text-center text-muted-foreground mt-4 max-w-[220px]">
                      Guests scan to open a simple form and add themselves. Perfect for last-minute invites or open guest lists.
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const canvas = qrRef.current;
                          if (canvas) {
                            const url = canvas.toDataURL('image/png');
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${wedding.slug}-self-add-qr.png`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }
                        }}
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" /> Download PNG
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (!wedding) return;
                          const url = `${window.location.origin}/self-add/${wedding.slug}`;
                          navigator.clipboard.writeText(url);
                          toast.success("Self-add link copied to clipboard");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Link
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Seating Chart integrated under Guests */}
          <div className="space-y-3">
            <div className="px-1 flex items-center justify-between">
              <div>
                <div className="font-serif text-xl tracking-tight">Seating Chart</div>
                <div className="text-xs text-muted-foreground">Drag to arrange. All changes save automatically.</div>
              </div>
            </div>
            <SeatingChart 
              weddingId={weddingId} 
              guests={guests} 
              onUpdate={async () => {
                const refreshed = await weddingService.getGuestsForWedding(weddingId);
                setGuests(refreshed);
              }} 
            />
          </div>

          {/* RSVP Tracking + Gift Contributions integrated under Guests */}
          <div className="space-y-6">
            <div className="mb-2 px-1">
              <div className="font-serif text-xl tracking-tight">RSVPs &amp; Gift Tracking</div>
              <div className="text-xs text-muted-foreground">Track responses and gifts received against your suggested amounts from The Budget.</div>
            </div>

            <div className="mb-6 p-4 border rounded-xl bg-card">
              <div className="font-medium mb-1 flex items-center justify-between">
                <span>Gift Tracking</span>
                {giftSummary && (
                  <span className="text-sm font-normal text-emerald">
                    ${giftSummary.received} / ${giftSummary.expected} received
                  </span>
                )}
              </div>
              {giftSummary && giftSummary.expected > 0 && (
                <div className="h-2 bg-muted rounded overflow-hidden mb-2">
                  <div className="h-2 bg-champagne" style={{ width: `${Math.min(100, Math.round((giftSummary.received / giftSummary.expected) * 100))}%` }} />
                </div>
              )}
              <div className="text-sm text-muted-foreground mb-3">Track actual gifts received against the suggested amounts set in The Budget.</div>

              {/* Quick gift recorder */}
              <div className="border-t pt-3 mt-3">
                <div className="text-xs font-medium mb-2">Quick record a gift</div>
                <div className="flex flex-wrap gap-2 items-end">
                  <select 
                    value={quickGiftGuestId} 
                    onChange={e => setQuickGiftGuestId(e.target.value)}
                    className="border rounded px-2 py-1 text-sm bg-background flex-1 min-w-[140px]"
                  >
                    <option value="">Select guest...</option>
                    {guests.filter(g => g.email || g.suggestedContribution).map(g => (
                      <option key={g.id} value={g.id}>{g.fullName} {g.suggestedContribution ? `(suggested $${g.suggestedContribution})` : ''}</option>
                    ))}
                  </select>
                  {guests.length === 0 && (
                    <div className="text-xs text-amber-600 w-full">No guests yet — add some above to enable gift tracking.</div>
                  )}
                  <Input 
                    type="number" 
                    placeholder="Amount" 
                    value={quickGiftAmount || ''} 
                    onChange={e => setQuickGiftAmount(parseInt(e.target.value) || 0)}
                    className="w-24 h-9 text-sm" 
                  />
                  <Button 
                    size="sm" 
                    variant="elegant" 
                    onClick={async () => {
                      if (!quickGiftGuestId || quickGiftAmount <= 0) return;
                      await handleGiftUpdate(quickGiftGuestId, { actualGiftAmount: quickGiftAmount, giftReceived: true });
                      const gSum = await weddingService.getGiftSummary(weddingId);
                      setGiftSummary(gSum);
                      toast.success("Gift recorded!");
                      setQuickGiftGuestId("");
                      setQuickGiftAmount(0);
                    }}
                    disabled={!quickGiftGuestId || quickGiftAmount <= 0}
                  >
                    Record Gift
                  </Button>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">Or edit directly in the guest table above.</div>

                {guests.some(g => g.giftReceived && g.actualGiftAmount) && (
                  <div className="mt-3 pt-3 border-t text-xs">
                    <div className="font-medium mb-1">Gifted guests so far:</div>
                    <div className="flex flex-wrap gap-1">
                      {guests.filter(g => g.giftReceived && g.actualGiftAmount).slice(0, 5).map(g => (
                        <span key={g.id} className="bg-emerald/10 text-emerald px-1.5 py-0.5 rounded text-[10px]">
                          {g.fullName.split(' ')[0]}: ${g.actualGiftAmount}
                        </span>
                      ))}
                      {guests.filter(g => g.giftReceived && g.actualGiftAmount).length > 5 && <span className="text-muted-foreground">+more</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif">RSVP Form Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 text-sm">
                    <div className="flex items-center justify-between py-1">
                      <div>Allow +1 guests</div>
                      <Switch checked={details.rsvpConfig?.allowPlusOne} onCheckedChange={() => toggleRsvpField("allowPlusOne")} />
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div>Collect meal preferences</div>
                      <Switch checked={details.rsvpConfig?.mealChoicesEnabled} onCheckedChange={() => toggleRsvpField("mealChoicesEnabled")} />
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div>Allow song requests</div>
                      <Switch checked={details.rsvpConfig?.songRequestsEnabled} onCheckedChange={() => toggleRsvpField("songRequestsEnabled")} />
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div>Collect dietary notes</div>
                      <Switch checked={details.rsvpConfig?.dietaryEnabled} onCheckedChange={() => toggleRsvpField("dietaryEnabled")} />
                    </div>

                    {details.rsvpConfig?.mealChoicesEnabled && (
                      <div>
                        <Label className="text-xs">Meal options (comma separated)</Label>
                        <Input 
                          value={(details.rsvpConfig?.mealChoices || []).join(", ")} 
                          onChange={(e) => updateMealChoices(e.target.value)} 
                          onBlur={() => saveWedding({ rsvpConfig: details.rsvpConfig })}
                          className="mt-1.5" 
                        />
                      </div>
                    )}
                    <Button onClick={() => saveWedding({ rsvpConfig: details.rsvpConfig })} variant="outline" size="sm">Save RSVP settings</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-sm text-muted-foreground">
                    Guests can RSVP at the public link. Their responses will appear here and automatically update guest status when email or name matches.
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3">
                <RsvpList rsvps={rsvps} guests={guests} wedding={wedding} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => safeSetActiveTab("invitations")}>
              Next: The Invitations <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </TabsContent>

        {/* 4. THE INVITATIONS — builder, templates, preview, send via email or link, tracking */}
        <TabsContent value="invitations" className="space-y-8">
          {/* Invitation Design + Templates + Live Preview */}
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle className="font-serif">Choose a Template</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {(["classic", "modern", "floral", "minimal"] as WeddingTemplate[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => updateTemplate(t)}
                        className={`p-4 rounded-lg border text-left transition ${wedding.template === t ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:border-primary/40"}`}
                      >
                        <div className="font-medium capitalize">{t}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t === "classic" && "Timeless serif with gold accents"}
                          {t === "modern" && "Clean lines, contemporary feel"}
                          {t === "floral" && "Romantic botanical details"}
                          {t === "minimal" && "Understated elegance"}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="font-serif">Customization</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <input 
                        type="color" 
                        value={details.customization?.accentColor || "#C5A46E"} 
                        onChange={(e) => updateCustomization("accentColor", e.target.value)} 
                        className="h-11 w-16 p-1 bg-background border rounded" 
                      />
                      <Input 
                        value={details.customization?.accentColor || "#C5A46E"} 
                        onChange={(e) => updateCustomization("accentColor", e.target.value)} 
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Typography Style</Label>
                    <div className="flex gap-2 mt-2">
                      {(["serif", "script", "sans"] as const).map((fs) => (
                        <Button 
                          key={fs} 
                          size="sm" 
                          variant={details.customization?.fontStyle === fs ? "elegant" : "outline"} 
                          onClick={() => updateCustomization("fontStyle", fs)}
                        >
                          {fs}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Background Style</Label>
                    <div className="flex gap-2 mt-2">
                      {(["paper", "gradient", "subtle"] as const).map((bs) => (
                        <Button 
                          key={bs} 
                          size="sm" 
                          variant={details.customization?.backgroundStyle === bs ? "elegant" : "outline"} 
                          onClick={() => updateCustomization("backgroundStyle", bs)}
                        >
                          {bs}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Cover Photo */}
                  <div>
                    <Label>Cover Photo</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Switch
                        checked={!!details.customization?.showCoverPhoto}
                        onCheckedChange={(checked) => updateCustomization("showCoverPhoto", checked)}
                      />
                      <span className="text-sm text-muted-foreground">Display on invitation</span>
                    </div>
                    {details.customization?.showCoverPhoto && (
                      <div className="mt-3 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => updateCustomization("coverPhotoUrl", "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80")}
                          >
                            Use elegant venue (demo)
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => updateCustomization("coverPhotoUrl", "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=80")}
                          >
                            Use elegant reception (demo)
                          </Button>
                          <label className="inline-flex items-center cursor-pointer">
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                // Resize to elegant banner size (1200x400 max) to avoid cropping issues
                                const img = new Image();
                                const url = URL.createObjectURL(file);
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  const ctx = canvas.getContext('2d')!;
                                  const maxW = 1200, maxH = 400;
                                  const w = img.width, h = img.height;
                                  const ratio = Math.min(maxW / w, maxH / h, 1);
                                  canvas.width = Math.round(w * ratio);
                                  canvas.height = Math.round(h * ratio);
                                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                                  updateCustomization("coverPhotoUrl", dataUrl);
                                  URL.revokeObjectURL(url);
                                };
                                img.src = url;
                                e.target.value = "";
                              }} 
                            />
                            <span className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted">Upload photo</span>
                          </label>
                        </div>
                        {details.customization?.coverPhotoUrl && (
                          <div className="text-[10px] text-emerald-600">✓ Cover photo set (updates live preview)</div>
                        )}
                      </div>
                    )}
                  </div>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground px-1">
              Changes save automatically. The preview on the right updates live.
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-3">
            <div className="sticky top-8">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium tracking-widest text-muted-foreground">LIVE PREVIEW</div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={publicUrl} target="_blank">Open full page <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Link>
                </Button>
              </div>
              <InvitationPreview wedding={details} />
            </div>
          </div>
        </div>

          {/* Send via Email or Link + Tracking */}
          <div className="max-w-2xl space-y-4">
            <h3 className="font-serif text-2xl tracking-tight mb-2">Send &amp; Track</h3>
            <p className="text-muted-foreground">Preview a gorgeous email that perfectly matches your invitation design. Send to any guests with emails on file. Opens are tracked (demo mode). Or simply copy the link and share anywhere.</p>

            {/* Live status summary from guests */}
            <div className="mb-6 grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-lg border p-3 bg-card">
                <div className="text-2xl font-light tabular-nums tracking-tight text-champagne">{guests.filter(g => g.emailSentAt).length}</div>
                <div className="text-[10px] tracking-widest text-muted-foreground">SENT</div>
              </div>
              <div className="rounded-lg border p-3 bg-card">
                <div className="text-2xl font-light tabular-nums tracking-tight text-emerald">{guests.filter(g => g.emailOpenedAt).length}</div>
                <div className="text-[10px] tracking-widest text-muted-foreground">OPENED (demo)</div>
              </div>
              <div className="rounded-lg border p-3 bg-card">
                <div className="text-2xl font-light tabular-nums tracking-tight">{guests.filter(g => g.email && !g.emailSentAt).length}</div>
                <div className="text-[10px] tracking-widest text-muted-foreground">READY TO SEND</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button variant="elegant" size="lg" onClick={() => setEmailModalOpen(true)}>
                Open Email Composer &amp; Preview
              </Button>
              <Button variant="outline" size="lg" onClick={() => {
                if (!wedding) return;
                const url = `${window.location.origin}/invite/${wedding.slug}`;
                navigator.clipboard.writeText(url);
                toast.success("Invitation link copied");
              }}>
                Copy shareable link
              </Button>
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              In production this would deliver via a real transactional provider with open tracking pixels and compliance headers. (Demo marks random opens.)
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground pt-2">You have completed the four clear steps. Everything is organized, elegant, and ready for your guests.</div>
        </TabsContent>
      </Tabs>

        <CsvImportModal
          open={csvModalOpen}
          onOpenChange={setCsvModalOpen}
          weddingId={weddingId}
          onImported={(count) => {
            weddingService.getGuestsForWedding(weddingId).then(setGuests);
          }}
        />

        <EmailPreviewModal
          open={emailModalOpen}
          onOpenChange={setEmailModalOpen}
          wedding={wedding}
          guests={guests}
          onSent={() => {
            weddingService.getGuestsForWedding(weddingId).then(setGuests);
          }}
        />
    </div>
  );
}
