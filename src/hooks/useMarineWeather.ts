import { useState, useEffect, useCallback } from "react";

export interface MarineConditions {
  temperature: number;
  windSpeed: number;
  windDirection: string;
  skyCondition: string;
  humidity: number;
  visibility: number;
  pressure: number;
}

export interface MarineWarning {
  type: "small_craft_advisory" | "storm_warning" | "gale_warning" | "hurricane_warning";
  message: string;
  severity: "moderate" | "severe" | "extreme";
}

export interface TidePoint {
  time: string;
  height: number;
  type: "high" | "low";
}

export interface TideData {
  currentHeight: number;
  nextHigh: TidePoint | null;
  nextLow: TidePoint | null;
  tidePoints: TidePoint[];
}

export interface MarineWeatherData {
  conditions: MarineConditions;
  warnings: MarineWarning[];
  tides: TideData;
  lastUpdated: Date;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
}

// Generate realistic mock tide data based on current time
function generateMockTideData(): TideData {
  const now = new Date();
  const tidePoints: TidePoint[] = [];
  
  // Tides cycle roughly every 6 hours 12.5 minutes
  const tideCycleMs = 6 * 60 * 60 * 1000 + 12.5 * 60 * 1000;
  
  // Find the nearest low tide (baseline)
  const baseTime = new Date(now);
  baseTime.setHours(5, 30, 0, 0); // Assume 5:30 AM low tide as baseline
  
  // Generate tide points for the next 24 hours
  for (let i = -2; i < 6; i++) {
    const isHigh = i % 2 !== 0;
    const time = new Date(baseTime.getTime() + i * tideCycleMs);
    
    tidePoints.push({
      time: time.toISOString(),
      height: isHigh ? 4.2 + Math.random() * 0.8 : 0.8 + Math.random() * 0.4,
      type: isHigh ? "high" : "low",
    });
  }
  
  // Find current height by interpolating between tide points
  const sortedPoints = [...tidePoints].sort((a, b) => 
    new Date(a.time).getTime() - new Date(b.time).getTime()
  );
  
  let currentHeight = 2.5;
  let previousPoint = sortedPoints[0];
  let nextPoint = sortedPoints[1];
  
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const pTime = new Date(sortedPoints[i].time).getTime();
    const nTime = new Date(sortedPoints[i + 1].time).getTime();
    
    if (now.getTime() >= pTime && now.getTime() < nTime) {
      previousPoint = sortedPoints[i];
      nextPoint = sortedPoints[i + 1];
      break;
    }
  }
  
  // Sinusoidal interpolation
  const pTime = new Date(previousPoint.time).getTime();
  const nTime = new Date(nextPoint.time).getTime();
  const progress = (now.getTime() - pTime) / (nTime - pTime);
  const sinProgress = (1 - Math.cos(progress * Math.PI)) / 2;
  currentHeight = previousPoint.height + (nextPoint.height - previousPoint.height) * sinProgress;
  
  // Find next high and low
  const futurePoints = sortedPoints.filter(p => new Date(p.time) > now);
  const nextHigh = futurePoints.find(p => p.type === "high") || null;
  const nextLow = futurePoints.find(p => p.type === "low") || null;
  
  return {
    currentHeight: Math.round(currentHeight * 10) / 10,
    nextHigh,
    nextLow,
    tidePoints: sortedPoints.filter(p => {
      const t = new Date(p.time);
      return t > new Date(now.getTime() - 6 * 60 * 60 * 1000) && 
             t < new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }),
  };
}

// Generate mock weather conditions
function generateMockConditions(): MarineConditions {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const conditions = ["Clear", "Partly Cloudy", "Cloudy", "Sunny"];
  
  return {
    temperature: 72 + Math.floor(Math.random() * 15),
    windSpeed: 8 + Math.floor(Math.random() * 12),
    windDirection: directions[Math.floor(Math.random() * directions.length)],
    skyCondition: conditions[Math.floor(Math.random() * conditions.length)],
    humidity: 55 + Math.floor(Math.random() * 30),
    visibility: 8 + Math.floor(Math.random() * 4),
    pressure: 1010 + Math.floor(Math.random() * 20),
  };
}

// Check for warnings based on conditions
function generateWarnings(conditions: MarineConditions): MarineWarning[] {
  const warnings: MarineWarning[] = [];
  
  // Small Craft Advisory if winds > 20 knots
  if (conditions.windSpeed > 20) {
    warnings.push({
      type: "small_craft_advisory",
      message: `Small Craft Advisory: Winds ${conditions.windSpeed} kts from the ${conditions.windDirection}`,
      severity: conditions.windSpeed > 30 ? "severe" : "moderate",
    });
  }
  
  return warnings;
}

export function useMarineWeather(
  latitude: number | null,
  longitude: number | null,
  locationName?: string
) {
  const [data, setData] = useState<MarineWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!latitude || !longitude) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with real API call when keys are available
      // For now, use realistic mock data
      const conditions = generateMockConditions();
      const warnings = generateWarnings(conditions);
      const tides = generateMockTideData();

      setData({
        conditions,
        warnings,
        tides,
        lastUpdated: new Date(),
        location: {
          latitude,
          longitude,
          name: locationName || "Current Location",
        },
      });
    } catch (err) {
      console.error("Failed to fetch marine weather:", err);
      setError("Failed to load weather data");
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, locationName]);

  useEffect(() => {
    fetchWeather();
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return {
    data,
    loading,
    error,
    refetch: fetchWeather,
  };
}

// Calculate bridge clearance based on tide and boat height
export function calculateBridgeClearance(
  bridgeHeight: number, // Bridge clearance at mean low water
  boatHeight: number, // Boat's air draft (height above waterline)
  currentTideHeight: number,
  meanLowWater: number = 0 // Reference datum
): {
  currentClearance: number;
  clearanceAtHighTide: number;
  isSafe: boolean;
  warning: string | null;
} {
  // Fort Lauderdale typical tidal range: ~2.5-3 ft
  const typicalHighTide = 4.5; // Mean high water
  
  // Calculate clearances
  const currentClearance = bridgeHeight - boatHeight - (currentTideHeight - meanLowWater);
  const clearanceAtHighTide = bridgeHeight - boatHeight - (typicalHighTide - meanLowWater);
  
  const isSafe = clearanceAtHighTide > 1; // Need at least 1 ft buffer
  
  let warning: string | null = null;
  if (clearanceAtHighTide <= 0) {
    warning = "Cannot pass at high tide";
  } else if (clearanceAtHighTide < 2) {
    warning = "Tight clearance at high tide";
  }
  
  return {
    currentClearance: Math.round(currentClearance * 10) / 10,
    clearanceAtHighTide: Math.round(clearanceAtHighTide * 10) / 10,
    isSafe,
    warning,
  };
}
