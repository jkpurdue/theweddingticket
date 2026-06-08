"use client";

import React, { useEffect, useState } from "react";
import { weddingService } from "@/lib/data-service";
import type { ChecklistItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

interface WeddingChecklistProps {
  weddingId: string;
  weddingDate: string;
  onUpdate?: () => void;
}

export function WeddingChecklist({ weddingId, weddingDate, onUpdate }: WeddingChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0, percent: 0 });
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [newCustomLabel, setNewCustomLabel] = useState("");

  // Fixed timeline order for beautiful organization (matches the professional template)
  const TIMELINE_ORDER = [
    "12+ Months Before",
    "9–11 Months Before",
    "6–8 Months Before",
    "3–5 Months Before",
    "2 Months Before",
    "1 Month Before",
    "Final Week",
    "Day Before / Wedding Day",
    "Custom",
  ];

  useEffect(() => {
    loadChecklist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingId]);

  async function loadChecklist() {
    setLoading(true);
    try {
      const [list, prog] = await Promise.all([
        weddingService.getChecklistForWedding(weddingId),
        weddingService.getChecklistProgress(weddingId),
      ]);
      setItems(list);
      setProgress(prog);
    } catch (e) {
      toast.error("Could not load checklist");
    } finally {
      setLoading(false);
    }
  }

  async function toggleItem(item: ChecklistItem) {
    const newCompleted = !item.completed;
    try {
      await weddingService.toggleChecklistItem(item.id, newCompleted);
      // optimistic
      const updated = items.map(i => i.id === item.id ? { ...i, completed: newCompleted } : i);
      setItems(updated);
      const newProg = await weddingService.getChecklistProgress(weddingId);
      setProgress(newProg);
      if (newCompleted) {
        toast.success("Task completed — great progress!", { description: item.label });
        // Premium delightful confetti burst
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
        setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0.1 } }), 120);
      }
      onUpdate?.();
    } catch (e) {
      toast.error("Failed to update task");
    }
  }

  async function addCustomItem() {
    if (!newCustomLabel.trim()) return;
    try {
      const item = await weddingService.addCustomChecklistItem(weddingId, newCustomLabel, "Custom");
      setItems(prev => [...prev, item]);
      setNewCustomLabel("");
      const newProg = await weddingService.getChecklistProgress(weddingId);
      setProgress(newProg);
      toast.success("Custom task added — nice!");
      onUpdate?.();
    } catch (e) {
      toast.error("Failed to add custom task");
    }
  }

  // Group by timeline in fixed professional order
  const itemsByTimeline = TIMELINE_ORDER.map(category => ({
    category,
    allItems: items.filter(i => i.category === category),
  })).filter(group => group.allItems.length > 0);

  const allPending = items.filter(i => !i.completed);
  const allCompleted = items.filter(i => i.completed);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading your 12-month plan...</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-serif text-2xl tracking-tight">12-Month Wedding Planner</h3>
            <p className="text-sm text-muted-foreground">A beautiful 12-month timeline checklist. Items hide when done (use the toggle to review). Add your own custom tasks anytime.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-light tabular-nums tracking-tighter text-sage">{progress.percent}%</div>
            <div className="text-xs text-muted-foreground">{progress.completed} of {progress.total} complete</div>
          </div>
        </div>
        <div className="h-2 bg-muted rounded overflow-hidden">
          <div className="h-2 bg-sage transition-all" style={{ width: `${progress.percent}%` }} />
        </div>
      </div>

      {/* Filters - hide completed by default, easy Show Completed toggle */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Switch checked={showCompleted} onCheckedChange={setShowCompleted} />
          <span className="text-xs text-muted-foreground">Show Completed ({allCompleted.length})</span>
        </div>
        <span className="text-xs text-muted-foreground/70">• Organized by timeline for easy planning</span>
      </div>

      <div className="space-y-8">
        {itemsByTimeline.length === 0 && <div className="text-center py-8 text-muted-foreground">No checklist items yet.</div>}
        {itemsByTimeline.map(({ category, allItems }) => {
          const pending = allItems.filter(i => !i.completed);
          const completed = allItems.filter(i => i.completed);
          if (pending.length === 0 && (!showCompleted || completed.length === 0)) return null;
          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold tracking-[1px] text-primary/80 uppercase">{category}</div>
                <div className="flex-1 h-px bg-border" />
                <div className="text-xs text-muted-foreground">{pending.length} tasks</div>
              </div>
              <div className="grid gap-2">
                {pending.length === 0 && <div className="text-xs text-muted-foreground pl-1">All done in this phase — amazing!</div>}
                {pending.map((item) => {
                  let isOverdue = false;
                  if (item.dueOffsetMonths != null && !item.completed && weddingDate) {
                    const due = new Date(weddingDate);
                    due.setMonth(due.getMonth() - (item.dueOffsetMonths || 0));
                    isOverdue = new Date() > due;
                  }
                  return (
                    <div 
                      key={item.id} 
                      className={`flex items-start gap-4 p-4 rounded-xl border bg-card luxury-card hover:border-gold/20 transition-colors ${item.completed ? 'opacity-70' : ''}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={item.completed} 
                        onChange={() => toggleItem(item)} 
                        className="mt-1 h-4 w-4 accent-champagne cursor-pointer" 
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {item.label}
                          </span>
                          {item.completed && <CheckCircle2 className="h-4 w-4 text-emerald" />}
                        </div>
                        {item.dueOffsetMonths != null && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            <span className={isOverdue ? "text-destructive font-medium" : ""}>
                              {item.dueOffsetMonths >= 1 ? `${item.dueOffsetMonths} months before` : item.dueOffsetMonths > 0 ? "This month" : "Day of / Wedding week"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Completed under this timeline heading when toggle is on */}
              {showCompleted && completed.length > 0 && (
                <div className="pl-6 mt-1 space-y-1 opacity-60">
                  {completed.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-3 rounded-xl border bg-card text-sm">
                      <input 
                        type="checkbox" 
                        checked={true} 
                        onChange={() => toggleItem(item)} 
                        className="mt-0.5 h-4 w-4 accent-champagne cursor-pointer" 
                      />
                      <div className="flex-1">
                        <span className="line-through text-muted-foreground">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add custom item — premium, encouraging feature */}
      <div className="pt-6 border-t mt-6">
        <div className="text-xs uppercase tracking-[1.5px] text-primary/60 mb-2">Make it yours</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCustomLabel}
            onChange={(e) => setNewCustomLabel(e.target.value)}
            placeholder="Add your own custom task (e.g. 'Finalize the playlist')"
            className="flex-1 border rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
            onKeyDown={(e) => { if (e.key === "Enter") addCustomItem(); }}
          />
          <Button size="sm" variant="elegant" onClick={addCustomItem} disabled={!newCustomLabel.trim()}>
            Add Task
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">Custom tasks appear under "Custom" and count toward your progress.</p>
      </div>

      <div className="text-xs text-muted-foreground text-center pt-4 border-t">
        Your private 12-month plan — free forever. Small wins add up to the day of your dreams.
      </div>
    </div>
  );
}
