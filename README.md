# TheWeddingTicket

**The modern, elegant SaaS platform for digital wedding invitations and guest management.**

A beautiful, luxurious experience for couples to create and share digital invitations, manage guests, and collect RSVPs.

## ✨ Key Features (MVP)

- Elegant landing page with pricing and testimonials
- Email + Google (simulated) authentication with onboarding
- Dashboard to create and manage multiple weddings
- Full premium wedding event builder:
  - Event details, live designer with cover photos
  - Advanced guest list + beautiful CSV/Excel column mapper
  - **Drag-and-drop Seating Chart** with visual floorplan + PNG/PDF export
  - **12-month Wedding Planning Checklist** (categorized, progress, free)
  - **Email Invitations** with matching design + open tracking (demo)
  - Configurable RSVP + real-time responses
- Breathtaking public invitation pages with real photography support
- Aspirational "Wedding Studio" dashboard
- Ultra-premium romantic design (champagne, blush, emerald)
- Fully responsive + dark mode support

## 🛠 Tech Stack

- **Next.js 15** (App Router, Turbopack)
- **TypeScript**
- **Tailwind CSS** + custom elegant design tokens
- **shadcn/ui** primitives (Radix)
- **Supabase** ready (client + full SQL schema included)
- Framer Motion, date-fns, PapaParse, Sonner, React Hook Form ready

**Current data layer**: Fully functional localStorage-backed service for instant demo and development. Easy to swap for real Supabase.

## 🚀 Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```

3. Visit http://localhost:3000

4. Sign up with any email (demo auto-creates accounts). Explore the full flow.

## 📦 Supabase Production Setup (Recommended)

The platform is architected for Supabase from day one.

1. Create a Supabase project at https://supabase.com
2. Copy `.env.example` → `.env.local` and fill:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Run the schema:
   - Go to your Supabase project → SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Execute
4. (Optional but recommended) Configure Google OAuth provider in Supabase Auth settings + add site URL.

Then create a new service file (or modify `lib/data-service.ts`) to call the Supabase client from `lib/supabase/client.ts` instead of localStorage.

Row Level Security policies are already included in the schema.

## 📁 Project Structure (Key Areas)

```
app/
  page.tsx                 → Landing
  login/ signup/ onboarding/
  dashboard/
    page.tsx               → List of weddings
    new/                   → Create flow
    weddings/[id]/         → Full event builder (details / guests / design / rsvps)
  invite/[slug]/           → Public beautiful invitation + RSVP

components/
  ui/                      → All shadcn-style primitives
  invitation-preview.tsx
  guest-table.tsx
  rsvp-list.tsx
  navbar.tsx

lib/
  data-service.ts          → Current demo persistence layer (easy to replace)
  supabase/client.ts
  utils.ts

types/index.ts
supabase/schema.sql
```

## 🧪 Development Notes

- No real backend required for a complete demo experience
- All data (weddings, guests, RSVPs) persists in your browser via localStorage
- Use the seeded demo wedding on first dashboard visit
- Dark mode supported via next-themes + beautiful palette
- The invitation preview component is reused for both designer and public page

## 🗺 Next Steps / Polish Ideas

- Real email notifications on RSVP (Resend / Supabase Edge Functions)
- Proper image upload for cover photos (Supabase Storage)
- Calendar .ics downloads
- Multi-language support
- Stripe integration for Premium upgrades
- Analytics dashboard + export PDFs

---

Built with love for beautiful celebrations. 💍

Questions? Open an issue or start a conversation.
