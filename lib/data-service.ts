"use client";

import { nanoid } from "nanoid";
import type {
  Wedding,
  Guest,
  GuestSide,
  Rsvp,
  WeddingCustomization,
  RsvpConfig,
  User,
  WeddingStats,
  SeatingTable,
  SeatingAssignment,
  ChecklistItem,
  BudgetCategory,
  WeddingBudget,
} from "@/types";

// Default customization for new weddings
export const DEFAULT_CUSTOMIZATION: WeddingCustomization = {
  accentColor: "#D4AF37", // champagne gold - updated for premium
  fontStyle: "serif",
  backgroundStyle: "paper",
  showCoverPhoto: true,
  coverPhotoUrl: undefined,
};

export const DEFAULT_RSVP_CONFIG: RsvpConfig = {
  allowPlusOne: true,
  mealChoicesEnabled: true,
  mealChoices: ["Chicken", "Seared Salmon", "Vegetarian Risotto", "Kids Meal"],
  songRequestsEnabled: true,
  notesEnabled: true,
  dietaryEnabled: true,
};

// Default budget categories for new weddings (realistic starter)
export const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: "cat-venue", name: "Venue & Ceremony", budgeted: 5000, spent: 0 },
  { id: "cat-catering", name: "Catering & Bar", budgeted: 4500, spent: 0 },
  { id: "cat-attire", name: "Attire & Beauty", budgeted: 2000, spent: 0 },
  { id: "cat-photo", name: "Photography & Video", budgeted: 3000, spent: 0 },
  { id: "cat-florals", name: "Florals & Decor", budgeted: 1500, spent: 0 },
  { id: "cat-music", name: "Music & Entertainment", budgeted: 1200, spent: 0 },
  { id: "cat-stationery", name: "Stationery & Invites", budgeted: 700, spent: 0 },
  { id: "cat-gifts", name: "Gifts, Favors & Welcome", budgeted: 800, spent: 0 },
  { id: "cat-transport", name: "Transportation", budgeted: 600, spent: 0 },
  { id: "cat-misc", name: "Miscellaneous & Contingency", budgeted: 1200, spent: 0 },
];

// In-memory + localStorage backed store for MVP (Supabase-ready)
// Swap this implementation for real Supabase calls later.
class LocalWeddingService {
  private readonly STORAGE_KEY = "twt_data_v1";
  private readonly USER_KEY = "twt_user_v1";

  private data: {
    weddings: Wedding[];
    guests: Guest[];
    rsvps: Rsvp[];
    tables: SeatingTable[];
    assignments: SeatingAssignment[];
    checklist: ChecklistItem[];
    // Budget/gift data is denormalized onto Wedding + Guest for simplicity (local MVP)
  } = {
    weddings: [],
    guests: [],
    rsvps: [],
    tables: [],
    assignments: [],
    checklist: [],
  };

