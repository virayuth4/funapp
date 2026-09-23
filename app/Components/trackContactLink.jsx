"use client";

import { trackEventClick } from "@/lib/trackEventClick";

// Reusable tracked link for contact actions (call / telegram / map).
// Wraps a plain <a> so it can be used identically across the hero,
// sticky sidebar, and mobile bar without repeating onClick logic.
export default function TrackedContactLink({
  action, // "map" | "call" | "telegram"
  entity, // { id, name, branch_location }
  isPartner = false,
  source = "establishment_page",
  href,
  target,
  rel,
  className,
  children,
}) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      onClick={() =>
        trackEventClick(entity, { action, isPartner, source })
      }
      className={className}
    >
      {children}
    </a>
  );
}