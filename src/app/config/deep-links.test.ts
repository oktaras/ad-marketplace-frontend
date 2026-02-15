import { describe, expect, it } from 'vitest';
import { parseDeepLink } from '@/app/config/deep-links';

describe('parseDeepLink', () => {
  it('parses static start params without dash-to-slash conversion', () => {
    expect(parseDeepLink('create-listing')).toBe('/create-listing');
    expect(parseDeepLink('my-channels')).toBe('/my-channels');
  });

  it('parses legacy token links with detail ids that include dashes', () => {
    expect(parseDeepLink('channels-channel-with-dashes')).toBe('/listings/channel-with-dashes');
    expect(parseDeepLink('deals-deal-with-dashes')).toBe('/deals/deal-with-dashes');
  });

  it('parses legacy suffix tokens for settings and applications', () => {
    expect(parseDeepLink('channels-channel-with-dashes-settings')).toBe('/listings/channel-with-dashes/settings');
    expect(parseDeepLink('briefs-brief-with-dashes-applications')).toBe('/briefs/brief-with-dashes/applications');
  });

  it('parses slash-format params directly', () => {
    expect(parseDeepLink('briefs/abc-123')).toBe('/briefs/abc-123');
    expect(parseDeepLink('/channels')).toBe('/listings');
    expect(parseDeepLink('/channels/abc-123/settings')).toBe('/listings/abc-123/settings');
  });

  it('rejects unsupported paths and malformed params', () => {
    expect(parseDeepLink('unknown-target')).toBeNull();
    expect(parseDeepLink('/admin')).toBeNull();
    expect(parseDeepLink('')).toBeNull();
    expect(parseDeepLink(null)).toBeNull();
    expect(parseDeepLink(undefined)).toBeNull();
  });
});
