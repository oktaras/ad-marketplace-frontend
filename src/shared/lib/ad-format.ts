export type UiAdFormatKind = "post" | "story" | "repost" | "pinned" | "other";

const AD_FORMAT_META: Record<UiAdFormatKind, { emoji: string; label: string }> = {
  post: { emoji: "📝", label: "Post" },
  story: { emoji: "📱", label: "Story" },
  repost: { emoji: "🔄", label: "Forward" },
  pinned: { emoji: "📌", label: "Pinned Post" },
  other: { emoji: "✨", label: "Other" },
};

const AD_FORMAT_FALLBACK = { emoji: "🎯", label: "Format" };

function normalizeAdFormatKind(value: string | null | undefined): UiAdFormatKind | null {
  const normalized = (value || "").trim().toLowerCase().replace(/\s+/g, "_");

  if (!normalized) {
    return null;
  }

  if (normalized === "post") {
    return "post";
  }

  if (normalized === "story") {
    return "story";
  }

  if (normalized === "repost" || normalized === "forward") {
    return "repost";
  }

  if (normalized === "pinned" || normalized === "pinned_post") {
    return "pinned";
  }

  if (normalized === "other") {
    return "other";
  }

  return null;
}

export function isAdFormatActive(value: string | null | undefined): boolean {
  return normalizeAdFormatKind(value) === "post";
}

export function getAdFormatEmoji(value: string | null | undefined): string {
  const key = normalizeAdFormatKind(value);
  return key ? AD_FORMAT_META[key].emoji : AD_FORMAT_FALLBACK.emoji;
}

export function getAdFormatText(value: string | null | undefined): string {
  const key = normalizeAdFormatKind(value);
  return key ? AD_FORMAT_META[key].label : (value || AD_FORMAT_FALLBACK.label);
}

export function getAdFormatDisplay(value: string | null | undefined): string {
  const key = normalizeAdFormatKind(value);
  const resolved = key ? AD_FORMAT_META[key] : AD_FORMAT_FALLBACK;
  return `${resolved.emoji} ${key ? resolved.label : (value || resolved.label)}`;
}

export function formatAdFormatTitle(type: string | null | undefined, customName?: string | null): string {
  const emoji = getAdFormatEmoji(type);
  const normalizedCustomName = customName?.trim();
  const label = normalizedCustomName || getAdFormatText(type);
  return `${emoji} ${label}`;
}
