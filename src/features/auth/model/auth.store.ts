import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UsersService } from '@/shared/api/generated';
import { http } from '@/shared/api/http';
import { normalizeRoles, type ActiveRole, type RoleFlags } from '@/features/auth/model/roles';
import {
  getApiErrorMessage,
  isInvalidTelegramInitDataError,
  TELEGRAM_INIT_DATA_RESTART_MESSAGE,
} from '@/shared/api/error';

export type { ActiveRole, RoleFlags };

export type AuthUser = RoleFlags & {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  languageCode: string | null;
  walletAddress: string | null;
  onboardingCompleted: boolean;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  roles: RoleFlags;
  activeRole: ActiveRole;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  isBootstrapping: boolean;
  initDataInvalid: boolean;
  error: string | null;
  setBootstrapping: (value: boolean) => void;
  clearError: () => void;
  setRoles: (roles: RoleFlags) => void;
  authenticate: (initData: string) => Promise<void>;
  completeOnboarding: (roles: RoleFlags) => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
  markInitDataInvalid: () => void;
  logout: () => void;
};

const DEFAULT_ROLES: RoleFlags = {
  isAdvertiser: false,
  isChannelOwner: false,
};

function normalizeUser(raw: unknown, preferredRole: ActiveRole = null): AuthUser | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const user = raw as Record<string, unknown>;
  const id = typeof user.id === 'string' ? user.id : null;

  if (!id) {
    return null;
  }

  const normalizedRoles = normalizeRoles({
    isAdvertiser: Boolean(user.isAdvertiser),
    isChannelOwner: Boolean(user.isChannelOwner),
  }, preferredRole);

  return {
    id,
    telegramId: typeof user.telegramId === 'string' ? user.telegramId : '',
    username: typeof user.username === 'string' ? user.username : null,
    firstName: typeof user.firstName === 'string' ? user.firstName : null,
    lastName: typeof user.lastName === 'string' ? user.lastName : null,
    photoUrl: typeof user.photoUrl === 'string' ? user.photoUrl : null,
    languageCode: typeof user.languageCode === 'string' ? user.languageCode : null,
    walletAddress: typeof user.walletAddress === 'string' ? user.walletAddress : null,
    isAdvertiser: normalizedRoles.roles.isAdvertiser,
    isChannelOwner: normalizedRoles.roles.isChannelOwner,
    onboardingCompleted: Boolean(user.onboardingCompleted),
  };
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  return getApiErrorMessage(error, fallback);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      roles: DEFAULT_ROLES,
      activeRole: null,
      isAuthenticated: false,
      onboardingCompleted: false,
      isBootstrapping: true,
      initDataInvalid: false,
      error: null,

      setBootstrapping: (value) => set({ isBootstrapping: value }),

      clearError: () => set({ error: null }),

      setRoles: (roles) =>
        set((state) => {
          const normalized = normalizeRoles(roles, state.activeRole);

          return {
            roles: normalized.roles,
            activeRole: normalized.activeRole,
            user: state.user
              ? {
                  ...state.user,
                  isAdvertiser: normalized.roles.isAdvertiser,
                  isChannelOwner: normalized.roles.isChannelOwner,
                }
              : state.user,
          };
        }),

      authenticate: async (initData: string) => {
        if (!initData.trim()) {
          set({
            token: null,
            user: null,
            roles: DEFAULT_ROLES,
            activeRole: null,
            isAuthenticated: false,
            onboardingCompleted: false,
            isBootstrapping: false,
            error: 'Missing Telegram init data',
          });
          return;
        }

        set({ isBootstrapping: true, initDataInvalid: false, error: null });

        try {
          const response = await http.post<{ token?: string; user?: unknown }>(
            '/auth/telegram',
            {},
            {
              headers: {
                'X-Telegram-Init-Data': initData,
              },
            },
          );
          const token = typeof response.data.token === 'string' ? response.data.token : null;
          const user = normalizeUser(response.data.user, get().activeRole);

          if (!token || !user) {
            throw new Error('Invalid authentication payload');
          }

          const normalized = normalizeRoles(
            {
              isAdvertiser: user.isAdvertiser,
              isChannelOwner: user.isChannelOwner,
            },
            get().activeRole,
          );

          set({
            token,
            user: {
              ...user,
              isAdvertiser: normalized.roles.isAdvertiser,
              isChannelOwner: normalized.roles.isChannelOwner,
            },
            roles: normalized.roles,
            activeRole: normalized.activeRole,
            isAuthenticated: true,
            onboardingCompleted: user.onboardingCompleted,
            isBootstrapping: false,
            initDataInvalid: false,
            error: null,
          });
        } catch (error: unknown) {
          const initDataInvalid = isInvalidTelegramInitDataError(error);
          set({
            token: null,
            user: null,
            roles: DEFAULT_ROLES,
            activeRole: null,
            isAuthenticated: false,
            onboardingCompleted: false,
            isBootstrapping: false,
            initDataInvalid,
            error: initDataInvalid
              ? TELEGRAM_INIT_DATA_RESTART_MESSAGE
              : extractApiErrorMessage(error, 'Authentication failed'),
          });
        }
      },

      completeOnboarding: async (roles) => {
        set({ error: null });
        const normalizedRoles = normalizeRoles(roles, get().activeRole);

        try {
          const response = (await UsersService.postApiUsersCompleteOnboarding({
            requestBody: {
              isAdvertiser: normalizedRoles.roles.isAdvertiser,
              isChannelOwner: normalizedRoles.roles.isChannelOwner,
            },
          })) as unknown;

          const fallbackUser = get().user;
          const normalized = normalizeUser((response as { user?: unknown }).user, normalizedRoles.activeRole);

          const mergedUser: AuthUser | null = normalized
            ? normalized
            : fallbackUser
              ? {
                  ...fallbackUser,
                  isAdvertiser: normalizedRoles.roles.isAdvertiser,
                  isChannelOwner: normalizedRoles.roles.isChannelOwner,
                  onboardingCompleted: true,
                }
              : null;

          const finalRoles = normalizeRoles(
            {
              isAdvertiser: mergedUser?.isAdvertiser ?? normalizedRoles.roles.isAdvertiser,
              isChannelOwner: mergedUser?.isChannelOwner ?? normalizedRoles.roles.isChannelOwner,
            },
            normalizedRoles.activeRole,
          );

          set({
            user: mergedUser
              ? {
                  ...mergedUser,
                  isAdvertiser: finalRoles.roles.isAdvertiser,
                  isChannelOwner: finalRoles.roles.isChannelOwner,
                }
              : mergedUser,
            roles: finalRoles.roles,
            activeRole: finalRoles.activeRole,
            onboardingCompleted: true,
            isAuthenticated: true,
            error: null,
          });
        } catch (error: unknown) {
          const message = extractApiErrorMessage(error, 'Failed to complete onboarding');
          set({ error: message });
          throw new Error(message);
        }
      },

      updateUser: (data) => {
        const current = get().user;

        if (!current) {
          return;
        }

        const merged = {
          ...current,
          ...data,
        };
        const normalized = normalizeRoles(
          {
            isAdvertiser: merged.isAdvertiser,
            isChannelOwner: merged.isChannelOwner,
          },
          get().activeRole,
        );

        set({
          user: {
            ...merged,
            isAdvertiser: normalized.roles.isAdvertiser,
            isChannelOwner: normalized.roles.isChannelOwner,
          },
          roles: normalized.roles,
          activeRole: normalized.activeRole,
          onboardingCompleted: merged.onboardingCompleted,
        });
      },

      markInitDataInvalid: () =>
        set({
          token: null,
          user: null,
          roles: DEFAULT_ROLES,
          activeRole: null,
          isAuthenticated: false,
          onboardingCompleted: false,
          isBootstrapping: false,
          initDataInvalid: true,
          error: TELEGRAM_INIT_DATA_RESTART_MESSAGE,
        }),

      logout: () =>
        set({
          token: null,
          user: null,
          roles: DEFAULT_ROLES,
          activeRole: null,
          isAuthenticated: false,
          onboardingCompleted: false,
          isBootstrapping: false,
          initDataInvalid: false,
          error: null,
        }),
    }),
    {
      name: 'frontend-auth-store',
      version: 2,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<AuthState>;
        const roleSource: RoleFlags = state.user
          ? {
              isAdvertiser: Boolean(state.user.isAdvertiser),
              isChannelOwner: Boolean(state.user.isChannelOwner),
            }
          : {
              isAdvertiser: Boolean(state.roles?.isAdvertiser),
              isChannelOwner: Boolean(state.roles?.isChannelOwner),
            };
        const normalized = normalizeRoles(roleSource, state.activeRole ?? null);

        return {
          ...state,
          token: state.token ?? null,
          roles: normalized.roles,
          activeRole: normalized.activeRole,
          isAuthenticated: state.isAuthenticated ?? false,
          onboardingCompleted: state.onboardingCompleted ?? false,
          initDataInvalid: false,
          user: state.user
            ? {
                ...state.user,
                isAdvertiser: normalized.roles.isAdvertiser,
                isChannelOwner: normalized.roles.isChannelOwner,
              }
            : state.user ?? null,
        };
      },
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        roles: state.roles,
        activeRole: state.activeRole,
        isAuthenticated: state.isAuthenticated,
        onboardingCompleted: state.onboardingCompleted,
      }),
    },
  ),
);