  private currentUser: User | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const loaded = JSON.parse(raw);
        this.data = {
          ...this.data, // provide defaults for new fields
          ...loaded,
          tables: loaded.tables || [],
          assignments: loaded.assignments || [],
          checklist: loaded.checklist || [],
        };
      }
      const userRaw = localStorage.getItem(this.USER_KEY);
      if (userRaw) {
        this.currentUser = JSON.parse(userRaw);
      }
    } catch (e) {
      console.warn("Failed to load local data", e);
    }
  }

  private persist() {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    if (this.currentUser) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(this.currentUser));
    }
  }

  // --- Auth (demo/local) ---
  async signUp(email: string, fullName?: string): Promise<User> {
    // Simulate Supabase sign up
    const user: User = {
      id: nanoid(),
      email: email.toLowerCase().trim(),
      fullName: fullName || email.split("@")[0],
      createdAt: new Date().toISOString(),
    };
    this.currentUser = user;
    this.persist();
    return user;
  }

  async signIn(email: string): Promise<User> {
    const users = this.getAllUsers(); // simplistic
    let user = users.find((u) => u.email === email.toLowerCase().trim());

    if (!user) {
      // Auto-create for smooth demo experience
      user = await this.signUp(email);
    } else {
      this.currentUser = user;
      this.persist();
    }
    return user;
  }

  async signInWithGoogle(): Promise<User> {
    // Simulated Google social login
    const demoEmail = `demo.${Date.now()}@gmail.com`;
    const user = await this.signUp(demoEmail, "Alex Rivera");
    return user;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.USER_KEY);
    }
  }

  private getAllUsers(): User[] {
    // For demo we only track current; in real would be separate
    return this.currentUser ? [this.currentUser] : [];
  }

  // --- Weddings ---
  async getWeddingsForUser(userId: string): Promise<Wedding[]> {
    return this.data.weddings
      .filter((w) => w.userId === userId)
      .sort((a, b) => (a.weddingDate > b.weddingDate ? 1 : -1));
  }

  async getWeddingForUser(userId: string): Promise<Wedding | null> {
    const ws = await this.getWeddingsForUser(userId);
    return ws[0] || null;
  }

  async getWeddingById(id: string): Promise<Wedding | null> {
    return this.data.weddings.find((w) => w.id === id) || null;
  }

  async getWeddingBySlug(slug: string): Promise<Wedding | null> {
    return this.data.weddings.find((w) => w.slug === slug) || null;
  }

  async createWedding(
    userId: string,
    input: {
      partner1Name: string;
      partner2Name: string;
      weddingDate: string;
      ceremonyTime: string;
      venueName: string;
      venueAddress: string;
      venueCity: string;
    }
  ): Promise<Wedding> {
    const baseSlug = `${input.partner1Name.toLowerCase().split(" ")[0]}-${input.partner2Name.toLowerCase().split(" ")[0]}-${new Date(input.weddingDate).getFullYear()}`;
    let slug = baseSlug;
    let counter = 1;
    // Ensure unique slug
    while (this.data.weddings.some((w) => w.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const now = new Date().toISOString();

    const wedding: Wedding = {
      id: nanoid(),
      userId,
      partner1Name: input.partner1Name.trim(),
      partner2Name: input.partner2Name.trim(),
      weddingDate: input.weddingDate,
      ceremonyTime: input.ceremonyTime,
      venueName: input.venueName.trim(),
      venueAddress: input.venueAddress.trim(),
      venueCity: input.venueCity.trim(),
      slug,
      template: "classic",
      customization: { ...DEFAULT_CUSTOMIZATION },
      rsvpConfig: { ...DEFAULT_RSVP_CONFIG },
      isPublished: true,
      createdAt: now,
      updatedAt: now,
      budget: {
        total: 25000, // sensible default for demo
        spent: 6500,  // Amount Saved / Out of Pocket (demo)
        suggestedPerGuestGift: 150,
        totalExpectedInvitees: 175,
        expectedAttendanceRate: 75,
        categories: JSON.parse(JSON.stringify(DEFAULT_BUDGET_CATEGORIES)), // deep clone
      },
    };

    this.data.weddings.push(wedding);
    this.persist();
    return wedding;
  }

  async updateWedding(weddingId: string, updates: Partial<Wedding>): Promise<Wedding> {
    const idx = this.data.weddings.findIndex((w) => w.id === weddingId);
    if (idx === -1) throw new Error("Wedding not found");

    const updated: Wedding = {
      ...this.data.weddings[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.weddings[idx] = updated;
    this.persist();
    return updated;
  }

  async deleteWedding(weddingId: string): Promise<void> {
    this.data.weddings = this.data.weddings.filter((w) => w.id !== weddingId);
    this.data.guests = this.data.guests.filter((g) => g.weddingId !== weddingId);
    this.data.rsvps = this.data.rsvps.filter((r) => r.weddingId !== weddingId);
    this.persist();
  }

  // --- Guests ---
  async getGuestsForWedding(weddingId: string): Promise<Guest[]> {
    return this.data.guests
      .filter((g) => g.weddingId === weddingId)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  async addGuest(weddingId: string, guestInput: Omit<Guest, "id" | "weddingId" | "createdAt" | "status">): Promise<Guest> {
    const guest: Guest = {
      id: nanoid(),
      weddingId,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...guestInput,
    };
    this.data.guests.push(guest);
    this.persist();
    return guest;
  }

  async addSelfAddedGuest(weddingId: string, input: { fullName: string; email: string; phone?: string; plusOnes?: number }): Promise<Guest> {
    const wedding = this.data.weddings.find((w) => w.id === weddingId);
    const suggested = wedding?.budget?.suggestedPerGuestGift || 150;

    const partySize = input.plusOnes || 1;
    const guest: Guest = {
      id: nanoid(),
      weddingId,
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || undefined,
      side: "both",
      plusOne: partySize > 1,
      plusOnes: Math.max(0, partySize - 1),
      status: "pending",
      selfAdded: true,
      createdAt: new Date().toISOString(),
      suggestedContribution: suggested,
    };
    this.data.guests.push(guest);
    this.persist();
    return guest;
  }

  async updateGuest(guestId: string, updates: Partial<Guest>): Promise<Guest> {
    const idx = this.data.guests.findIndex((g) => g.id === guestId);
    if (idx === -1) throw new Error("Guest not found");
    this.data.guests[idx] = { ...this.data.guests[idx], ...updates };
    this.persist();
    return this.data.guests[idx];
  }

  async deleteGuest(guestId: string): Promise<void> {
    this.data.guests = this.data.guests.filter((g) => g.id !== guestId);
    this.persist();
  }

  async importGuestsFromCSV(weddingId: string, rows: Array<Partial<Guest>>): Promise<Guest[]> {
    const added: Guest[] = [];
    for (const row of rows) {
      // Support name / fullName variants + tolerate completely missing optional fields (email/phone/plusOnes etc)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fullName = (row.fullName || (row as any).name || '').toString().trim();
      if (!fullName) continue;
      const guest = await this.addGuest(weddingId, {
        fullName,
        email: row.email || (row as any).email, // eslint-disable-line @typescript-eslint/no-explicit-any
        phone: row.phone || (row as any).phoneNumber || (row as any).phone, // eslint-disable-line @typescript-eslint/no-explicit-any
        side: (row.side as GuestSide) || "both",
        plusOne: !!row.plusOne,
        plusOneName: row.plusOneName,
        tableNumber: row.tableNumber,
        tableId: row.tableId,
        dietaryNotes: row.dietaryNotes,
        // suggestedContribution will be applied from budget on add in UI flows; here preserve if provided
        suggestedContribution: (row as any).suggestedContribution, // eslint-disable-line @typescript-eslint/no-explicit-any
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      added.push(guest);
    }
    return added;
  }

  // --- Seating Chart (new for premium) ---
  async getTablesForWedding(weddingId: string): Promise<SeatingTable[]> {
    return this.data.tables
      .filter((t) => t.weddingId === weddingId)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  async addTable(weddingId: string, input: Omit<SeatingTable, 'id' | 'weddingId'>): Promise<SeatingTable> {
    const table: SeatingTable = {
      id: nanoid(),
      weddingId,
      ...input,
      x: input.x ?? 20,
      y: input.y ?? 20,
    };
    this.data.tables.push(table);
    this.persist();
    return table;
  }

  async updateTable(tableId: string, updates: Partial<SeatingTable>): Promise<SeatingTable> {
    const idx = this.data.tables.findIndex((t) => t.id === tableId);
    if (idx === -1) throw new Error("Table not found");
    this.data.tables[idx] = { ...this.data.tables[idx], ...updates };
    this.persist();
    return this.data.tables[idx];
  }

  async deleteTable(tableId: string): Promise<void> {
    this.data.tables = this.data.tables.filter((t) => t.id !== tableId);
    // cascade: unassign guests
    this.data.assignments = this.data.assignments.filter((a) => a.tableId !== tableId);
    // also clear tableId on guests
    this.data.guests.forEach(g => {
      if (g.tableId === tableId) g.tableId = undefined;
    });
    this.persist();
  }

  async getAssignmentsForWedding(weddingId: string): Promise<SeatingAssignment[]> {
    const tableIds = new Set(this.data.tables.filter(t => t.weddingId === weddingId).map(t => t.id));
    return this.data.assignments.filter(a => tableIds.has(a.tableId));
  }

  async assignGuestToTable(guestId: string, tableId: string, seat?: number): Promise<void> {
    // remove previous assignment for this guest
    this.data.assignments = this.data.assignments.filter((a) => a.guestId !== guestId);
    this.data.assignments.push({ guestId, tableId, seat });
    // sync legacy + new on guest
    const gIdx = this.data.guests.findIndex(g => g.id === guestId);
    if (gIdx !== -1) {
      this.data.guests[gIdx].tableId = tableId;
      const table = this.data.tables.find(t => t.id === tableId);
      if (table) this.data.guests[gIdx].tableNumber = table.name;
    }
    this.persist();
  }

  async unassignGuest(guestId: string): Promise<void> {
    this.data.assignments = this.data.assignments.filter((a) => a.guestId !== guestId);
    const gIdx = this.data.guests.findIndex(g => g.id === guestId);
    if (gIdx !== -1) {
      this.data.guests[gIdx].tableId = undefined;
      // keep tableNumber or clear? keep for legacy
    }
    this.persist();
  }

  async getGuestsForTable(tableId: string): Promise<Guest[]> {
    const assignedIds = this.data.assignments
      .filter(a => a.tableId === tableId)
      .map(a => a.guestId);
    return this.data.guests.filter(g => assignedIds.includes(g.id));
  }

  // --- Email Invitations (demo simulation for premium) ---
  async sendEmailInvitations(weddingId: string, guestIds?: string[]): Promise<number> {
    const targetGuests = guestIds 
      ? this.data.guests.filter(g => g.weddingId === weddingId && guestIds.includes(g.id))
      : this.data.guests.filter(g => g.weddingId === weddingId);

    const now = new Date().toISOString();
    let sent = 0;
    for (const g of targetGuests) {
      if (g.email) {
        const idx = this.data.guests.findIndex(x => x.id === g.id);
        if (idx !== -1) {
          this.data.guests[idx].emailSentAt = now;
          // simulate open after delay (for demo, mark some opened immediately)
          if (Math.random() > 0.3) {
            this.data.guests[idx].emailOpenedAt = new Date(Date.now() + 120000).toISOString();
          }
          sent++;
        }
      }
    }
    this.persist();
    return sent;
  }

  async getEmailStats(weddingId: string) {
    const gs = this.data.guests.filter(g => g.weddingId === weddingId);
    const sent = gs.filter(g => g.emailSentAt).length;
    const opened = gs.filter(g => g.emailOpenedAt).length;
    return { sent, opened, total: gs.length };
  }

  // --- Budget & Gift Tracking (Step A + E) ---
  async updateWeddingBudget(weddingId: string, budgetUpdate: Partial<WeddingBudget>): Promise<Wedding> {
    const idx = this.data.weddings.findIndex(w => w.id === weddingId);
    if (idx === -1) throw new Error("Wedding not found");

    const current = this.data.weddings[idx];
    const newBudget: WeddingBudget = {
      total: budgetUpdate.total ?? current.budget?.total ?? 25000,
      spent: budgetUpdate.spent ?? current.budget?.spent ?? 0,
      suggestedPerGuestGift: budgetUpdate.suggestedPerGuestGift ?? current.budget?.suggestedPerGuestGift,
      totalExpectedInvitees: budgetUpdate.totalExpectedInvitees ?? current.budget?.totalExpectedInvitees ?? 175,
      expectedAttendanceRate: budgetUpdate.expectedAttendanceRate ?? current.budget?.expectedAttendanceRate ?? 75,
      categories: budgetUpdate.categories ?? current.budget?.categories ?? JSON.parse(JSON.stringify(DEFAULT_BUDGET_CATEGORIES)),
    };

    const updatedWedding = {
      ...current,
      budget: newBudget,
      updatedAt: new Date().toISOString(),
    };
    this.data.weddings[idx] = updatedWedding;
    this.persist();
    return updatedWedding;
  }

  async updateGuestGift(guestId: string, gift: { actualGiftAmount?: number; giftReceived?: boolean; giftNotes?: string; suggestedContribution?: number }): Promise<Guest> {
    const idx = this.data.guests.findIndex(g => g.id === guestId);
    if (idx === -1) throw new Error("Guest not found");

    const g = this.data.guests[idx];
    const updated: Guest = {
      ...g,
      ...gift,
    };
    this.data.guests[idx] = updated;
    this.persist();
    return updated;
  }

  async getBudgetProgress(weddingId: string): Promise<{ totalBudget: number; totalSpent: number; percent: number; categories: BudgetCategory[] }> {
    const w = this.data.weddings.find(ww => ww.id === weddingId);
    if (!w || !w.budget) {
      return { totalBudget: 0, totalSpent: 0, percent: 0, categories: [] };
    }
    const cats = w.budget.categories || [];
    // Prefer top-level spent (Amount Saved / Out of Pocket) for simplified budget; fallback to sum of category spends for compat
    const totalSpent = (typeof w.budget.spent === 'number' && w.budget.spent >= 0)
      ? w.budget.spent
      : cats.reduce((sum, c) => sum + (c.spent || 0), 0);
    const percent = w.budget.total > 0 ? Math.round((totalSpent / w.budget.total) * 100) : 0;
    return {
      totalBudget: w.budget.total,
      totalSpent,
      percent: Math.min(100, Math.max(0, percent)),
      categories: cats,
    };
  }

  async getGiftSummary(weddingId: string): Promise<{ expected: number; received: number; countReceived: number; totalGuestsWithSuggestion: number }> {
    const guests = this.data.guests.filter(g => g.weddingId === weddingId);
    const w = this.data.weddings.find(ww => ww.id === weddingId);
    const defaultPerGuest = w?.budget?.suggestedPerGuestGift || 0;

    let expected = 0;
    let received = 0;
    let countReceived = 0;
    let withSuggestion = 0;

    guests.forEach(g => {
      const contrib = g.suggestedContribution ?? defaultPerGuest;
      if (contrib > 0) {
        withSuggestion++;
        expected += contrib;
        if (g.giftReceived && g.actualGiftAmount) {
          received += g.actualGiftAmount;
          countReceived++;
        }
      }
    });

    return { expected, received, countReceived, totalGuestsWithSuggestion: withSuggestion };
  }

  // --- Comprehensive Wedding Checklist (world-class 12-month version) ---
  private readonly CHECKLIST_TEMPLATE: Array<Omit<ChecklistItem, 'id' | 'weddingId' | 'completed'>> = [
    // 12+ Months Before
    { category: "12+ Months Before", label: "Announce your engagement", dueOffsetMonths: 12 },
    { category: "12+ Months Before", label: "Set your wedding budget and decide who is contributing", dueOffsetMonths: 12 },
    { category: "12+ Months Before", label: "Determine your wedding date (or date range)", dueOffsetMonths: 12 },
    { category: "12+ Months Before", label: "Create your initial guest list", dueOffsetMonths: 12 },
    { category: "12+ Months Before", label: "Choose and book your ceremony & reception venue", dueOffsetMonths: 12 },
    { category: "12+ Months Before", label: "Hire a wedding planner/coordinator (if desired)", dueOffsetMonths: 12 },
    { category: "12+ Months Before", label: "Start looking at wedding dress styles", dueOffsetMonths: 12 },
    { category: "12+ Months Before", label: "Choose your wedding party (bridesmaids, groomsmen, etc.)", dueOffsetMonths: 12 },
    { category: "12+ Months Before", label: "Book priority vendors: Photographer, Videographer, Caterer, Florist", dueOffsetMonths: 12 },
    { category: "12+ Months Before", label: "Create a wedding website", dueOffsetMonths: 12 },
    { category: "12+ Months Before", label: "Start a Pinterest board / mood board for inspiration", dueOffsetMonths: 12 },

    // 9–11 Months Before
    { category: "9–11 Months Before", label: "Finalize guest list and collect addresses", dueOffsetMonths: 10 },
    { category: "9–11 Months Before", label: "Book remaining key vendors (DJ/Band, Officiant, Baker, Hair & Makeup)", dueOffsetMonths: 10 },
    { category: "9–11 Months Before", label: "Order your wedding dress and bridesmaid dresses", dueOffsetMonths: 10 },
    { category: "9–11 Months Before", label: "Choose and order invitations & save-the-dates", dueOffsetMonths: 10 },
    { category: "9–11 Months Before", label: "Book honeymoon (if destination)", dueOffsetMonths: 10 },
    { category: "9–11 Months Before", label: "Register for gifts (optional)", dueOffsetMonths: 10 },
    { category: "9–11 Months Before", label: "Plan engagement photos", dueOffsetMonths: 10 },
    { category: "9–11 Months Before", label: "Book transportation (limos, shuttles, etc.)", dueOffsetMonths: 10 },

    // 6–8 Months Before
    { category: "6–8 Months Before", label: "Send Save the Dates", dueOffsetMonths: 7 },
    { category: "6–8 Months Before", label: "Finalize ceremony details (vows, readings, music)", dueOffsetMonths: 7 },
    { category: "6–8 Months Before", label: "Order groom’s tux/suit and groomsmen attire", dueOffsetMonths: 7 },
    { category: "6–8 Months Before", label: "Book rehearsal dinner venue", dueOffsetMonths: 7 },
    { category: "6–8 Months Before", label: "Start planning honeymoon details", dueOffsetMonths: 7 },
    { category: "6–8 Months Before", label: "Purchase wedding rings", dueOffsetMonths: 7 },
    { category: "6–8 Months Before", label: "Finalize floral arrangements and décor vision", dueOffsetMonths: 7 },
    { category: "6–8 Months Before", label: "Order wedding cake", dueOffsetMonths: 7 },
    { category: "6–8 Months Before", label: "Choose favors", dueOffsetMonths: 7 },
    { category: "6–8 Months Before", label: "Plan seating chart (start early)", dueOffsetMonths: 7 },

    // 3–5 Months Before
    { category: "3–5 Months Before", label: "Send formal invitations", dueOffsetMonths: 4 },
    { category: "3–5 Months Before", label: "Finalize menu and tasting", dueOffsetMonths: 4 },
    { category: "3–5 Months Before", label: "Confirm all vendor contracts and payments", dueOffsetMonths: 4 },
    { category: "3–5 Months Before", label: "Finalize wedding party attire and accessories", dueOffsetMonths: 4 },
    { category: "3–5 Months Before", label: "Book hotel room blocks for guests", dueOffsetMonths: 4 },
    { category: "3–5 Months Before", label: "Start writing vows", dueOffsetMonths: 4 },
    { category: "3–5 Months Before", label: "Plan ceremony music and playlist", dueOffsetMonths: 4 },
    { category: "3–5 Months Before", label: "Order stationery (programs, place cards, menus, thank you cards)", dueOffsetMonths: 4 },

    // 2 Months Before
    { category: "2 Months Before", label: "Finalize guest count and seating chart", dueOffsetMonths: 2 },
    { category: "2 Months Before", label: "Confirm all vendor details and timelines", dueOffsetMonths: 2 },
    { category: "2 Months Before", label: "Purchase gifts for wedding party and parents", dueOffsetMonths: 2 },
    { category: "2 Months Before", label: "Finalize honeymoon plans", dueOffsetMonths: 2 },
    { category: "2 Months Before", label: "Get marriage license", dueOffsetMonths: 2 },
    { category: "2 Months Before", label: "Have final dress fitting", dueOffsetMonths: 2 },
    { category: "2 Months Before", label: "Create day-of timeline", dueOffsetMonths: 2 },

    // 1 Month Before
    { category: "1 Month Before", label: "Send final payments to vendors", dueOffsetMonths: 1 },
    { category: "1 Month Before", label: "Create welcome bags for guests", dueOffsetMonths: 1 },
    { category: "1 Month Before", label: "Confirm final headcount with venue/caterer", dueOffsetMonths: 1 },
    { category: "1 Month Before", label: "Pack emergency kit", dueOffsetMonths: 1 },
    { category: "1 Month Before", label: "Do a final venue walk-through", dueOffsetMonths: 1 },
    { category: "1 Month Before", label: "Assign roles for day-of (who’s handling what)", dueOffsetMonths: 1 },
    { category: "1 Month Before", label: "Write rehearsal dinner speech", dueOffsetMonths: 1 },

    // Final Week
    { category: "Final Week", label: "Confirm all vendor arrival times", dueOffsetMonths: 0.5 },
    { category: "Final Week", label: "Distribute final timeline to wedding party and vendors", dueOffsetMonths: 0.5 },
    { category: "Final Week", label: "Prepare payments for vendors (in envelopes)", dueOffsetMonths: 0.5 },
    { category: "Final Week", label: "Get manicure/pedicure", dueOffsetMonths: 0.5 },
    { category: "Final Week", label: "Pack for honeymoon", dueOffsetMonths: 0.5 },
    { category: "Final Week", label: "Relax and enjoy pre-wedding events", dueOffsetMonths: 0.5 },

    // Day Before / Wedding Day
    { category: "Day Before / Wedding Day", label: "Rehearsal and rehearsal dinner", dueOffsetMonths: 0 },
    { category: "Day Before / Wedding Day", label: "Give gifts to wedding party", dueOffsetMonths: 0 },
    { category: "Day Before / Wedding Day", label: "Final hair & makeup", dueOffsetMonths: 0 },
    { category: "Day Before / Wedding Day", label: "Ceremony & Reception", dueOffsetMonths: 0 },
    { category: "Day Before / Wedding Day", label: "Enjoy your day!", dueOffsetMonths: 0 },
  ];

  async getChecklistForWedding(weddingId: string): Promise<ChecklistItem[]> {
    let items = this.data.checklist.filter(c => c.weddingId === weddingId);
    if (items.length === 0) {
      // lazy init from template
      const wedding = await this.getWeddingById(weddingId);
      if (wedding) {
        items = this.CHECKLIST_TEMPLATE.map((tpl, idx) => ({
          ...tpl,
          id: `chk-${weddingId}-${idx}`,
          weddingId,
          completed: false,
        }));
        this.data.checklist.push(...items);
        this.persist();
      }
    }
    return items.sort((a, b) => (b.dueOffsetMonths || 0) - (a.dueOffsetMonths || 0)); // chronological: earliest (high months out) first
  }

  async toggleChecklistItem(itemId: string, completed: boolean): Promise<void> {
    const idx = this.data.checklist.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    this.data.checklist[idx].completed = completed;
    this.persist();
  }

  async getChecklistProgress(weddingId: string): Promise<{ completed: number; total: number; percent: number }> {
    const items = await this.getChecklistForWedding(weddingId);
    const completed = items.filter(i => i.completed).length;
    const total = items.length;
    return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
  }

  async addCustomChecklistItem(weddingId: string, label: string, category: string = "Custom"): Promise<ChecklistItem> {
    const wedding = await this.getWeddingById(weddingId);
    if (!wedding) throw new Error("Wedding not found");
    const item: ChecklistItem = {
      id: `chk-${weddingId}-custom-${nanoid(6)}`,
      weddingId,
      category,
      label: label.trim(),
      completed: false,
      dueOffsetMonths: 0, // custom items are flexible
    };
    this.data.checklist.push(item);
    this.persist();
    return item;
  }

  async resetChecklistForWedding(weddingId: string): Promise<void> {
    this.data.checklist = this.data.checklist.filter(c => c.weddingId !== weddingId);
    this.persist();
  }

  // --- RSVPs ---
  async getRsvpsForWedding(weddingId: string): Promise<Rsvp[]> {
    return this.data.rsvps
      .filter((r) => r.weddingId === weddingId)
      .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
  }

  async submitRsvp(
    weddingId: string,
    rsvpInput: Omit<Rsvp, "id" | "weddingId" | "submittedAt">
  ): Promise<Rsvp> {
    const rsvp: Rsvp = {
      id: nanoid(),
      weddingId,
      submittedAt: new Date().toISOString(),
      ...rsvpInput,
    };
    this.data.rsvps.push(rsvp);

    // Auto-update linked guest status if email or name matches
    if (rsvpInput.guestId) {
      const gIdx = this.data.guests.findIndex((g) => g.id === rsvpInput.guestId);
      if (gIdx !== -1) {
        this.data.guests[gIdx].status = rsvpInput.isAttending ? "attending" : "declined";
      }
    } else {
      // Try to match by email or name
      const match = this.data.guests.find(
        (g) =>
          g.weddingId === weddingId &&
          ((rsvpInput.email && g.email?.toLowerCase() === rsvpInput.email.toLowerCase()) ||
            g.fullName.toLowerCase() === rsvpInput.guestName.toLowerCase())
      );
      if (match) {
        match.status = rsvpInput.isAttending ? "attending" : "declined";
      }
    }

    this.persist();
    return rsvp;
  }

  // --- Stats ---
  async getWeddingStats(weddingId: string): Promise<WeddingStats> {
    const guests = await this.getGuestsForWedding(weddingId);
    const rsvps = await this.getRsvpsForWedding(weddingId);

    const totalInvited = guests.length;
    const totalResponses = rsvps.length;

    let attending = 0;
    let declined = 0;
    let maybe = 0;
    let pending = 0;

    guests.forEach((g) => {
      if (g.status === "attending") attending++;
      else if (g.status === "declined") declined++;
      else if (g.status === "maybe") maybe++;
      else pending++;
    });

    return {
      totalInvited,
      totalResponses,
      attending,
      declined,
      maybe,
      pending,
    };
  }
}

// Singleton service instance
export const weddingService = new LocalWeddingService();

// Helper to get a demo wedding quickly (used in development / first visit)
export async function ensureDemoData(userId: string): Promise<void> {
  const existing = await weddingService.getWeddingsForUser(userId);
  if (existing.length > 0) return;

  // Seed one beautiful sample wedding
  const wedding = await weddingService.createWedding(userId, {
    partner1Name: "Isabella",
    partner2Name: "James",
    weddingDate: "2025-09-20",
    ceremonyTime: "16:30",
    venueName: "The Conservatory at The Grand Estate",
    venueAddress: "1425 Willowbrook Lane",
    venueCity: "Napa Valley, California",
  });

  // Update with nicer details
  await weddingService.updateWedding(wedding.id, {
    receptionTime: "18:30",
    dressCode: "Black Tie",
    welcomeMessage:
      "We are overjoyed to celebrate our love with you in the heart of wine country. Your presence means the world to us.",
    additionalInfo:
      "The ceremony will be held outdoors. Please bring a light jacket for the evening reception.",
    template: "floral",
    customization: {
      accentColor: "#D4AF37",
      fontStyle: "serif",
      backgroundStyle: "paper",
      showCoverPhoto: true,
      coverPhotoUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80", // elegant wedding venue (no people)
    },
    rsvpConfig: {
      ...DEFAULT_RSVP_CONFIG,
      mealChoices: ["Herb-Crusted Chicken", "Pan-Seared Branzino", "Wild Mushroom Risotto", "Children's Plate"],
    },
  });

  // Add sample guests
  const sampleGuests: Array<Omit<Guest, "id" | "weddingId" | "createdAt" | "status">> = [
    { fullName: "Eleanor Thompson", email: "eleanor.t@email.com", side: "partner1", plusOne: true, tableNumber: "1" },
    { fullName: "Marcus Chen", email: "marcus.chen@email.com", side: "both", plusOne: false, tableNumber: "2" },
    { fullName: "Sofia Patel", email: "sofia.patel@email.com", side: "partner2", plusOne: true, tableNumber: "1" },
    { fullName: "Theodore & Clara Bennett", email: "clara.bennett@email.com", side: "both", plusOne: false, tableNumber: "3" },
    { fullName: "Amara Johnson", email: "amara.j@icloud.com", side: "partner1", plusOne: false, tableNumber: "2", dietaryNotes: "Gluten-free" },
  ];

  for (const g of sampleGuests) {
    await weddingService.addGuest(wedding.id, g);
  }

  // Seed realistic gift suggestions + a couple received gifts for demo (new)
  const allGuests = await weddingService.getGuestsForWedding(wedding.id);
  if (allGuests.length > 0) {
    await weddingService.updateGuestGift(allGuests[0].id, { suggestedContribution: 175, actualGiftAmount: 200, giftReceived: true, giftNotes: "Beautiful crystal vase" });
    await weddingService.updateGuestGift(allGuests[1].id, { suggestedContribution: 150, actualGiftAmount: 150, giftReceived: true });
    if (allGuests[2]) await weddingService.updateGuestGift(allGuests[2].id, { suggestedContribution: 175 });
  }

  // One sample RSVP
  await weddingService.submitRsvp(wedding.id, {
    guestName: "Eleanor Thompson",
    email: "eleanor.t@email.com",
    isAttending: true,
    plusOneCount: 1,
    mealChoice: "Herb-Crusted Chicken",
    songRequest: "At Last - Etta James",
    message: "So happy for you both! Can't wait to celebrate.",
  });

  // Seed some seating tables and assignments for demo (new premium feature)
  const table1 = await weddingService.addTable(wedding.id, {
    name: "Table 1",
    shape: "round",
    capacity: 8,
    x: 15,
    y: 25,
  });
  const table2 = await weddingService.addTable(wedding.id, {
    name: "Table 2",
    shape: "rect",
    capacity: 10,
    x: 55,
    y: 30,
  });
  const table3 = await weddingService.addTable(wedding.id, {
    name: "Table 3",
    shape: "round",
    capacity: 6,
    x: 30,
    y: 65,
  });

  // Assign based on the sample guests' tableNumber (Eleanor+ Sofia to 1, Marcus to 2, etc)
  // We need to fetch the actual guests after add to get ids
  const seededGuests = await weddingService.getGuestsForWedding(wedding.id);
  for (const g of seededGuests) {
    if (g.tableNumber === "1") await weddingService.assignGuestToTable(g.id, table1.id);
    if (g.tableNumber === "2") await weddingService.assignGuestToTable(g.id, table2.id);
    if (g.tableNumber === "3") await weddingService.assignGuestToTable(g.id, table3.id);
  }

  // Clear any old checklist to force the new comprehensive 12-month version
  await weddingService.resetChecklistForWedding(wedding.id);

  // Initialize checklist for demo (lazy init + mark some done for impressive starting state)
  const demoChecklist = await weddingService.getChecklistForWedding(wedding.id);
  const toComplete = demoChecklist.slice(0, 8);
  for (const item of toComplete) {
    await weddingService.toggleChecklistItem(item.id, true);
  }
}
