export type WeddingTemplate = "classic" | "modern" | "floral" | "minimal";

export interface WeddingCustomization {
  accentColor: string; // hex e.g. "#C5A46E"
  secondaryColor?: string;
  fontStyle: "serif" | "script" | "sans";
  backgroundStyle: "paper" | "gradient" | "subtle";
  showCoverPhoto: boolean;
  coverPhotoUrl?: string; // data URL or remote for demo
}

export interface RsvpConfig {
  allowPlusOne: boolean;
  mealChoicesEnabled: boolean;
  mealChoices: string[]; // e.g. ["Chicken", "Fish", "Vegetarian", "Kids"]
  songRequestsEnabled: boolean;
  notesEnabled: boolean;
  dietaryEnabled: boolean;
}

export interface Wedding {
  id: string;
  userId: string;
  partner1Name: string;
  partner2Name: string;
  weddingDate: string; // ISO date
  ceremonyTime: string; // HH:MM
  receptionTime?: string;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  dressCode?: string;
  welcomeMessage?: string;
  additionalInfo?: string;
  slug: string;
  template: WeddingTemplate;
  customization: WeddingCustomization;
  rsvpConfig: RsvpConfig;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  // New: Budget & gift guidance (Step A)
  budget?: WeddingBudget;
}

export type GuestSide = "partner1" | "partner2" | "both";

export interface Guest {
  id: string;
  weddingId: string;
  fullName: string;
  email?: string;
  phone?: string;
  side: GuestSide;
  plusOne: boolean;
  plusOneName?: string;
  tableNumber?: string; // legacy for simple table labels
  tableId?: string; // seating chart reference
  dietaryNotes?: string;
  status: "pending" | "attending" | "declined" | "maybe";
  createdAt: string;
  // Email tracking
  emailSentAt?: string;
  emailOpenedAt?: string;
  // Gift tracking (new)
  suggestedContribution?: number; // per-guest override
  actualGiftAmount?: number;
  giftReceived?: boolean;
  giftNotes?: string;
  // Self-Add via QR feature
  selfAdded?: boolean;
  plusOnes?: number; // number of additional guests
}

export interface Rsvp {
  id: string;
  weddingId: string;
  guestId?: string; // link if from guest list
  guestName: string;
  email: string;
  isAttending: boolean;
  plusOneCount: number;
  mealChoice?: string;
  songRequest?: string;
  dietaryNotes?: string;
  message?: string;
  submittedAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  partner1Name?: string;
  partner2Name?: string;
  createdAt: string;
}

// For dashboard stats
export interface WeddingStats {
  totalInvited: number;
  totalResponses: number;
  attending: number;
  declined: number;
  maybe: number;
  pending: number;
}

// Seating Chart (PR4/PR5)
export interface SeatingTable {
  id: string;
  weddingId: string;
  name: string;
  shape: 'round' | 'rect';
  capacity: number;
  x: number; // 0-100 percentage position in floorplan
  y: number;
  rotation?: number; // degrees
}

export interface SeatingAssignment {
  guestId: string;
  tableId: string;
  seat?: number; // optional seat number within table
}

// Wedding Planning Checklist (standout free feature)
export interface ChecklistItem {
  id: string;
  weddingId: string;
  category: string;
  label: string;
  completed: boolean;
  dueOffsetMonths?: number; // months before weddingDate
}

// Budget & Gift Tracking (new guided workflow - Step A & E)
export interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;   // planned amount
  spent: number;      // actual spent / allocated (couple out-of-pocket)
  funded?: number;    // amount funded via guest contributions (for Funding Momentum / Budget Progress visuals)
}

export interface WeddingBudget {
  total: number;                  // overall wedding budget
  spent?: number;                 // Amount Saved / Out of Pocket (what couple has paid/saved so far)
  suggestedPerGuestGift?: number; // default gift contribution suggestion (powers tracking)
  categories: BudgetCategory[];
  // New smart fields for attendee-based calculations
  totalExpectedInvitees?: number;
  expectedAttendanceRate?: number; // 0-100 percentage
}

export interface GiftRecord {
  guestId: string;
  amount: number;
  received: boolean;
  notes?: string;
  recordedAt: string;
}
