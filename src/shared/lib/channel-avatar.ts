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

export function getTelegramChannelAvatarUrl(username: string | null | undefined): string | null {
  const normalized = normalizeTelegramUsername(username);
  if (!normalized) {
    return null;
  }

  return `https://t.me/i/userpic/320/${encodeURIComponent(normalized)}.jpg`;
}

export function isLikelyRemoteImageUrl(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  return /^https?:\/\//i.test(value.trim());
}
