export type ActiveRole = 'advertiser' | 'publisher' | null;

export type RoleFlags = {
  isAdvertiser: boolean;
  isChannelOwner: boolean;
};

type NormalizedRoleState = {
  activeRole: ActiveRole;
  roles: RoleFlags;
};

const EMPTY_ROLES: RoleFlags = {
  isAdvertiser: false,
  isChannelOwner: false,
};

function toFlags(activeRole: ActiveRole): RoleFlags {
  if (activeRole === 'advertiser') {
    return { isAdvertiser: true, isChannelOwner: false };
  }

  if (activeRole === 'publisher') {
    return { isAdvertiser: false, isChannelOwner: true };
  }

  return EMPTY_ROLES;
}

function normalizePreferredRole(preferredRole: ActiveRole): ActiveRole {
  return preferredRole === 'advertiser' || preferredRole === 'publisher' ? preferredRole : null;
}

function resolveActiveRole(roles: RoleFlags, preferredRole: ActiveRole): ActiveRole {
  if (roles.isAdvertiser && roles.isChannelOwner) {
    return normalizePreferredRole(preferredRole) ?? 'advertiser';
  }

  if (roles.isAdvertiser) {
    return 'advertiser';
  }

  if (roles.isChannelOwner) {
    return 'publisher';
  }

  return null;
}

export function normalizeRoles(roles: RoleFlags, preferredRole: ActiveRole = null): NormalizedRoleState {
  const activeRole = resolveActiveRole(roles, preferredRole);

  return {
    activeRole,
    roles: toFlags(activeRole),
  };
}
