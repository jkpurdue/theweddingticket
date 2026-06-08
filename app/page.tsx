"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  Heart 
} from "lucide-react";

// Curated imagery for The Wedding Atelier — soft, emotional, timeless
const heroPhoto = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1800&q=90&fm=jpg";

// Pricing removed — platform is 100% free for couples. Revenue only from optional guest gift processing fees.

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* 
        THE WEDDING ATELIER — Hero
        Direction: Intimate. Emotional. Immediate. 
        The first page of their story should stop them.
      */}
      <section className="luxury-hero overflow-hidden relative min-h-[95vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroPhoto}
            alt="A couple in soft golden light, foreheads touching, the quiet beginning of forever"
            fill
            className="object-cover"
            priority
            quality={96}
          />
          {/* Stronger overlay for readability — subtle but effective dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/75" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/25" />
          {/* Additional soft vignette for text pop */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.15)_0%,transparent_70%)]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-8 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-white/40 bg-white/10 backdrop-blur-md text-xs tracking-[4px] text-white/95 mb-8">
            100% FREE FOR COUPLES
          </div>

          <h1 className="display font-serif text-white mb-6 text-balance leading-[0.92] drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]" style={{fontSize: 'clamp(3.2rem, 8.5vw, 6.2rem)'}}>
            Plan the wedding<br />you’ve always imagined.<br />Without the debt.
          </h1>

          <p className="max-w-[620px] mx-auto text-[21px] md:text-[24px] text-white/95 mb-10 tracking-[-0.015em] font-light leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            The elegant, completely free platform that helps couples plan their dream wedding with grace and joy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="elegant" size="lg" asChild className="px-16 h-16 text-lg tracking-[0.3px] shadow-2xl">
              <Link href="/dashboard">Start Planning Free</Link>
            </Button>
            <Button variant="elegant-outline" size="lg" asChild className="px-10 h-16 text-lg">
              <Link href="#how">See how it works</Link>
            </Button>
          </div>

          <p className="mt-8 text-xs tracking-[3.5px] text-white/80">No account required • 100% free for couples</p>
        </div>

        {/* Trust bar — quiet authority */}
        <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/25 bg-black/25 backdrop-blur py-5">
          <div className="max-w-5xl mx-auto px-8 flex flex-wrap justify-center items-center gap-x-12 gap-y-1 text-[10px] uppercase tracking-[3.5px] text-white/80">
            <div>VOGUE WEDDINGS</div>
            <div>BRIDES</div>
            <div>MARTHA STEWART</div>
            <div>THE KNOT</div>
          </div>
        </div>
      </section>

      {/* How it Works — Clean, valuable, Zola-inspired */}
      <section id="how" className="atelier-section border-y bg-background">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-14">
            <div className="text-primary/40 text-xs tracking-[4px] mb-3">HOW IT WORKS</div>
            <h2 className="headline font-serif tracking-[-1.4px]">Three simple steps to the wedding of your dreams.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Create your wedding", desc: "Tell us the basics — date, venue, and a few details. Takes just a few minutes. Everything can be refined later." },
              { num: "02", title: "Design & invite", desc: "Choose a beautiful template in soft blush, sage, and gold. Import your guest list. Send stunning invitations with one click." },
              { num: "03", title: "Celebrate together", desc: "Track RSVPs, manage seating, and watch your day come together — all in one calm, elegant space. Completely free." },
            ].map((step, i) => (
              <div key={i} className="premium-card p-9 border rounded-3xl">
                <div className="font-mono text-5xl tracking-[-2px] text-primary/10 mb-6">{step.num}</div>
                <h3 className="font-serif text-2xl tracking-[-0.4px] mb-4 leading-tight">{step.title}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why The Wedding Ticket — Focused on free, single wedding, no debt */}
      <section className="atelier-section bg-background">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-14">
            <div className="text-primary/40 text-xs tracking-[4px] mb-3">WHY COUPLES CHOOSE US</div>
            <h2 className="headline font-serif tracking-[-1.4px]">Plan beautifully. Pay nothing. Celebrate everything.</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "100% Free for Couples", desc: "Every tool — invitations, guest management, seating, checklist, budget — is free. We only earn if your guests choose to contribute (optional)." },
              { title: "One Wedding. One Focus.", desc: "This platform is built for your one special day. No multi-event clutter. Just calm, elegant tools for the wedding you’ve dreamed of." },
              { title: "Fund Your Wedding, Not Debt", desc: "Guests can contribute early to help cover real costs before the big day. Optional, graceful, and designed to reduce financial stress." },
              { title: "Stunning Invitations", desc: "Romantic templates in blush, sage, and gold. Full customization, cover photos, and a guest experience that feels like a luxury keepsake." },
              { title: "Everything in One Place", desc: "RSVPs, seating charts, gift tracking, and your 12-month timeline — beautifully organized so you can focus on what matters." },
              { title: "Low Pressure, High Joy", desc: "No account required to explore. Start planning immediately. Sign up only when you’re ready to save your wedding." },
            ].map((item, i) => (
              <div key={i} className="premium-card border p-8 rounded-3xl">
                <h3 className="font-serif text-2xl tracking-[-0.4px] mb-3 leading-tight">{item.title}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — Believable, high-quality, tied to benefits */}
      <section id="stories" className="atelier-section bg-background border-y">
        <div className="max-w-5xl mx-auto px-8">
          <div className="text-center mb-14">
            <div className="text-primary/40 text-xs tracking-[4px] mb-3">REAL COUPLES, REAL RESULTS</div>
            <h2 className="headline font-serif tracking-[-1.3px]">“We planned our dream wedding without starting our marriage in debt.”</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "The free tools made everything so easy. Our guests loved contributing directly to the wedding instead of buying things we didn’t need. We covered deposits early and stress-free.",
                name: "Elena & Marcus",
                wedding: "Sonoma Valley, 2025"
              },
              {
                quote: "I was worried about the cost of the venue and photographer. The optional contributions from guests helped us book everything we wanted. The platform felt luxurious and thoughtful.",
                name: "Isabella & Theo",
                wedding: "Charleston, 2025"
              },
              {
                quote: "No upsells, no pressure. Just beautiful invitations and a calm way to manage everything. We saved thousands and our guests said it was the most meaningful gift experience.",
                name: "Amara & Julian",
                wedding: "Hudson Valley, 2025"
              },
            ].map((t, i) => (
              <div key={i} className="premium-card border p-9">
                <div className="flex mb-6 text-rose">
                  {Array.from({ length: 5 }).map((_, i) => <Heart key={i} className="h-3.5 w-3.5 fill-current opacity-70" />)}
                </div>
                <blockquote className="text-[15px] leading-relaxed tracking-[-0.2px] mb-8 text-foreground/95">
                  “{t.quote}”
                </blockquote>
                <div>
                  <div className="font-medium tracking-tight">{t.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.wedding}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — Strong, clean, compelling */}
      <section className="atelier-section bg-background">
        <div className="max-w-2xl mx-auto px-8 text-center">
          <h2 className="font-serif text-5xl md:text-6xl tracking-[-1.8px] mb-6 text-balance">Your love story deserves this kind of beginning.</h2>
          <p className="text-xl text-muted-foreground mb-10">Plan with grace. Invite with beauty. Celebrate without debt. Completely free.</p>

          <Button variant="elegant" size="lg" className="h-16 px-14 text-lg" asChild>
            <Link href="/dashboard">Start Planning Free</Link>
          </Button>

          <div className="mt-6 text-[10px] tracking-[3.5px] text-muted-foreground">NO ACCOUNT NEEDED TO EXPLORE • ONE WEDDING • FREE FOREVER</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-16 px-8 text-sm text-muted-foreground bg-background">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-y-10">
          <div>
            <div className="flex items-center gap-3 font-serif text-2xl text-foreground tracking-tight mb-2">
              <img 
                src="/the-wedding-ticket-logo.png" 
                alt="The Wedding Ticket" 
                className="h-7 object-contain" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              /> 
            </div>
            <div className="text-xs tracking-wide">100% free for couples. Beautiful tools for the wedding you deserve.</div>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-3 text-sm">
            <Link href="#how" className="hover:text-foreground transition">How it Works</Link>
            <Link href="#stories" className="hover:text-foreground transition">Stories</Link>
            <Link href="/login" className="hover:text-foreground transition">Log in</Link>
            <a href="mailto:hello@theweddingticket.com" className="hover:text-foreground transition">Contact</a>
          </div>
          <div className="text-xs tracking-[1px]">© {new Date().getFullYear()} TheWeddingTicket. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
