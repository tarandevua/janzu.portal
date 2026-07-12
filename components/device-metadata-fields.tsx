"use client";

import { useEffect, useState } from "react";

type NavigatorWithUserAgentData = Navigator & { userAgentData?: unknown };

type DeviceMetadataFieldsProps = {
  deviceIdName?: string;
  deviceMetadataName?: string;
};

function getFallbackDeviceId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function DeviceMetadataFields({
  deviceIdName = "deviceId",
  deviceMetadataName = "deviceMetadata",
}: DeviceMetadataFieldsProps) {
  const [deviceId, setDeviceId] = useState("");
  const [deviceMetadata, setDeviceMetadata] = useState("{}");

  useEffect(() => {
    const storageKey = "janzu.deviceId";
    const nav = navigator as NavigatorWithUserAgentData;
    let existingDeviceId: string | null = null;

    try {
      existingDeviceId = window.localStorage.getItem(storageKey);
    } catch {
      existingDeviceId = null;
    }

    const nextDeviceId =
      existingDeviceId || window.crypto?.randomUUID?.() || getFallbackDeviceId();

    if (!existingDeviceId) {
      try {
        window.localStorage.setItem(storageKey, nextDeviceId);
      } catch {
        // Some browsers block localStorage; the generated id is still submitted.
      }
    }

    setDeviceId(nextDeviceId);
    setDeviceMetadata(JSON.stringify({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      userAgentData: nav.userAgentData ?? null,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelDepth: window.screen.pixelDepth,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
    }));
  }, []);

  return (
    <>
      <input type="hidden" name={deviceIdName} value={deviceId} readOnly />
      <input type="hidden" name={deviceMetadataName} value={deviceMetadata} readOnly />
    </>
  );
}
