-- TheWeddingTicket Supabase Schema (run in SQL editor)
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Profiles table (synced with auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  created_at timestamptz default now()
);

-- Weddings
create table if not exists public.weddings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  partner1_name text not null,
  partner2_name text not null,
  wedding_date date not null,
  ceremony_time text not null,
  reception_time text,
  venue_name text not null,
  venue_address text not null,
  venue_city text not null,
  dress_code text,
  welcome_message text,
  additional_info text,
  slug text not null unique,
  template text not null default 'classic',
  customization jsonb not null default '{}'::jsonb,
  rsvp_config jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Guests
create table if not exists public.guests (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  full_name text not null,
  email text,
  phone text,
  side text not null default 'both', -- partner1 | partner2 | both
  plus_one boolean not null default false,
  plus_one_name text,
  table_number text,
  dietary_notes text,
  status text not null default 'pending', -- pending | attending | declined | maybe
  created_at timestamptz default now()
);

-- RSVPs (separate submissions for flexibility)
create table if not exists public.rsvps (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  guest_id uuid references public.guests(id) on delete set null,
  guest_name text not null,
  email text not null,
  is_attending boolean not null,
  plus_one_count integer not null default 0,
  meal_choice text,
  song_request text,
  dietary_notes text,
  message text,
  submitted_at timestamptz default now()
);

-- Indexes
create index if not exists weddings_user_id_idx on public.weddings(user_id);
create index if not exists guests_wedding_id_idx on public.guests(wedding_id);
create index if not exists rsvps_wedding_id_idx on public.rsvps(wedding_id);
create index if not exists weddings_slug_idx on public.weddings(slug);

-- Row Level Security
alter table public.weddings enable row level security;
alter table public.guests enable row level security;
alter table public.rsvps enable row level security;

-- Policies (basic - tighten for production)
create policy "Users can view own weddings" on public.weddings
  for select using (auth.uid() = user_id);

create policy "Users can insert own weddings" on public.weddings
  for insert with check (auth.uid() = user_id);

create policy "Users can update own weddings" on public.weddings
  for update using (auth.uid() = user_id);

create policy "Users can delete own weddings" on public.weddings
  for delete using (auth.uid() = user_id);

create policy "Users manage guests of own weddings" on public.guests
  for all using (
    exists (
      select 1 from public.weddings w
      where w.id = guests.wedding_id and w.user_id = auth.uid()
    )
  );

-- RSVPs: owners can read, public can insert (for invite page)
create policy "Owners can view RSVPs" on public.rsvps
  for select using (
    exists (
      select 1 from public.weddings w
      where w.id = rsvps.wedding_id and w.user_id = auth.uid()
    )
  );

create policy "Anyone can submit RSVP for published wedding" on public.rsvps
  for insert with check (
    exists (
      select 1 from public.weddings w
      where w.id = rsvps.wedding_id and w.is_published = true
    )
  );

-- Optional: public can view published wedding details for invite page (no auth needed)
create policy "Public can view published weddings by slug" on public.weddings
  for select using (is_published = true);

create policy "Public can view guests for published weddings (limited)" on public.guests
  for select using (
    exists (
      select 1 from public.weddings w
      where w.id = guests.wedding_id and w.is_published = true
    )
  );

-- Trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger weddings_updated_at
  before update on public.weddings
  for each row execute procedure public.handle_updated_at();

-- Note: For full Google auth + email, configure in Supabase Auth dashboard.
-- Add unique constraint on (wedding_id, email) for guests/rsvps if desired.

-- ============================================
-- PREMIUM FEATURES: Seating + Checklist + Email tracking (PR4-8)
-- ============================================

-- Extend guests for seating + email (run once)
alter table public.guests add column if not exists table_id uuid references public.seating_tables(id);
alter table public.guests add column if not exists email_sent_at timestamptz;
alter table public.guests add column if not exists email_opened_at timestamptz;

-- Seating tables
create table if not exists public.seating_tables (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  name text not null,
  shape text not null default 'round',
  capacity integer not null default 8,
  x numeric,
  y numeric,
  rotation numeric,
  created_at timestamptz default now()
);

-- Seating assignments (one per guest)
create table if not exists public.seating_assignments (
  guest_id uuid primary key references public.guests(id) on delete cascade,
  table_id uuid references public.seating_tables(id) on delete cascade not null,
  seat integer
);

-- Checklist items
create table if not exists public.checklist_items (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  category text not null,
  label text not null,
  completed boolean not null default false,
  due_offset_months numeric,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists seating_tables_wedding_idx on public.seating_tables(wedding_id);
create index if not exists seating_assignments_table_idx on public.seating_assignments(table_id);
create index if not exists checklist_wedding_idx on public.checklist_items(wedding_id);

-- RLS for new tables
alter table public.seating_tables enable row level security;
alter table public.seating_assignments enable row level security;
alter table public.checklist_items enable row level security;

create policy "Owners manage seating tables" on public.seating_tables
  for all using (
    exists (select 1 from public.weddings w where w.id = seating_tables.wedding_id and w.user_id = auth.uid())
  );

create policy "Owners manage seating assignments" on public.seating_assignments
  for all using (
    exists (
      select 1 from public.guests g 
      join public.weddings w on w.id = g.wedding_id 
      where g.id = seating_assignments.guest_id and w.user_id = auth.uid()
    )
  );

create policy "Owners manage checklist" on public.checklist_items
  for all using (
    exists (select 1 from public.weddings w where w.id = checklist_items.wedding_id and w.user_id = auth.uid())
  );

-- Public read for published weddings' seating/checklist if needed for future public tools (optional)
create policy "Public read seating for published" on public.seating_tables
  for select using (
    exists (select 1 from public.weddings w where w.id = seating_tables.wedding_id and w.is_published = true)
  );

-- Updated_at trigger already covers weddings

