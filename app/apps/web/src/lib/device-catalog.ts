export const DEVICE_TYPE_OPTIONS = [
  "Smartphone",
  "Laptop",
  "Tablet",
  "TV",
  "Fridge",
  "Washing Machine",
  "Microwave",
  "Console",
  "Desktop PC",
  "Monitor",
  "Speaker",
  "Router",
  "Printer",
  "Other",
] as const;

export const DEVICE_BRAND_OPTIONS = [
  "Apple",
  "Samsung",
  "LG",
  "Sony",
  "HP",
  "Dell",
  "Lenovo",
  "Huawei",
  "Tecno",
  "Infinix",
  "Hisense",
  "Panasonic",
  "Whirlpool",
  "Other",
] as const;

export const DEVICE_MODEL_OPTIONS = [
  "iPhone 13 Pro",
  "iPhone 14",
  "iPhone 15",
  "MacBook Air M1",
  "MacBook Pro",
  "Galaxy S23",
  "Galaxy A54",
  "Galaxy Tab",
  "iPad Pro",
  "iPad Air",
  "HP EliteBook",
  "Dell XPS 13",
  "Lenovo ThinkPad",
  "PS5",
  "Xbox Series X",
  "Other",
] as const;

export const FAULT_SUGGESTIONS: Record<string, string[]> = {
  Smartphone: [
    "Screen replacement",
    "Battery replacement",
    "Charging port repair",
    "Speaker not working",
    "Water damage",
  ],
  Laptop: [
    "Won't power on",
    "Battery swelling",
    "Keyboard replacement",
    "Screen flickering",
    "Overheating",
  ],
  TV: ["No display", "No sound", "Power issue", "HDMI port repair", "Backlight failure"],
  Fridge: ["Not cooling", "Compressor issue", "Thermostat fault", "Strange noise", "Leaking"],
  Tablet: ["Cracked screen", "Touch not responding", "Battery issue", "Charging port"],
  default: [
    "Not powering on",
    "Intermittent fault",
    "Physical damage",
    "Performance issue",
    "Needs diagnostics",
  ],
};

export function faultsForDeviceType(deviceType: string): string[] {
  return FAULT_SUGGESTIONS[deviceType] ?? FAULT_SUGGESTIONS.default;
}
