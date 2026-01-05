import { AddressParts } from "../types/common";

export function formatAddress(
  { street, city, region, postalCode, country }: AddressParts,
  multiline = false
): string {
  const line1 = [street].filter(Boolean).join(", ");

  const line2 = [city, region, postalCode].filter(Boolean).join(", ");

  const parts = [line1, line2, country].filter(Boolean);

  return multiline ? parts.join("\n") : parts.join(", ");
}
