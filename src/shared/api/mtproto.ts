import { OpenAPI } from '@/shared/api/generated/core/OpenAPI';
import { request } from '@/shared/api/generated/core/request';

export type MtprotoStatus = {
  enabled: boolean;
  botTokenConfigured: boolean;
  status: 'NOT_CONNECTED' | 'AUTHORIZED' | 'FAILED' | 'DISCONNECTED';
  isAuthorized: boolean;
  authMode: 'USER' | null;
  detailedStatsStatus: 'AVAILABLE' | 'NOT_AVAILABLE' | 'UNKNOWN';
  detailedStatsReason: string | null;
  detailedStatsCheckedAt: string | null;
  lastAuthorizedAt: string | null;
  lastError: string | null;
  updatedAt: string | null;
};

export function getChannelMtprotoStatus(channelId: string): Promise<{ mtproto: MtprotoStatus }> {
  return request(OpenAPI, {
    method: 'GET',
    url: '/api/channels/{id}/mtproto/status',
    path: { id: channelId },
    errors: {
      403: 'Not channel owner',
      404: 'Channel not found',
    },
  });
}
