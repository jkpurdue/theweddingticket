"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { weddingService } from "@/lib/data-service";
import type { Wedding, Guest } from "@/types";
import { toast } from "sonner";
import { Send, Eye } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  wedding: Wedding;
  guests: Guest[];
  onSent?: () => void;
}

export function EmailPreviewModal({ open, onOpenChange, wedding, guests, onSent }: Props) {
  const [sending, setSending] = useState(false);
  const [selected, setSelected] = useState<string[]>(guests.filter(g => g.email).map(g => g.id));

  const accent = wedding.customization?.accentColor || "#D4AF37";
  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/invite/${wedding.slug}` : '';

  const previewGuests = guests.filter(g => selected.includes(g.id));

  async function handleSend() {
    if (selected.length === 0) {
      toast.error("Select at least one guest with email");
      return;
    }
    setSending(true);
    try {
      const count = await weddingService.sendEmailInvitations(wedding.id, selected);
      toast.success(`Sent beautiful invitations to ${count} guests`, { description: "Opens are being tracked in demo mode." });
      onSent?.();
      onOpenChange(false);
    } catch (e) {
      toast.error("Send failed (demo)");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" /> Send Digital Invitations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Preview below matches your invitation design. In real mode this would send via beautiful HTML email (Resend etc).
          </div>

          {/* Recipient picker */}
          <div>
            <div className="text-xs uppercase tracking-widest mb-2 text-muted-foreground">Recipients with email ({selected.length})</div>
            <div className="max-h-28 overflow-auto border rounded p-2 text-sm grid grid-cols-2 gap-1">
              {guests.filter(g => g.email).map(g => (
                <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selected.includes(g.id)} 
                    onChange={e => {
                      if (e.target.checked) setSelected([...selected, g.id]);
                      else setSelected(selected.filter(id => id !== g.id));
                    }} 
                  />
                  {g.fullName} <span className="text-muted-foreground text-xs">({g.email})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Beautiful Email Preview */}
          <div className="border rounded-xl overflow-hidden bg-white text-black">
            <div className="p-4 border-b text-xs text-gray-500">Subject: You are cordially invited — {wedding.partner1Name} &amp; {wedding.partner2Name}</div>
            <div className="p-8" style={{ fontFamily: 'Georgia, serif' }}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <img 
                  src="/the-wedding-ticket-logo.png" 
                  alt="The Wedding Ticket" 
                  style={{height:20, objectFit:'contain'}} 
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <span style={{ color: accent }} className="text-sm tracking-[3px]">THE WEDDING TICKET</span>
              </div>
              <div style={{ color: accent }} className="text-sm tracking-[3px] mb-2">YOU ARE INVITED</div>
              <div style={{ color: accent, fontSize: 28, lineHeight: 1 }} className="font-serif mb-4">
                {wedding.partner1Name} &amp; {wedding.partner2Name}
              </div>
              <div className="text-sm mb-4">{wedding.welcomeMessage}</div>
              <div className="text-sm">
                {new Date(wedding.weddingDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {wedding.ceremonyTime}<br />
                {wedding.venueName}, {wedding.venueCity}
              </div>
              {wedding.budget?.suggestedPerGuestGift && (
                <div className="mt-2 text-xs text-gray-500">Suggested contribution: ${wedding.budget.suggestedPerGuestGift} per guest (optional)</div>
              )}
              <div className="my-6 text-xs border-t pt-4" style={{ color: accent }}>
                VIEW YOUR INVITATION &amp; RSVP<br />
                <a href={inviteUrl} style={{ color: accent }} className="underline">{inviteUrl}</a>
              </div>
              <div className="text-[10px] text-gray-400">Sent with love via TheWeddingTicket</div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button variant="elegant" onClick={handleSend} disabled={sending || selected.length === 0}>
              {sending ? "Sending..." : `Send to ${selected.length} guest${selected.length === 1 ? '' : 's'}`}
            </Button>
          </div>
          <div className="text-[10px] text-muted-foreground">Opens tracked in demo (random). Real sends would use transactional email with open pixels.</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
