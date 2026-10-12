"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DemoStateStore } from "./persistence";

// The adapter defers window/localStorage access until the store hydrates in an effect.
const browserStorage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
  removeItem: (key: string) => window.localStorage.removeItem(key),
};

export const demoStateStore = new DemoStateStore(browserStorage);
let hydrated = false;

export function useDemoState() {
  const state = useSyncExternalStore(
    demoStateStore.subscribe,
    demoStateStore.getSnapshot,
    demoStateStore.getSnapshot,
  );

  useEffect(() => {
    if (!hydrated) {
      demoStateStore.hydrate();
      hydrated = true;
    }
  }, []);

  return state;
}

export function useDemoProfile() {
  const [profileId, setProfileId] = useState("admin");

  useEffect(() => {
    const saved = window.localStorage.getItem("santamaria-admin-profile:v1");
    if (saved) setProfileId(saved);
  }, []);

  function updateProfile(next: string) {
    window.localStorage.setItem("santamaria-admin-profile:v1", next);
    setProfileId(next);
  }

  return [profileId, updateProfile] as const;
}
