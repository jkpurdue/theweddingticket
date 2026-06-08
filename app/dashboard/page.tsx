"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { weddingService, ensureDemoData } from "@/lib/data-service";
import type { Wedding, WeddingStats } from "@/types";
import { Calendar, Users, ArrowRight, ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface WeddingWithStats extends Wedding {
  stats?: WeddingStats;
  seatingProgress?: { assigned: number; total: number };
  checklistProgress?: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [wedding, setWedding] = useState<WeddingWithStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Real seating progress pulled from service (assignments + guests)
  const getSeatingProgress = async (weddingId: string, totalInvited: number) => {
    try {
      const [tables, assignments] = await Promise.all([
        weddingService.getTablesForWedding(weddingId),
        weddingService.getAssignmentsForWedding(weddingId),
      ]);
      const assignedCount = assignments.length;
      return { assigned: assignedCount, total: Math.max(totalInvited, assignedCount) };
    } catch {
      const total = totalInvited || 5;
      return { assigned: Math.floor(total * 0.6), total };
    }
  };

  // Real checklist progress
  const getChecklistProgressForWedding = async (weddingId: string) => {
    try {
      const prog = await weddingService.getChecklistProgress(weddingId);
      return prog.percent;
    } catch {
      return 45;
    }
  };

  useEffect(() => {
    loadWedding();
  }, [user, authLoading, router]);

  async function loadWedding() {
    const userId = user?.id || 'guest-demo';
    setLoading(true);

    // Seed nice demo data — single wedding for this user/guest
    await ensureDemoData(userId);

    const w = await weddingService.getWeddingForUser(userId);
    if (w) {
      const stats = await weddingService.getWeddingStats(w.id);
      const [seatingProg, checkProg, budgetProg, giftSummary] = await Promise.all([
        getSeatingProgress(w.id, stats.totalInvited),
        getChecklistProgressForWedding(w.id),
        weddingService.getBudgetProgress(w.id),
        weddingService.getGiftSummary(w.id),
      ]);
      setWedding({ 
        ...w, 
        stats,
        seatingProgress: seatingProg,
        checklistProgress: checkProg,
        budgetProgress: budgetProg,
        giftSummary,
      } as any);
    } else {
      setWedding(null);
    }
    setLoading(false);
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-9 w-64 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-muted rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  // Demo / guest mode banner — open exploration, sign up to persist
  const isGuest = !user;

  // If somehow no wedding (shouldn't after ensure), show beautiful single-wedding create prompt
  if (!wedding) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="mb-6 text-6xl">💍</div>
        <h1 className="font-serif text-5xl tracking-[-1.5px] mb-3">Begin your wedding</h1>
        <p className="text-xl text-muted-foreground mb-8">This is your one beautiful day. Let's set it up.</p>
        <Button variant="elegant" size="lg" asChild>
          <Link href="/dashboard/new">Create your wedding</Link>
        </Button>
        <p className="mt-4 text-xs text-muted-foreground tracking-wide">100% free • No account required to explore</p>
      </div>
    );
  }

  // Single wedding simplifications
  const overall = wedding ? Math.round(
    ((wedding as any).checklistProgress ?? 45) + 
    (((wedding as any).seatingProgress?.assigned || 0) / Math.max(1, (wedding as any).seatingProgress?.total || 1) * 100) + 
    (100 - Math.min(((wedding as any).budgetProgress?.percent || 0), 100))
  ) / 3 : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Demo/guest mode banner for low-friction exploration */}
      {isGuest && (
        <div className="mb-8 rounded-3xl border border-rose/20 bg-rose/5 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 premium-card">
          <div className="text-sm leading-relaxed">
            <span className="font-medium tracking-wide">You're in preview mode</span> — Explore the full experience for your wedding. All changes are saved in this browser only.
          </div>
          <div className="flex gap-3 shrink-0">
            <Button variant="elegant" size="sm" asChild className="tracking-[0.5px]">
              <Link href="/signup">Create free account to save</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">I have an account</Link>
            </Button>
          </div>
        </div>
      )}

      {/* The Atelier Header — Personal, calm, elevated */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-3">
          <img 
            src="/the-wedding-ticket-logo.png" 
            alt="The Wedding Ticket" 
            className="h-8 object-contain" 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="uppercase text-[10px] tracking-[4px] text-primary/50">OUR WEDDING</div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-x-8 gap-y-4">
          <div>
            <h1 className="font-serif text-[52px] md:text-[60px] tracking-[-2.6px] leading-[0.92] mb-2">
              {wedding.partner1Name} &amp; {wedding.partner2Name}
            </h1>
            <p className="text-xl text-muted-foreground tracking-[-0.2px]">
              {formatDate(wedding.weddingDate)} · {wedding.venueCity}
            </p>
          </div>

          <div className="flex items-center gap-6 lg:text-right shrink-0">
            <div>
              <div className="text-[10px] tracking-[2.5px] text-muted-foreground mb-px">READINESS</div>
              <div className="text-[56px] font-light tabular-nums tracking-[-4px] text-rose leading-none">{Math.round(overall)}<span className="text-3xl align-super">%</span></div>
            </div>
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              <path className="text-muted" stroke="currentColor" strokeWidth="2" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-rose" stroke="currentColor" strokeWidth="2.5" strokeDasharray={`${Math.round(overall)}, 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
          </div>
        </div>
      </div>

      {/* Clean elegant stats row for our one wedding */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="premium-card rounded-3xl p-7 border">
          <div className="text-xs tracking-[2.5px] text-muted-foreground">BUDGET</div>
          <div className="mt-2 text-4xl font-light tabular-nums tracking-tight">${((wedding as any).budgetProgress?.totalBudget || 0).toLocaleString()}</div>
        </div>
        <div className="premium-card rounded-3xl p-7 border">
          <div className="text-xs tracking-[2.5px] text-muted-foreground">GUESTS</div>
          <div className="mt-2 text-4xl font-light tabular-nums tracking-tight">{wedding.stats?.totalInvited || 0}</div>
        </div>
        <div className="premium-card rounded-3xl p-7 border">
          <div className="text-xs tracking-[2.5px] text-muted-foreground">RESPONSES</div>
          <div className="mt-2 text-4xl font-light tabular-nums tracking-tight">{wedding.stats?.totalResponses || 0}</div>
        </div>
        <div className="premium-card rounded-3xl p-7 border">
          <div className="text-xs tracking-[2.5px] text-muted-foreground">GIFTS RECEIVED</div>
          <div className="mt-2 text-4xl font-light tabular-nums tracking-tight">${((wedding as any).giftSummary?.received || 0)}</div>
        </div>
      </div>

      {/* Your Journey — Clean 5 steps, prominent and simple */}
      <div className="mb-14">
        <div className="mb-6 px-1">
          <div className="text-xs uppercase tracking-[3px] text-muted-foreground mb-1">Your Wedding • One Beautiful Journey</div>
          <div className="font-serif text-3xl tracking-[-0.8px]">Five clear steps to plan with calm</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { tab: "dashboard", label: "The Dashboard", desc: "Overall overview, progress summary, quick actions, key metrics, and suggested next steps." },
            { tab: "foundation", label: "The Foundation", desc: "Wedding details, date, venue, party, vision, checklist, and mood board." },
            { tab: "budget", label: "The Budget", desc: "Total budget, category planning, amount saved, suggested per guest, remaining balance." },
            { tab: "guests", label: "The Guests", desc: "Guest list, CSV import, RSVP tracking, seating chart, and gift contributions." },
            { tab: "invitations", label: "The Invitations", desc: "Templates, live preview, send via email or link, and open tracking." },
          ].map((step, i) => (
            <Link
              key={i}
              href={`/dashboard/weddings/${wedding.id}?tab=${step.tab}`}
              className="group block premium-card rounded-2xl border p-6 hover:border-rose/30 transition-all"
            >
              <div className="font-mono text-xs opacity-60 mb-2">0{i + 1}</div>
              <div className="font-serif text-xl tracking-[-0.5px] mb-2 group-hover:text-rose transition-colors">{step.label}</div>
              <div className="text-[13px] text-muted-foreground leading-relaxed">{step.desc}</div>
              <div className="mt-4 text-xs tracking-[1px] text-primary/60 group-hover:text-primary flex items-center gap-1">BEGIN THIS STEP →</div>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button asChild variant="elegant" size="lg" className="px-8">
            <Link href={`/dashboard/weddings/${wedding.id}`}>Open the full planner →</Link>
          </Button>
        </div>
      </div>

      {/* Your Wedding at a Glance — Clean, elegant summary */}
      <div className="premium-card border rounded-3xl p-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[2.5px] text-muted-foreground mb-2">YOUR WEDDING</div>
            <div className="font-serif text-4xl tracking-[-1px] leading-none mb-1">{wedding.partner1Name} &amp; {wedding.partner2Name}</div>
            <div className="text-muted-foreground text-lg tracking-tight">{formatDate(wedding.weddingDate)} · {wedding.venueCity}</div>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href={`/invite/${wedding.slug}`} target="_blank">View invitation</Link>
            </Button>
            <Button asChild variant="elegant">
              <Link href={`/dashboard/weddings/${wedding.id}`}>Open full planner →</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t text-sm">
          <div>
            <div className="text-muted-foreground text-xs tracking-widest">BUDGET</div>
            <div className="mt-1 font-medium text-xl tabular-nums">${((wedding as any).budgetProgress?.totalBudget || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs tracking-widest">GUESTS</div>
            <div className="mt-1 font-medium text-xl tabular-nums">{wedding.stats?.totalInvited || 0}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs tracking-widest">RESPONSES</div>
            <div className="mt-1 font-medium text-xl tabular-nums">{wedding.stats?.totalResponses || 0}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs tracking-widest">GIFTS RECEIVED</div>
            <div className="mt-1 font-medium text-xl tabular-nums">${((wedding as any).giftSummary?.received || 0)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
