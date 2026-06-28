"use client";

import { useState } from "react";
import type { TemperatureUnit } from "@/server/models/location.model";
import { Button } from "@/components/ui/button";

type LocationTemperatureDisplayProps = {
  value: number | null;
  unit: TemperatureUnit | null;
  dictionary: {
    temperature: string;
    celsius: string;
    fahrenheit: string;
  };
};

function toCelsius(value: number, unit: TemperatureUnit) {
  return unit === "celsius" ? value : (value - 32) * (5 / 9);
}

function toFahrenheit(value: number, unit: TemperatureUnit) {
  return unit === "fahrenheit" ? value : value * (9 / 5) + 32;
}

function formatTemperature(value: number, sourceUnit: TemperatureUnit, displayUnit: TemperatureUnit) {
  const converted = displayUnit === "celsius"
    ? toCelsius(value, sourceUnit)
    : toFahrenheit(value, sourceUnit);

  return `${converted.toFixed(1)}°${displayUnit === "celsius" ? "C" : "F"}`;
}

export function LocationTemperatureDisplay({
  value,
  unit,
  dictionary,
}: LocationTemperatureDisplayProps) {
  const [displayUnit, setDisplayUnit] = useState<TemperatureUnit>(unit ?? "celsius");

  if (value === null || unit === null) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2">
      <span className="text-sm font-medium">
        {dictionary.temperature}: {formatTemperature(value, unit, displayUnit)}
      </span>
      <div className="inline-flex rounded-md border bg-background p-0.5">
        <Button
          type="button"
          size="sm"
          variant={displayUnit === "celsius" ? "secondary" : "ghost"}
          className="h-7 px-2"
          onClick={() => setDisplayUnit("celsius")}
        >
          °C
        </Button>
        <Button
          type="button"
          size="sm"
          variant={displayUnit === "fahrenheit" ? "secondary" : "ghost"}
          className="h-7 px-2"
          onClick={() => setDisplayUnit("fahrenheit")}
        >
          °F
        </Button>
      </div>
    </div>
  );
}
