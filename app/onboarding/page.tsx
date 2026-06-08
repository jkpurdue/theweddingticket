"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { weddingService, DEFAULT_BUDGET_CATEGORIES } from "@/lib/data-service";
import { Loader2, ArrowRight, Heart, Calendar, MapPin, DollarSign, Users, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Tooltip } from "@/components/ui/tooltip";
import confetti from "canvas-confetti";

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = welcome
  const [loading, setLoading] = useState(false);

  // Collected data
  const [form, setForm] = useState({
    partner1: "",
    partner2: "",
    weddingDate: "",
    ceremonyTime: "16:30",
    venueName: "",
    venueCity: "",
    totalBudget: 28000,
    suggestedPerGuest: 150,
    totalExpectedInvitees: 175,
    expectedAttendanceRate: 75,
  });

  if (!user) {
    router.push("/signup");
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateForm = (key: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    if (step === 1) return form.partner1 && form.partner2;
    if (step === 2) return form.weddingDate && form.venueName;
    return true;
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const wedding = await weddingService.createWedding(user.id, {
        partner1Name: form.partner1,
        partner2Name: form.partner2,
        weddingDate: form.weddingDate,
        ceremonyTime: form.ceremonyTime,
        venueName: form.venueName || "TBD",
        venueAddress: "",
        venueCity: form.venueCity || "Your Dream Location",
      });

      // Apply rich budget + suggested gift from wizard (Step A seed)
      if (wedding.budget) {
        await weddingService.updateWeddingBudget(wedding.id, {
          total: form.totalBudget,
          suggestedPerGuestGift: form.suggestedPerGuest,
          totalExpectedInvitees: form.totalExpectedInvitees,
          expectedAttendanceRate: form.expectedAttendanceRate,
          categories: JSON.parse(JSON.stringify(DEFAULT_BUDGET_CATEGORIES)),
        });
      }

      // Initialize checklist explicitly
      await weddingService.getChecklistForWedding(wedding.id); // triggers seed if needed

      // Delightful confetti burst on launch
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

      toast.success("Your wedding is ready.", {
        description: "We've prepared everything with care. Let's begin your story.",
      });

      // Go straight into the one wedding dashboard (personal command center)
      router.push(`/dashboard`);
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    // Step 0: Welcome
    {
      title: "Let's set up your wedding",
      subtitle: "This is going to be the easiest and most beautiful part of planning.",
    },
    // Step 1: The Couple
    {
      title: "Tell us about the two of you",
      subtitle: "This will appear on every invitation and in your personal studio.",
    },
    // Step 2: The Day & Place
    {
      title: "When and where will you celebrate?",
      subtitle: "We use this to personalize your timeline, checklist, and invitations.",
    },
    // Step 3: Budget & Gifts (guided)
    {
      title: "Let's talk numbers (optional but powerful)",
      subtitle: "A simple budget + suggested gift amount helps with planning and tracking later.",
    },
    // Step 4: You're ready
    {
      title: "You're all set!",
      subtitle: "Your personalized Wedding Command Center is waiting with a full 12-month checklist, budget tools, and more.",
    },
  ];

  const current = steps[step] || steps[0];

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6 py-12 bg-[radial-gradient(#f4ede4_0.6px,transparent_1px)] dark:bg-[radial-gradient(#2a2520_0.6px,transparent_1px)] bg-[length:4px_4px]">
      <div className="w-full max-w-xl">
        {/* Progress - delightful clickable steps */}
        <div className="flex items-center justify-between mb-2 text-xs tracking-[2px] text-muted-foreground">
          <div>ONBOARDING</div>
          <div>STEP {step + 1} OF {steps.length}</div>
        </div>
        <div className="flex gap-2 mb-6">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? "bg-champagne" : "bg-muted"}`}
              aria-label={`Go to step ${i+1}`}
            />
          ))}
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-primary/40 mb-4 tracking-[3px] text-xs">
            <Heart className="h-4 w-4" /> 100% FREE FOR COUPLES
          </div>
          <h1 className="font-serif text-6xl tracking-[-2.4px] mb-5">{current.title}</h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">{current.subtitle}</p>
        </div>

        <Card className="shadow-md border-rose/10 premium-card">
          <CardContent className="p-9 overflow-hidden">
            <AnimatePresence mode="wait">
              {/* STEP 0: Welcome */}
              {step === 0 && (
                <motion.div 
                  key="step0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="text-center space-y-6 py-4"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-champagne/10 flex items-center justify-center">
                    <Heart className="h-8 w-8 text-champagne" />
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground max-w-xs mx-auto">
                    <p>We&apos;ll guide you through invitations, guest list, seating, budget, and a complete 12-month plan — all in one elegant place.</p>
                    <p className="font-medium text-foreground">Takes about 4 minutes to get fully set up.</p>
                  </div>
                  <div className="text-left text-xs bg-muted/50 p-3 rounded space-y-1">
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-sage" /> Personalized 12-month checklist</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-sage" /> Budget planner, checklist &amp; guest tools (all included)</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald" /> Beautiful invites with live preview</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald" /> Drag & drop seating + real-time tracking</div>
                  </div>
                  <Button variant="elegant" size="lg" className="w-full" onClick={() => setStep(1)}>
                    Begin the guided setup <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {/* STEP 1: Couple names */}
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <Label className="mb-1.5">Partner 1</Label>
                      <Input value={form.partner1} onChange={e => updateForm("partner1", e.target.value)} placeholder="Isabella Grace Moreau" className="h-12 text-lg" />
                    </div>
                    <div>
                      <Label className="mb-1.5">Partner 2</Label>
                      <Input value={form.partner2} onChange={e => updateForm("partner2", e.target.value)} placeholder="James Alexander Hale" className="h-12 text-lg" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" size="lg" onClick={() => setStep(0)} className="flex-1">Back</Button>
                    <Button variant="elegant" size="lg" onClick={() => setStep(2)} disabled={!canProceed()} className="flex-1">
                      Continue <ArrowRight className="ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Date + Venue */}
              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="space-y-6"
                >
                  <div>
                    <Label className="mb-1.5 flex items-center gap-2"><Calendar className="h-4 w-4" /> Wedding Date</Label>
                    <Input type="date" value={form.weddingDate} onChange={e => updateForm("weddingDate", e.target.value)} className="h-12" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1.5">Ceremony Time</Label>
                      <Input type="time" value={form.ceremonyTime} onChange={e => updateForm("ceremonyTime", e.target.value)} className="h-12" />
                    </div>
                    <div>
                      <Label className="mb-1.5 flex items-center gap-2"><MapPin className="h-4 w-4" /> Venue Name</Label>
                      <Input value={form.venueName} onChange={e => updateForm("venueName", e.target.value)} placeholder="The Conservatory at The Grand Estate" className="h-12" />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5">City / Region</Label>
                    <Input value={form.venueCity} onChange={e => updateForm("venueCity", e.target.value)} placeholder="Napa Valley, California" className="h-12" />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" size="lg" onClick={() => setStep(1)} className="flex-1">Back</Button>
                    <Button variant="elegant" size="lg" onClick={() => setStep(3)} disabled={!canProceed()} className="flex-1">
                      Continue <ArrowRight className="ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Budget + Gift Suggestion (guided) */}
              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="space-y-6"
                >
                  <div>
                    <Label className="mb-1.5 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Total Wedding Budget</Label>
                    <div className="flex items-center gap-3">
                      <Input 
                        type="number" 
                        value={form.totalBudget} 
                        onChange={e => updateForm("totalBudget", parseInt(e.target.value) || 0)} 
                        className="h-12 text-xl font-light tabular-nums" 
                      />
                      <span className="text-muted-foreground">USD</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">We&apos;ll create smart categories you can adjust anytime.</p>
                  </div>

                  <div>
                    <Tooltip content="This sets the default suggested contribution shown to guests in invites and used for tracking expected gifts vs actual. You can customize per guest later.">
                      <Label className="mb-1.5 flex items-center gap-2"><Users className="h-4 w-4" /> Suggested gift contribution per guest</Label>
                    </Tooltip>
                    <div className="flex items-center gap-3">
                      <Input 
                        type="number" 
                        value={form.suggestedPerGuest} 
                        onChange={e => updateForm("suggestedPerGuest", parseInt(e.target.value) || 0)} 
                        className="h-12 text-xl font-light tabular-nums w-36" 
                      />
                      <span className="text-muted-foreground">per guest</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">This helps guests know what&apos;s appropriate and powers your gift tracking.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1.5 flex items-center gap-2">Total Expected Invitees</Label>
                      <Input 
                        type="number" 
                        value={form.totalExpectedInvitees} 
                        onChange={e => updateForm("totalExpectedInvitees", parseInt(e.target.value) || 175)} 
                        className="h-12 text-xl font-light tabular-nums w-36" 
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 flex items-center gap-2">Expected Attendance Rate</Label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" 
                          min="50" max="100" step="1"
                          value={form.expectedAttendanceRate} 
                          onChange={e => updateForm("expectedAttendanceRate", parseInt(e.target.value) || 75)} 
                          className="flex-1" 
                        />
                        <span className="w-12 text-right tabular-nums text-sm">{form.expectedAttendanceRate}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Expected attendees: ~{Math.round((form.totalExpectedInvitees || 175) * (form.expectedAttendanceRate || 75) / 100)}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
                    We&apos;ll pre-fill realistic budget categories (Venue 30%, Catering, Photography, etc.) based on your total.
                    {form.totalBudget && form.suggestedPerGuest && (
                      <div className="mt-1 font-medium text-foreground">Expected gifts from guests: ~${(form.totalBudget * 0.05 + form.suggestedPerGuest * 80).toFixed(0)} (based on avg guests)</div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" size="lg" onClick={() => setStep(2)} className="flex-1">Back</Button>
                    <Button variant="elegant" size="lg" onClick={() => setStep(4)} className="flex-1">
                      Looks good — Continue <ArrowRight className="ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Launch / Tour */}
              {step === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="text-center space-y-6 py-2"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10">
                    <CheckCircle2 className="h-8 w-8 text-emerald" />
                  </div>
                  <div>
                    <div className="font-serif text-3xl tracking-tight mb-2">Your Wedding is ready.</div>
                    <p className="text-muted-foreground">We&apos;ve prepared your checklist, budget tools, guest list, seating, and invitation designer — everything ready to explore.</p>
                  </div>

                  <div className="bg-card border rounded-xl p-5 text-left text-sm space-y-2">
                    <div className="font-medium">What happens next:</div>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      <li>Add or import your full guest list (with gift suggestions)</li>
                      <li>Design &amp; send your invitations</li>
                      <li>Track RSVPs, gifts, and build your seating chart visually</li>
                      <li>Follow the guided checklist every step of the way</li>
                    </ul>
                  </div>

                  <Button 
                    variant="elegant" 
                    size="lg" 
                    className="w-full text-base h-14" 
                    onClick={handleFinish} 
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enter Our Wedding"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground tracking-widest">You can always edit everything later</p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {step > 0 && step < 4 && (
          <p className="text-center text-xs mt-6 text-muted-foreground">Your information is private. We&apos;ll never share it.</p>
        )}
      </div>
    </div>
  );
}
