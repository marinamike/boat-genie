import { differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";

export interface StayRates {
  daily_rate_per_ft: number;
  weekly_rate_per_ft: number;
  monthly_rate_per_ft: number;
  seasonal_rate_per_ft: number;
  annual_rate_per_ft: number;
}

export interface RateCalculation {
  tier: "daily" | "weekly" | "monthly" | "seasonal" | "annual";
  tierLabel: string;
  ratePerDayPerFt: number;
  totalDays: number;
  vesselLengthFt: number;
  staySubtotal: number;
}

export interface UtilityCalculation {
  meterType: "power" | "water";
  startReading: number;
  endReading: number;
  usage: number;
  ratePerUnit: number;
  total: number;
}

export interface BillingBreakdown {
  stayCalculation: RateCalculation;
  utilities: UtilityCalculation[];
  grandTotal: number;
}

/**
 * Calculate the duration of a stay in days (minimum 1 day)
 */
export function calculateStayDuration(checkInAt: Date, checkOutAt: Date): number {
  const days = differenceInDays(checkOutAt, checkInAt);
  // Minimum 1 day charge
  return Math.max(1, days);
}

/**
 * Format duration for display (e.g., "2 days, 5 hours")
 */
export function formatStayDuration(checkInAt: Date, checkOutAt: Date): string {
  const days = differenceInDays(checkOutAt, checkInAt);
  const hours = differenceInHours(checkOutAt, checkInAt) % 24;
  const minutes = differenceInMinutes(checkOutAt, checkInAt) % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (parts.length === 0 && minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  
  return parts.length > 0 ? parts.join(", ") : "Less than 1 minute";
}

/**
 * Calculate the best rate tier based on stay duration
 * 
 * Cascading logic:
 * - 30+ days: Monthly rate (divided by 30 for daily equivalent)
 * - 7-29 days: Weekly rate (divided by 7 for daily equivalent)
 * - 1-6 days: Daily rate
 */
export function calculateBestRate(
  durationDays: number,
  vesselLengthFt: number,
  rates: StayRates
): RateCalculation {
  let tier: RateCalculation["tier"];
  let tierLabel: string;
  let ratePerDayPerFt: number;

  if (durationDays >= 30) {
    // Monthly tier - best value for long stays
    tier = "monthly";
    tierLabel = "Monthly Rate";
    ratePerDayPerFt = rates.monthly_rate_per_ft / 30;
  } else if (durationDays >= 7) {
    // Weekly tier
    tier = "weekly";
    tierLabel = "Weekly Rate";
    ratePerDayPerFt = rates.weekly_rate_per_ft / 7;
  } else {
    // Daily tier
    tier = "daily";
    tierLabel = "Daily Rate";
    ratePerDayPerFt = rates.daily_rate_per_ft;
  }

  const staySubtotal = ratePerDayPerFt * durationDays * vesselLengthFt;

  return {
    tier,
    tierLabel,
    ratePerDayPerFt,
    totalDays: durationDays,
    vesselLengthFt,
    staySubtotal: Math.round(staySubtotal * 100) / 100, // Round to cents
  };
}

/**
 * Calculate utility charges based on meter readings
 */
export function calculateUtilityCharge(
  meterType: "power" | "water",
  startReading: number,
  endReading: number,
  ratePerUnit: number
): UtilityCalculation {
  const usage = Math.max(0, endReading - startReading);
  const total = usage * ratePerUnit;

  return {
    meterType,
    startReading,
    endReading,
    usage,
    ratePerUnit,
    total: Math.round(total * 100) / 100, // Round to cents
  };
}

/**
 * Generate complete billing breakdown for a stay
 */
export function generateBillingBreakdown(
  checkInAt: Date,
  checkOutAt: Date,
  vesselLengthFt: number,
  rates: StayRates,
  utilities: Array<{
    meterType: "power" | "water";
    startReading: number;
    endReading: number;
    ratePerUnit: number;
  }>
): BillingBreakdown {
  const durationDays = calculateStayDuration(checkInAt, checkOutAt);
  const stayCalculation = calculateBestRate(durationDays, vesselLengthFt, rates);

  const utilityCalculations = utilities.map((u) =>
    calculateUtilityCharge(u.meterType, u.startReading, u.endReading, u.ratePerUnit)
  );

  const utilityTotal = utilityCalculations.reduce((sum, u) => sum + u.total, 0);
  const grandTotal = stayCalculation.staySubtotal + utilityTotal;

  return {
    stayCalculation,
    utilities: utilityCalculations,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}

/**
 * Get unit label for meter type
 */
export function getMeterUnit(meterType: "power" | "water"): string {
  return meterType === "power" ? "kWh" : "gal";
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
