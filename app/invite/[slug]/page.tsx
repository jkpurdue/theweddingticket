"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { weddingService } from "@/lib/data-service";
import type { Wedding, Guest, RsvpConfig } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";
import { toast } from "sonner";
import { Heart, Calendar, MapPin, Clock, Users, Download } from "lucide-react";
import { motion } from "framer-motion";

export default function PublicInvitationPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // RSVP form state
  const [form, setForm] = useState({
    guestName: "",
    email: "",
    isAttending: true,
    plusOneCount: 0,
    mealChoice: "",
    songRequest: "",
    dietaryNotes: "",
    message: "",
  });

  // Optional gift (task 6) - 3 clear options, optional only
  const suggestedGift = wedding?.budget?.suggestedPerGuestGift || 0;
  const [giftChoice, setGiftChoice] = useState<'none' | 'suggested' | 'custom'>('none');
  const [giftAmount, setGiftAmount] = useState(0);

  // Budget allocation selection for directing the contribution (multi-select)
  const [selectedAllocations, setSelectedAllocations] = useState<string[]>([]);

  const categories = (wedding?.budget?.categories || []) as any[];

  // Keep suggested amount in sync when wedding loads
  useEffect(() => {
    if (suggestedGift > 0) setGiftAmount(suggestedGift);
  }, [suggestedGift]);

  useEffect(() => {
    loadInvitation();
  }, [slug]);

  async function loadInvitation() {
    setLoading(true);
    const w = await weddingService.getWeddingBySlug(slug);
    if (!w) {
      toast.error("This invitation could not be found.");
      setLoading(false);
      return;
    }
    setWedding(w);

    const g = await weddingService.getGuestsForWedding(w.id);
    setGuests(g);
    setLoading(false);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateForm = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wedding) return;

    if (!form.guestName || !form.email) {
      toast.error("Please enter your name and email");
      return;
    }

    // Try to find matching guest
    const matchingGuest = guests.find(
      (g) => 
        g.fullName.toLowerCase() === form.guestName.toLowerCase() || 
        (g.email && g.email.toLowerCase() === form.email.toLowerCase())
    );

    let finalMessage = form.message || '';
    const giftAmt = giftChoice !== 'none' && suggestedGift > 0 ? (giftChoice === 'suggested' ? suggestedGift : giftAmount) : 0;
    if (giftAmt > 0) {
      let allocNote = '';
      const allocIds = selectedAllocations.length > 0 ? selectedAllocations : categories.map((c: any) => c.id);
      if (allocIds.length > 0) {
        const selectedNames = categories
          .filter((c: any) => allocIds.includes(c.id))
          .map((c: any) => c.name)
          .slice(0, 3)
          .join(', ');
        allocNote = selectedNames ? ` directed toward ${selectedNames}${allocIds.length > 3 ? ' +more' : ''}` : '';
      }
      finalMessage = (finalMessage ? finalMessage + ' ' : '') + `[Optional gift: $${giftAmt} - simulated Stripe payment${allocNote}]`;
      // In future: call Stripe here for real payment with Stripe Connect for couple
      toast.info(`Gift choice recorded: $${giftAmt}. (Stripe checkout would open for secure payment. This is optional, not a fee.)`);
    }

    try {
      await weddingService.submitRsvp(wedding.id, {
        guestName: form.guestName.trim(),
        email: form.email.trim(),
        isAttending: form.isAttending,
        plusOneCount: form.plusOneCount,
        mealChoice: form.mealChoice || undefined,
        songRequest: form.songRequest || undefined,
        dietaryNotes: form.dietaryNotes || undefined,
        message: finalMessage || undefined,
        guestId: matchingGuest?.id,
      });

      // Allocate the contribution to the chosen budget categories (updates momentum live for couple dashboard etc.)
      if (giftAmt > 0 && wedding) {
        const allocIds = selectedAllocations.length > 0 ? selectedAllocations : categories.map((c: any) => c.id);
        if (allocIds.length > 0) {
          try {
            const currentW = await weddingService.getWeddingById(wedding.id);
            if (currentW?.budget?.categories?.length) {
              let cats = currentW.budget.categories.map((c: any) => ({ ...c }));
              const share = Math.floor(giftAmt / allocIds.length);
              let rem = giftAmt % allocIds.length;
              cats = cats.map((c: any) => {
                if (allocIds.includes(c.id)) {
                  const add = share + (rem > 0 ? 1 : 0);
                  if (rem > 0) rem--;
                  return { ...c, funded: (c.funded || 0) + add };
                }
                return c;
              });
              await weddingService.updateWeddingBudget(wedding.id, { ...currentW.budget, categories: cats });
            }
          } catch (allocErr) {
            // allocation is best-effort for demo; don't block thank-you
          }
        }
      }

      setSubmitted(true);
      toast.success(form.isAttending ? "Thank you! We can't wait to celebrate with you." : "Thank you. We're sorry you can't make it.");
    } catch (error) {
      toast.error("Failed to submit RSVP. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading your invitation…</div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <Heart className="mx-auto h-9 w-9 mb-4 text-primary/50" />
          <h1 className="font-serif text-4xl tracking-tight">Invitation not found</h1>
          <p className="mt-3 text-muted-foreground">This link may have expired or the wedding may no longer be published.</p>
        </div>
      </div>
    );
  }

  const accent = wedding.customization?.accentColor || "#D4AF37";
  const template = wedding.template || "classic";
  const rsvpConfig: RsvpConfig = wedding.rsvpConfig || { allowPlusOne: true, mealChoicesEnabled: true, mealChoices: [], songRequestsEnabled: true, notesEnabled: true, dietaryEnabled: true };

  // Template-specific elegant decor (makes "Choose Template" fully functional on the live public invite too)
  const renderTemplateDecor = () => {
    if (template === 'floral') {
      return <div className="text-[11px] tracking-[4px] text-primary/40 my-1 select-none">❀ &nbsp;❀ &nbsp;❀</div>;
    }
    if (template === 'minimal') {
      return <div className="h-px w-12 mx-auto my-2 bg-current opacity-20" />;
    }
    if (template === 'modern') {
      return <div className="h-px w-16 mx-auto my-2" style={{ backgroundColor: accent + '55' }} />;
    }
    // classic
    return <div className="my-1 text-[10px] tracking-[3px] text-primary/40">— ✦ —</div>;
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-16 px-6 flex items-center justify-center">
        <div className="max-w-md text-center rsvp-success">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-serif text-5xl tracking-[-1.5px] mb-4">Thank you</h1>
          <p className="text-xl text-muted-foreground">
            {form.isAttending 
              ? "Your response has been recorded. We look forward to celebrating with you." 
              : "We're sorry you can't join us, but thank you for letting us know."}
          </p>
          <p className="mt-8 text-sm text-muted-foreground">You may close this page. If anything changes, simply revisit the link.</p>
        </div>
      </div>
    );
  }

  const coverUrl = wedding.customization?.showCoverPhoto ? wedding.customization?.coverPhotoUrl : undefined;

  // Add to calendar — generates .ics for guest convenience (elegant touch)
  function addToCalendar() {
    if (!wedding) return;
    const start = new Date(`${wedding.weddingDate}T${wedding.ceremonyTime || "16:00"}:00`);
    const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
    const dtStart = start.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const dtEnd = end.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//TheWeddingTicket//EN",
      "BEGIN:VEVENT",
      `UID:${wedding.id}@theweddingticket.com`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:Wedding of ${wedding.partner1Name} & ${wedding.partner2Name}`,
      `LOCATION:${wedding.venueName}, ${wedding.venueCity}`,
      `DESCRIPTION:You are cordially invited. Full details & RSVP: ${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${wedding.slug}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${wedding.slug}-save-the-date.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Added to your calendar. We can't wait to celebrate with you.");
  }
  // Ultra-luxury default romantic header: elegant wedding venue with NO people (per spec)
  const defaultHero = "https://images.unsplash.com/photo-1503315082045-a2bfb5e7f56e?w=1600&q=90";

  return (
    <div className="min-h-screen pb-20 pt-16 bg-background">
      {/* Large emotional hero photo — romantic, luxurious, full-bleed like premium wedding sites */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: '340px', maxHeight: '480px' }}>
        <img 
          src={coverUrl || defaultHero} 
          alt="Beautiful romantic couple" 
          className="w-full h-full object-cover" 
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/12 via-black/8 to-black/40" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/28 to-transparent" />
      </div>

      {/* Elegant invitation header — soft, emotional, high-end modern */}
      <div className="max-w-3xl mx-auto px-8 pt-12 pb-20 text-center">
        <div className="uppercase tracking-[4.5px] text-xs mb-7" style={{ color: accent + "66" }}>
          YOU ARE CORDIALLY INVITED TO CELEBRATE THE MARRIAGE OF
        </div>

        <h1 
          className="font-serif text-[60px] md:text-[76px] leading-[0.86] tracking-[-3.4px] mb-4" 
          style={{ color: accent }}
        >
          {wedding.partner1Name} &amp; {wedding.partner2Name}
        </h1>

        {renderTemplateDecor()}

        {wedding.welcomeMessage && (
          <p className="mt-9 max-w-prose mx-auto text-lg text-muted-foreground italic leading-snug">
            {wedding.welcomeMessage}
          </p>
        )}
      </div>

      {/* Details */}
      <div className="max-w-2xl mx-auto px-6 py-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mb-9 premium-card">
          <CardContent className="pt-8 pb-9 px-8 md:px-12 grid gap-y-7">
            <div className="flex items-start gap-4">
              <Calendar className="mt-1 h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-xs tracking-[1.5px] text-primary/70">DATE</div>
                <div className="text-xl font-medium tracking-tight mt-px">{formatDate(wedding.weddingDate)}</div>
                <button 
                  onClick={addToCalendar}
                  className="mt-1 inline-flex items-center text-xs text-primary hover:underline"
                >
                  <Download className="h-3 w-3 mr-1" /> Add to calendar
                </button>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Clock className="mt-1 h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-xs tracking-[1.5px] text-primary/70">CEREMONY</div>
                <div className="text-xl font-medium tracking-tight mt-px">{formatTime(wedding.ceremonyTime)}</div>
                {wedding.receptionTime && (
                  <div className="text-sm text-muted-foreground">Reception at {formatTime(wedding.receptionTime)}</div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MapPin className="mt-1 h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-xs tracking-[1.5px] text-primary/70">VENUE</div>
                <div className="text-xl font-medium tracking-tight mt-px">{wedding.venueName}</div>
                <div className="text-muted-foreground">{wedding.venueAddress}</div>
                <div className="text-muted-foreground">{wedding.venueCity}</div>
              </div>
            </div>

            {wedding.dressCode && (
              <div className="flex items-start gap-4">
                <Users className="mt-1 h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="text-xs tracking-[1.5px] text-primary/70">ATTIRE</div>
                  <div className="text-xl font-medium tracking-tight mt-px">{wedding.dressCode}</div>
                </div>
              </div>
            )}

            {wedding.additionalInfo && (
              <div className="pt-3 border-t text-sm text-muted-foreground leading-relaxed">
                {wedding.additionalInfo}
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>

        {/* RSVP Section */}
        <div id="rsvp" className="scroll-mt-8">
          <div className="text-center mb-8">
            <div className="font-serif text-5xl tracking-[-1px] mb-2">Will you be joining us?</div>
            <p className="text-muted-foreground text-sm tracking-wide">Please respond by {wedding.weddingDate ? formatDate(new Date(new Date(wedding.weddingDate).getTime() - 1000*60*60*24*30).toISOString()) : "the date below"}.</p>
          </div>

          <Card className="premium-card">
            <CardContent className="p-8">
              <form onSubmit={handleSubmitRsvp} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label>Your full name</Label>
                    <Input 
                      required 
                      value={form.guestName} 
                      onChange={(e) => updateForm("guestName", e.target.value)} 
                      placeholder="Alex Rivera" 
                      className="mt-1.5" 
                    />
                  </div>
                  <div>
                    <Label>Email address</Label>
                    <Input 
                      required 
                      type="email" 
                      value={form.email} 
                      onChange={(e) => updateForm("email", e.target.value)} 
                      placeholder="you@email.com" 
                      className="mt-1.5" 
                    />
                  </div>
                </div>

                <div>
                  <Label>Will you be attending?</Label>
                  <div className="flex gap-3 mt-2">
                    <Button 
                      type="button" 
                      variant={form.isAttending ? "elegant" : "outline"} 
                      onClick={() => updateForm("isAttending", true)}
                    >
                      Joyfully accept
                    </Button>
                    <Button 
                      type="button" 
                      variant={!form.isAttending ? "elegant" : "outline"} 
                      onClick={() => updateForm("isAttending", false)}
                    >
                      Regretfully decline
                    </Button>
                  </div>
                </div>

                {form.isAttending && rsvpConfig.allowPlusOne && (
                  <div>
                    <Label>Number of additional guests</Label>
                    <Select value={String(form.plusOneCount)} onValueChange={(v) => updateForm("plusOneCount", parseInt(v))}>
                      <SelectTrigger className="mt-1.5 w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[0,1,2,3].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {form.isAttending && rsvpConfig.mealChoicesEnabled && rsvpConfig.mealChoices.length > 0 && (
                  <div>
                    <Label>Meal preference</Label>
                    <Select value={form.mealChoice} onValueChange={(v) => updateForm("mealChoice", v)}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select your meal" /></SelectTrigger>
                      <SelectContent>
                        {rsvpConfig.mealChoices.map((m, idx) => (
                          <SelectItem key={idx} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {form.isAttending && rsvpConfig.dietaryEnabled && (
                  <div>
                    <Label>Dietary requirements or allergies</Label>
                    <Input 
                      value={form.dietaryNotes} 
                      onChange={(e) => updateForm("dietaryNotes", e.target.value)} 
                      placeholder="Gluten-free, vegetarian, etc." 
                      className="mt-1.5" 
                    />
                  </div>
                )}

                {/* Gift / Contribution Section — clear, generous, transparent (per spec) */}
                {suggestedGift > 0 && form.isAttending && (
                  <div className="border-t pt-5 mt-2">
                    <div className="text-xs uppercase tracking-[1.5px] text-primary/70 mb-1">Gift / Contribution (Optional)</div>
                    <p className="text-xs text-muted-foreground mb-3">Suggested Contribution Amount: <span className="font-medium text-foreground">${suggestedGift}</span>. This is a voluntary gift only — <span className="font-medium">not a required fee or ticket price</span>. Your support helps make the day possible.</p>

                    <div className="space-y-2.5 text-sm">
                      <label className="flex items-start gap-2.5 cursor-pointer rounded-md border p-2.5 hover:bg-muted/40 transition has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input type="radio" name="gift" className="mt-1 accent-rose" checked={giftChoice==='suggested'} onChange={() => {
                          setGiftChoice('suggested'); 
                          setGiftAmount(suggestedGift);
                          if (selectedAllocations.length === 0 && categories.length > 0) {
                            setSelectedAllocations(categories.map((c: any) => c.id));
                          }
                        }} /> 
                        <span>
                          <span className="font-medium">Contribute Suggested Amount (${suggestedGift})</span>
                          <span className="text-xs text-muted-foreground block">via card (Stripe) — recommended</span>
                        </span>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer rounded-md border p-2.5 hover:bg-muted/40 transition has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input type="radio" name="gift" className="mt-1 accent-rose" checked={giftChoice==='custom'} onChange={() => {
                          setGiftChoice('custom');
                          if (selectedAllocations.length === 0 && categories.length > 0) {
                            setSelectedAllocations(categories.map((c: any) => c.id));
                          }
                        }} /> 
                        <span className="flex-1">
                          <span className="font-medium">Give a Different Amount</span>
                          <Input 
                            type="number" 
                            value={giftAmount} 
                            onChange={e => setGiftAmount(Math.max(0, parseInt(e.target.value) || 0))} 
                            className="w-24 h-8 text-xs mt-1" 
                            min={0}
                          />
                        </span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer rounded-md border p-2.5 hover:bg-muted/40 transition has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input type="radio" name="gift" className="accent-rose" checked={giftChoice==='none'} onChange={() => { setGiftChoice('none'); /* leave selections for transparency */ }} /> 
                        <span className="font-medium">No Gift Needed</span>
                      </label>
                    </div>

                    {giftChoice !== 'none' && (
                      <div className="mt-2 text-[10px] text-emerald-600">Thank you — your optional gift will be processed securely via Stripe (Connect integration ready for payouts to the couple).</div>
                    )}

                    {/* Budget Allocation — simplified for guests, shows momentum + allows directing contribution */}
                    {categories.length > 0 && (
                      <div className="mt-5 pt-4 border-t">
                        <div className="text-xs uppercase tracking-[1.5px] text-primary/70 mb-1">Budget Allocation</div>
                        <p className="text-xs text-muted-foreground mb-3">
                          See the current momentum. {giftChoice !== 'none' ? "Select the items your contribution should support (we'll split equally if multiple)." : "This shows how other guests are helping bring the vision to life."}
                        </p>

                        <div className="space-y-2.5">
                          {categories.map((cat: any, idx: number) => {
                            const name = cat.name || `Category ${idx + 1}`;
                            const target = Number(cat.budgeted) || 0;
                            const funded = Number(cat.funded) || 0;
                            const needed = Math.max(0, target - funded);
                            const pct = target > 0 ? Math.min(100, Math.round((funded / target) * 100)) : 0;
                            const catId = cat.id;
                            const isSelected = selectedAllocations.includes(catId);
                            const showCheck = giftChoice !== 'none';

                            return (
                              <label 
                                key={catId || idx} 
                                className={`flex items-start gap-3 rounded-md border p-2.5 transition ${showCheck ? 'cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5' : ''}`}
                              >
                                {showCheck && (
                                  <input 
                                    type="checkbox" 
                                    className="mt-1 accent-rose" 
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedAllocations(prev => prev.includes(catId) ? prev : [...prev, catId]);
                                      } else {
                                        setSelectedAllocations(prev => prev.filter(x => x !== catId));
                                      }
                                    }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline justify-between text-sm">
                                    <span className="font-medium truncate pr-2">{name}</span>
                                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">Still needed: ${needed.toLocaleString()}</span>
                                  </div>
                                  {/* Elegant progress bar matching dashboard style */}
                                  <div className="h-2 mt-1.5 bg-[#F5EDE6] rounded-full overflow-hidden ring-1 ring-inset ring-[#EDE4DB]/50">
                                    <div 
                                      className="h-2 bg-[#C5A46E] rounded-full transition-all" 
                                      style={{ width: `${pct}%` }} 
                                    />
                                  </div>
                                  <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground tabular-nums">
                                    <span>${funded.toLocaleString()} funded</span>
                                    <span>{pct}%</span>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>

                        {giftChoice !== 'none' && selectedAllocations.length > 0 && (
                          <div className="mt-2 text-[10px] text-emerald-600">Your gift will be directed to the selected item(s).</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {form.isAttending && rsvpConfig.songRequestsEnabled && (
                  <div>
                    <Label>Song request (optional)</Label>
                    <Input 
                      value={form.songRequest} 
                      onChange={(e) => updateForm("songRequest", e.target.value)} 
                      placeholder="At Last — Etta James" 
                      className="mt-1.5" 
                    />
                  </div>
                )}

                {rsvpConfig.notesEnabled && (
                  <div>
                    <Label>Message for the couple (optional)</Label>
                    <Textarea 
                      value={form.message} 
                      onChange={(e) => updateForm("message", e.target.value)} 
                      placeholder="We are so excited to celebrate with you both..." 
                      className="mt-1.5 min-h-[90px]" 
                    />
                  </div>
                )}

                <Button type="submit" variant="elegant" size="lg" className="w-full mt-2">
                  Submit my response
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-[10px] text-muted-foreground mt-10 tracking-widest flex items-center justify-center gap-1.5">
          <img 
            src="/the-wedding-ticket-logo.png" 
            alt="The Wedding Ticket" 
            className="h-4 object-contain opacity-60" 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          /> 
          CREATED WITH THE WEDDING TICKET
        </div>
      </div>
    </div>
  );
}
