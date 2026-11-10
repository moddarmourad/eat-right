import React from "react";
import { Phone } from "lucide-react";

/**
 * Simple contact‑phone UI.
 * Shows an icon, a label, and a clickable phone number (`tel:`).
 * Styling uses the same Tailwind colour palette as the rest of the app.
 */
export default function ContactPhone() {
  const displayNumber = "+971 4 338 8763"; // display format
  const linkNumber = "+97143388763"; // numeric only for tel: URI

  return (
    <div className="flex items-center gap-4 p-4 bg-white shadow-sm rounded-xl border border-[#e3ebe3] max-w-sm">
      <div className="p-3 bg-[#23845b] text-white rounded-full">
        <Phone size={20} />
      </div>
      <div>
        <p className="text-xs text-[#8fa095] font-medium">Customer Support</p>
        <a
          href={`tel:${linkNumber}`}
          className="text-base font-bold text-[#192b23] hover:text-[#23845b] transition-colors"
        >
          {displayNumber}
        </a>
      </div>
    </div>
  );
}
