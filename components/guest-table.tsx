"use client";

import type { Guest } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Props {
  guests: Guest[];
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Guest["status"]) => void;
  onGiftUpdate?: (id: string, updates: Partial<Guest>) => void;
}

export function GuestTable({ guests, onDelete, onStatusChange, onGiftUpdate }: Props) {
  if (guests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        No guests yet. Add guests manually or import a CSV.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm guest-table">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="text-left font-medium px-4 py-3">Name</th>
            <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Email</th>
            <th className="text-center font-medium px-4 py-3 hidden md:table-cell">Invite</th>
            <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Side</th>
            <th className="text-center font-medium px-4 py-3 hidden md:table-cell">Table</th>
            <th className="text-right font-medium px-4 py-3 hidden md:table-cell">Suggested</th>
            <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">Gift</th>
            <th className="text-center font-medium px-4 py-3 hidden lg:table-cell">Rec&apos;d</th>
            <th className="text-center font-medium px-4 py-3 hidden lg:table-cell">+1</th>
            <th className="text-left font-medium px-4 py-3">Status</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {guests.map((guest) => (
            <tr key={guest.id} className="border-b last:border-none hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">
                {guest.fullName}
                {guest.selfAdded && (
                  <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0 border-amber-500 text-amber-600">Self-Added</Badge>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{guest.email || "—"}</td>
              <td className="px-4 py-3 text-center hidden md:table-cell">
                {guest.emailSentAt ? (
                  <span className="text-[10px] px-1.5 py-px rounded bg-emerald/10 text-emerald">Sent</span>
                ) : guest.email ? (
                  <span className="text-[10px] text-muted-foreground/70">—</span>
                ) : "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground capitalize hidden sm:table-cell">{guest.side}</td>
              <td className="px-4 py-3 text-center hidden md:table-cell text-xs">
                {guest.tableNumber || guest.tableId ? (
                  <span className="inline-block px-1.5 py-0.5 rounded bg-champagne/10 text-champagne">{guest.tableNumber || "Assigned"}</span>
                ) : "—"}
              </td>
              <td className="px-4 py-3 text-right hidden md:table-cell text-xs tabular-nums">
                {guest.suggestedContribution ? `$${guest.suggestedContribution}` : "—"}
              </td>
              <td className="px-2 py-3 text-right hidden lg:table-cell">
                <input 
                  type="number" 
                  value={guest.actualGiftAmount || ""} 
                  placeholder="0"
                  className="w-16 text-xs border rounded px-1 py-0.5 bg-background"
                  onChange={(e) => onGiftUpdate && onGiftUpdate(guest.id, { actualGiftAmount: parseInt(e.target.value) || 0 })}
                />
              </td>
              <td className="px-4 py-3 text-center hidden lg:table-cell">
                <input 
                  type="checkbox" 
                  checked={!!guest.giftReceived} 
                  onChange={(e) => onGiftUpdate && onGiftUpdate(guest.id, { giftReceived: e.target.checked })}
                  className="accent-champagne"
                />
              </td>
              <td className="px-4 py-3 text-center hidden lg:table-cell">
                {guest.plusOnes != null && guest.plusOnes > 0 ? `+${guest.plusOnes}` : (guest.plusOne ? "Yes" : "—")}
              </td>
              <td className="px-4 py-3">
                <select 
                  value={guest.status} 
                  onChange={(e) => onStatusChange(guest.id, e.target.value as Guest["status"])}
                  className="bg-transparent border rounded px-2 py-1 text-xs capitalize cursor-pointer"
                >
                  <option value="pending">pending</option>
                  <option value="attending">attending</option>
                  <option value="declined">declined</option>
                  <option value="maybe">maybe</option>
                </select>
              </td>
              <td className="px-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(guest.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
