import { describe, expect, it } from 'vitest';
import { normalizeRoles } from '@/features/auth/model/roles';

describe('normalizeRoles', () => {
  it('keeps advertiser as active role when only advertiser is set', () => {
    const result = normalizeRoles({ isAdvertiser: true, isChannelOwner: false });

    expect(result.activeRole).toBe('advertiser');
    expect(result.roles).toEqual({ isAdvertiser: true, isChannelOwner: false });
  });

  it('keeps publisher as active role when only publisher is set', () => {
    const result = normalizeRoles({ isAdvertiser: false, isChannelOwner: true });

    expect(result.activeRole).toBe('publisher');
    expect(result.roles).toEqual({ isAdvertiser: false, isChannelOwner: true });
  });

  it('resolves dual-role payload to preferred publisher role', () => {
    const result = normalizeRoles({ isAdvertiser: true, isChannelOwner: true }, 'publisher');

    expect(result.activeRole).toBe('publisher');
    expect(result.roles).toEqual({ isAdvertiser: false, isChannelOwner: true });
  });

  it('falls back to advertiser when dual-role payload has no preference', () => {
    const result = normalizeRoles({ isAdvertiser: true, isChannelOwner: true }, null);

    expect(result.activeRole).toBe('advertiser');
    expect(result.roles).toEqual({ isAdvertiser: true, isChannelOwner: false });
  });

  it('returns no active role when neither flag is set', () => {
    const result = normalizeRoles({ isAdvertiser: false, isChannelOwner: false });

    expect(result.activeRole).toBeNull();
    expect(result.roles).toEqual({ isAdvertiser: false, isChannelOwner: false });
  });
});
