import type { LucideIcon } from "lucide-react";
import { Gamepad2, Laptop, Smartphone, Tablet } from "lucide-react";

export function deviceIconForType(deviceType: string): LucideIcon {
  const t = deviceType.toLowerCase();
  if (t.includes("laptop") || t.includes("macbook") || t.includes("pc")) return Laptop;
  if (t.includes("tablet") || t.includes("ipad")) return Tablet;
  if (t.includes("console") || t.includes("ps") || t.includes("xbox")) return Gamepad2;
  return Smartphone;
}

export function deviceDisplayName(ticket: {
  deviceBrand?: string | null;
  deviceModel?: string | null;
  deviceType: string;
}): string {
  return [ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" ") || ticket.deviceType;
}
