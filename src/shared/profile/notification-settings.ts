export type NotificationSettingsKey =
  | 'advertiserMessages'
  | 'publisherMessages'
  | 'paymentMessages'
  | 'systemMessages';

export type NotificationSettings = Record<NotificationSettingsKey, boolean>;

export type NotificationSettingsCatalogItem = {
  key: NotificationSettingsKey;
  title: string;
  description: string;
  templateIds: string[];
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  advertiserMessages: true,
  publisherMessages: true,
  paymentMessages: true,
  systemMessages: true,
};

export const DEFAULT_NOTIFICATION_SETTINGS_CATALOG: NotificationSettingsCatalogItem[] = [
  {
    key: 'advertiserMessages',
    title: 'Advertiser messages',
    description: 'Brief responses, deal acceptance, and advertiser-side creative updates.',
    templateIds: ['B01', 'B05', 'B07', 'B10', 'B11', 'B17'],
  },
  {
    key: 'publisherMessages',
    title: 'Publisher messages',
    description: 'Application outcomes, new deal requests, and publisher-side creative actions.',
    templateIds: ['B02', 'B03', 'B04', 'B12', 'B13'],
  },
  {
    key: 'paymentMessages',
    title: 'Payment messages',
    description: 'Escrow funding, payouts, refunds, and completed deal payment outcomes.',
    templateIds: ['B09', 'B14', 'B15', 'B16'],
  },
  {
    key: 'systemMessages',
    title: 'System messages',
    description: 'Status changes, cancellations, violations, and timeout-related alerts.',
    templateIds: ['B06', 'B08', 'B18', 'B19', 'B20', 'B21', 'B22'],
  },
];

const NOTIFICATION_SETTINGS_KEYS: NotificationSettingsKey[] = [
  'advertiserMessages',
  'publisherMessages',
  'paymentMessages',
  'systemMessages',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNotificationSettingsKey(value: string): value is NotificationSettingsKey {
  return NOTIFICATION_SETTINGS_KEYS.includes(value as NotificationSettingsKey);
}

export function parseNotificationSettings(
  value: unknown,
  fallback: NotificationSettings = DEFAULT_NOTIFICATION_SETTINGS,
): NotificationSettings {
  if (!isRecord(value)) {
    return { ...fallback };
  }

  return {
    advertiserMessages:
      typeof value.advertiserMessages === 'boolean' ? value.advertiserMessages : fallback.advertiserMessages,
    publisherMessages:
      typeof value.publisherMessages === 'boolean' ? value.publisherMessages : fallback.publisherMessages,
    paymentMessages:
      typeof value.paymentMessages === 'boolean' ? value.paymentMessages : fallback.paymentMessages,
    systemMessages:
      typeof value.systemMessages === 'boolean' ? value.systemMessages : fallback.systemMessages,
  };
}

export function parseNotificationSettingsCatalog(value: unknown): NotificationSettingsCatalogItem[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_NOTIFICATION_SETTINGS_CATALOG];
  }

  const parsed = value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => {
      const key = typeof item.key === 'string' ? item.key : '';
      if (!isNotificationSettingsKey(key)) {
        return null;
      }

      const title = typeof item.title === 'string' && item.title.trim().length > 0
        ? item.title
        : DEFAULT_NOTIFICATION_SETTINGS_CATALOG.find((entry) => entry.key === key)?.title || key;
      const description = typeof item.description === 'string' ? item.description : '';
      const templateIds = Array.isArray(item.templateIds)
        ? item.templateIds.filter((templateId): templateId is string => typeof templateId === 'string')
        : [];

      return {
        key,
        title,
        description,
        templateIds,
      } satisfies NotificationSettingsCatalogItem;
    })
    .filter((item): item is NotificationSettingsCatalogItem => item !== null);

  if (parsed.length === 0) {
    return [...DEFAULT_NOTIFICATION_SETTINGS_CATALOG];
  }

  return parsed;
}

export function parseUsersNotificationSettingsPayload(payload: unknown): {
  settings: NotificationSettings;
  catalog: NotificationSettingsCatalogItem[];
} {
  if (!isRecord(payload)) {
    return {
      settings: { ...DEFAULT_NOTIFICATION_SETTINGS },
      catalog: [...DEFAULT_NOTIFICATION_SETTINGS_CATALOG],
    };
  }

  const user = isRecord(payload.user) ? payload.user : {};

  return {
    settings: parseNotificationSettings(user.notificationSettings, DEFAULT_NOTIFICATION_SETTINGS),
    catalog: parseNotificationSettingsCatalog(payload.notificationSettingsCatalog),
  };
}

