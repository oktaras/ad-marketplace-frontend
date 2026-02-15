import { SUPPORTED_CURRENCIES } from '@/types/currency';

export type AdFormatType = 'POST' | 'STORY' | 'REPOST' | 'PINNED' | 'OTHER';

export type AdFormatOption = {
  value: AdFormatType;
  label: string;
};

export const AD_FORMAT_OPTIONS: AdFormatOption[] = [
  { value: 'POST', label: 'Post' },
  { value: 'STORY', label: 'Story' },
  { value: 'REPOST', label: 'Repost' },
  { value: 'PINNED', label: 'Pinned post' },
  { value: 'OTHER', label: 'Other' },
];

export const AD_FORMAT_DURATION_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 24, label: '1 day' },
  { value: 168, label: '1 week' },
  { value: 720, label: '1 month' },
  { value: 0, label: 'Permanent' },
];

export const AD_FORMAT_CURRENCY_OPTIONS: Array<{ value: string; label: string; disabled?: boolean }> = [
  ...SUPPORTED_CURRENCIES.map((currency) => ({
    value: currency.value,
    label: currency.label,
  })),
];

export function getAdFormatLabel(type: string | null | undefined): string {
  const matched = AD_FORMAT_OPTIONS.find((option) => option.value === type);
  return matched?.label ?? type ?? 'Format';
}

export function formatDurationLabel(durationHours: number | null | undefined): string {
  if (durationHours === null || durationHours === undefined) {
    return 'Duration not set';
  }

  if (durationHours === 0) {
    return 'Permanent';
  }

  if (durationHours % 24 === 0) {
    const days = durationHours / 24;
    return days === 1 ? '1 day' : `${days} days`;
  }

  return `${durationHours}h`;
}
