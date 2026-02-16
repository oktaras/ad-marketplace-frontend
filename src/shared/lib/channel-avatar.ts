export function normalizeTelegramUsername(username: string | null | undefined): string | null {
  if (!username) {
    return null;
  }

  const normalized = username.trim().replace(/^@+/, "");
  if (!normalized) {
    return null;
  }

  return /^[A-Za-z0-9_]{5,32}$/.test(normalized) ? normalized : null;
}

export function getTelegramChannelAvatarUrl(
  username: string | null | undefined,
  version?: string | null,
): string | null {
  const normalized = normalizeTelegramUsername(username);
  if (!normalized) {
    return null;
  }

  const baseUrl = `https://t.me/i/userpic/320/${encodeURIComponent(normalized)}.jpg`;
  if (!version) {
    return baseUrl;
  }

  return `${baseUrl}?v=${encodeURIComponent(version)}`;
}

export function isLikelyRemoteImageUrl(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  return /^https?:\/\//i.test(value.trim());
}
