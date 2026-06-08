"use client";

import type { Rsvp, Guest, Wedding } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Props {
  rsvps: Rsvp[];
  guests: Guest[];
  wedding: Wedding;
}

export function RsvpList({ rsvps, guests, wedding }: Props) {
  if (rsvps.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="text-muted-foreground">No RSVPs yet. Share your invitation link and responses will appear here.</p>
        <p className="text-xs mt-4 text-muted-foreground/70">Public link: /invite/{wedding.slug}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rsvps.map((rsvp) => {
        const linkedGuest = guests.find((g) => g.id === rsvp.guestId);
        return (
          <div key={rsvp.id} className="rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{rsvp.guestName}</div>
                <div className="text-sm text-muted-foreground">{rsvp.email}</div>
              </div>
              <Badge variant={rsvp.isAttending ? "attending" : "declined"}>
                {rsvp.isAttending ? "Attending" : "Not attending"}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3 text-sm">
              {rsvp.plusOneCount > 0 && (
                <div>
                  <div className="text-muted-foreground text-xs">Guests</div>
                  {rsvp.plusOneCount + 1}
                </div>
              )}
              {rsvp.mealChoice && (
                <div>
                  <div className="text-muted-foreground text-xs">Meal</div>
                  {rsvp.mealChoice}
                </div>
              )}
              {rsvp.songRequest && (
                <div className="col-span-2 md:col-span-1">
                  <div className="text-muted-foreground text-xs">Song request</div>
                  {rsvp.songRequest}
                </div>
              )}
              {rsvp.message && (
                <div className="col-span-2">
                  <div className="text-muted-foreground text-xs">Message</div>
                  <span className="italic">“{rsvp.message}”</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t text-[11px] text-muted-foreground">
              Received {format(new Date(rsvp.submittedAt), "MMM d, yyyy 'at' h:mm a")}
            </div>
          </div>
        );
      })}
    </div>
  );
}
