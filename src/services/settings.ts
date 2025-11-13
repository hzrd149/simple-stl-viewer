/**
 * Settings Service
 *
 * Manages application settings with localStorage persistence
 */

export interface AppSettings {
  corsProxy: string;
}

const STORAGE_KEY = "stl-viewer-settings";

const DEFAULT_SETTINGS: AppSettings = {
  corsProxy: "https://corsproxy.io/?url=<url>",
};

// In-memory cache of settings
let cachedSettings: AppSettings | null = null;

/**
 * Loads settings from localStorage
 */
function loadSettings(): AppSettings {
  if (cachedSettings !== null) {
    return cachedSettings;
  }

  let settings: AppSettings = { ...DEFAULT_SETTINGS };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }

  cachedSettings = settings;
  return settings;
}

/**
 * Saves settings to localStorage
 */
function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    cachedSettings = settings;

    // Dispatch custom event for settings changes
    window.dispatchEvent(
      new CustomEvent("settings-changed", { detail: settings }),
    );
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

/**
 * Gets current settings
 */
export function getSettings(): AppSettings {
  return loadSettings();
}

/**
 * Updates settings
 */
export function updateSettings(partial: Partial<AppSettings>): void {
  const current = loadSettings();
  const updated = { ...current, ...partial };
  saveSettings(updated);
}

/**
 * Resets settings to defaults
 */
export function resetSettings(): void {
  saveSettings({ ...DEFAULT_SETTINGS });
}

/**
 * Subscribes to settings changes
 * @returns Unsubscribe function
 */
export function subscribeToSettings(
  callback: (settings: AppSettings) => void,
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<AppSettings>;
    callback(customEvent.detail);
  };

  window.addEventListener("settings-changed", handler);

  return () => {
    window.removeEventListener("settings-changed", handler);
  };
}
