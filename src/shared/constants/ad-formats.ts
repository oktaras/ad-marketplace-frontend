import { SUPPORTED_CURRENCIES } from '@/types/currency';
import { getAdFormatDisplay, isAdFormatActive } from '@/shared/lib/ad-format';

export type AdFormatType = 'POST' | 'STORY' | 'REPOST' | 'PINNED' | 'OTHER';

export type AdFormatOption = {
  value: AdFormatType;
  label: string;
  disabled?: boolean;
};

export const AD_FORMAT_OPTIONS: AdFormatOption[] = [
  { value: 'POST', label: getAdFormatDisplay('POST'), disabled: !isAdFormatActive('POST') },
  { value: 'STORY', label: getAdFormatDisplay('STORY'), disabled: !isAdFormatActive('STORY') },
  { value: 'REPOST', label: getAdFormatDisplay('REPOST'), disabled: !isAdFormatActive('REPOST') },
  { value: 'PINNED', label: getAdFormatDisplay('PINNED'), disabled: !isAdFormatActive('PINNED') },
  { value: 'OTHER', label: getAdFormatDisplay('OTHER'), disabled: !isAdFormatActive('OTHER') },
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
