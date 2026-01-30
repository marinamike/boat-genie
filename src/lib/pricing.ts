// Boat Genie Pricing Engine
// Handles all pricing calculations for services

import type { Database } from "@/integrations/supabase/types";

type MembershipTier = Database["public"]["Enums"]["membership_tier"];
type ServiceType = "genie_service" | "pro_service";

interface ServiceRate {
  id: string;
  service_name: string;
  service_type: ServiceType;
  rate_per_foot: number | null;
  diagnostic_fee: number | null;
  description: string | null;
}

interface PricingInput {
  serviceRate: ServiceRate;
  boatLengthFt: number;
  membershipTier: MembershipTier;
  isEmergency: boolean;
}

interface PricingBreakdown {
  basePrice: number;
  serviceFee: number;
  emergencyFee: number;
  totalOwnerPrice: number;
  leadFee: number;
  totalProviderReceives: number;
}

// Fee constants
const SERVICE_FEE_RATE = 0.05; // 5% for standard users
const LEAD_FEE_RATE = 0.05; // 5% for all providers
const EMERGENCY_FEE_STANDARD = 50;
const EMERGENCY_FEE_MEMBER = 50;

/**
 * Calculate the base price for a service
 * - Genie Services: boat_length * rate_per_foot
 * - Pro Services: diagnostic_fee
 */
export function calculateBasePrice(
  serviceRate: ServiceRate,
  boatLengthFt: number
): number {
  if (serviceRate.service_type === "genie_service" && serviceRate.rate_per_foot) {
    return boatLengthFt * serviceRate.rate_per_foot;
  } else if (serviceRate.service_type === "pro_service" && serviceRate.diagnostic_fee) {
    return serviceRate.diagnostic_fee;
  }
  return 0;
}

/**
 * Calculate service fee based on membership tier
 * - Standard users: 5% service fee
 * - Genie Members: 0% service fee
 */
export function calculateServiceFee(
  basePrice: number,
  membershipTier: MembershipTier
): number {
  if (membershipTier === "genie") {
    return 0;
  }
  return basePrice * SERVICE_FEE_RATE;
}

/**
 * Calculate emergency fee based on membership tier
 * - Standard users: $150 extra
 * - Genie Members: $50 extra
 */
export function calculateEmergencyFee(
  isEmergency: boolean,
  membershipTier: MembershipTier
): number {
  if (!isEmergency) {
    return 0;
  }
  return membershipTier === "genie" ? EMERGENCY_FEE_MEMBER : EMERGENCY_FEE_STANDARD;
}

/**
 * Calculate lead fee charged to providers (5%)
 */
export function calculateLeadFee(basePrice: number): number {
  return basePrice * LEAD_FEE_RATE;
}

/**
 * Calculate complete pricing breakdown
 */
export function calculatePricing(input: PricingInput): PricingBreakdown {
  const { serviceRate, boatLengthFt, membershipTier, isEmergency } = input;

  // Calculate base price
  const basePrice = calculateBasePrice(serviceRate, boatLengthFt);

  // Calculate fees
  const serviceFee = calculateServiceFee(basePrice, membershipTier);
  const emergencyFee = calculateEmergencyFee(isEmergency, membershipTier);
  const leadFee = calculateLeadFee(basePrice);

  // Total for boat owner
  const totalOwnerPrice = basePrice + serviceFee + emergencyFee;

  // Total provider receives (base price minus lead fee, plus 100% of emergency fee)
  const totalProviderReceives = basePrice - leadFee + emergencyFee;

  return {
    basePrice,
    serviceFee,
    emergencyFee,
    totalOwnerPrice,
    leadFee,
    totalProviderReceives,
  };
}

/**
 * Format price as USD currency
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get pricing display for a service based on membership
 */
export function getDisplayPrice(
  retailPrice: number | null,
  wholesalePrice: number | null,
  membershipTier: MembershipTier
): { displayPrice: number | null; label: string } {
  if (membershipTier === "genie" && wholesalePrice !== null) {
    return { displayPrice: wholesalePrice, label: "Wholesale" };
  }
  return { displayPrice: retailPrice, label: "Retail" };
}

/**
 * Calculate savings for Genie members
 */
export function calculateMemberSavings(
  basePrice: number,
  isEmergency: boolean
): number {
  // Standard user pays: 5% service fee
  const standardServiceFee = basePrice * SERVICE_FEE_RATE;
  // Member pays: 0% service fee
  const memberServiceFee = 0;

  // Emergency savings
  const emergencySavings = isEmergency ? EMERGENCY_FEE_STANDARD - EMERGENCY_FEE_MEMBER : 0;

  return standardServiceFee - memberServiceFee + emergencySavings;
}

export const PRICING_CONSTANTS = {
  SERVICE_FEE_RATE,
  LEAD_FEE_RATE,
  EMERGENCY_FEE_STANDARD,
  EMERGENCY_FEE_MEMBER,
};
