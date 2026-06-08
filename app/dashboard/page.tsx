"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { weddingService, ensureDemoData } from "@/lib/data-service";
import type { Wedding, WeddingStats } from "@/types";

interface WeddingWithStats extends Wedding {
  stats?: WeddingStats;
  seatingProgress?: { assigned: number; total: number };
  checklistProgress?: number;
  budgetProgress?: { percent?: number; totalBudget?: number };
  giftSummary?: { received?: number };
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [wedding, setWedding] = useState<WeddingWithStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Real seating progress pulled from service (assignments + guests)
  const getSeatingProgress = async (weddingId: string, totalInvited: number) => {
    try {
      const [, assignments] = await Promise.all([
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

  // Redirect directly to the wedding planner (Step 1: The Dashboard) once wedding is loaded.
  // This must be in useEffect to avoid "Cannot update a component while rendering" error.
  useEffect(() => {
    if (wedding?.id) {
      router.push(`/dashboard/weddings/${wedding.id}`);
    }
  }, [wedding?.id, router]);

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
      } as WeddingWithStats);
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

  // If somehow no wedding (shouldn't after ensure), show beautiful single-wedding create prompt
  if (!wedding) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="mb-6 text-6xl">💍</div>
        <h1 className="font-serif text-5xl tracking-[-1.5px] mb-3">Begin your wedding</h1>
        <p className="text-xl text-muted-foreground mb-8">This is your one beautiful day. Let&apos;s set it up.</p>
        <Button variant="elegant" size="lg" asChild>
          <Link href="/dashboard/new">Create your wedding</Link>
        </Button>
        <p className="mt-4 text-xs text-muted-foreground tracking-wide">100% free • No account required to explore</p>
      </div>
    );
  }

  // Redirect happens in useEffect above; here we just show a brief loading state while it happens.
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 text-center text-muted-foreground">
      Taking you straight into your wedding dashboard…
    </div>
  );
}
