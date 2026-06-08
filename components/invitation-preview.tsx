"use client";

import type { Wedding } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";

interface Props {
  wedding: Partial<Wedding>;
}

export function InvitationPreview({ wedding }: Props) {
  const accent = wedding.customization?.accentColor || "#D4AF37";
  const fontStyle = wedding.customization?.fontStyle || "serif";
  const template = wedding.template || "classic";
  const partner1 = wedding.partner1Name || "Partner One";
  const partner2 = wedding.partner2Name || "Partner Two";
  const coverUrl = wedding.customization?.showCoverPhoto ? wedding.customization?.coverPhotoUrl : undefined;

  const getFontClass = () => {
    if (fontStyle === "script") return "font-script text-[42px] md:text-[52px] leading-[0.9]";
    if (fontStyle === "sans") return "font-sans text-[38px] md:text-[44px] tracking-[-1.5px]";
    return "font-serif text-[44px] md:text-[54px] tracking-[-1.8px] leading-[0.92]";
  };

  const getTemplateDecor = () => {
    if (template === 'floral') return <div className="text-[10px] tracking-[3px] text-primary/50 my-1">❀ ❀ ❀</div>;
    if (template === 'minimal') return null;
    if (template === 'modern') return <div className="h-px w-8 mx-auto my-2 bg-current opacity-30" />;
    return <div className="ornament my-1" />; // classic
  };

  return (
    <div 
      className="invitation-preview rounded-2xl overflow-hidden text-center mx-auto max-w-[560px] border border-primary/10"
      style={{ 
        "--accent": accent 
      } as React.CSSProperties}
    >
      {coverUrl && (
        <div className="w-full bg-muted/20 flex items-center justify-center overflow-hidden" style={{ maxHeight: '220px' }}>
          <img 
            src={coverUrl} 
            alt="Wedding cover" 
            className="w-full h-auto max-h-[220px] object-contain" 
          />
        </div>
      )}
      <div className={coverUrl ? "p-8 md:p-10" : "p-10 md:p-14"}>
      <div 
        className="uppercase text-[10px] tracking-[4px] mb-4" 
        style={{ color: accent + "99" }}
      >
        {wedding.welcomeMessage ? "TOGETHER WITH THEIR FAMILIES" : "YOU ARE INVITED"}
      </div>

      <div 
        className={getFontClass()} 
        style={{ color: accent }}
      >
        {partner1} <span className="font-light">&amp;</span> {partner2}
      </div>

      {getTemplateDecor()}

      <div className="my-2 h-px w-12 mx-auto" style={{ backgroundColor: accent + "33" }} />

      <div className="text-lg tracking-[-0.2px] mb-1">{wedding.weddingDate ? formatDate(wedding.weddingDate) : "Saturday, the twentieth of September"}</div>
      <div className="text-muted-foreground mb-6">
        {wedding.ceremonyTime ? formatTime(wedding.ceremonyTime) : "Four thirty in the afternoon"}
        {wedding.receptionTime ? ` • Reception to follow at ${formatTime(wedding.receptionTime)}` : ""}
      </div>

      <div className="font-medium tracking-tight text-lg">{wedding.venueName || "The Conservatory"}</div>
      <div className="text-sm text-muted-foreground mt-0.5">
        {wedding.venueCity || "Napa Valley, California"}
      </div>

      {wedding.dressCode && (
        <div className="mt-7 pt-6 border-t text-xs tracking-[2px]" style={{ borderColor: accent + "22", color: accent + "99" }}>
          {wedding.dressCode.toUpperCase()}
        </div>
      )}

      {wedding.additionalInfo && (
        <div className="mt-6 text-xs text-muted-foreground max-w-[38ch] mx-auto leading-relaxed">
          {wedding.additionalInfo}
        </div>
      )}
      <div className="mt-5 pt-4 border-t border-primary/10 flex items-center justify-center gap-2 text-[9px] tracking-[2px] text-primary/40">
        <img 
          src="/the-wedding-ticket-logo.png" 
          alt="The Wedding Ticket" 
          className="h-4 object-contain opacity-50" 
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        /> 
        THE WEDDING TICKET
      </div>
      </div>
    </div>
  );
}
