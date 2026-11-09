import type { BillingPeriod } from "@/lib/models";

export const membershipPricing = {
  currency: "AED",
  monthly: 30,
  yearly: 360,
} as const;

export function priceFor(period: BillingPeriod): number {
  return membershipPricing[period];
}
