// Every closed set of values in Folio. Postgres enum types use the same strings
// (supabase/migrations/0001_schema.sql) and a contract test keeps them in sync.

type ValueOf<T> = T[keyof T];

export const WorkspaceRole = { OWNER: 'owner', ADMIN: 'admin', MEMBER: 'member' } as const;
export type WorkspaceRole = ValueOf<typeof WorkspaceRole>;

/** Roles that manage the workspace: settings and team. */
export const MANAGER_ROLES: readonly WorkspaceRole[] = [WorkspaceRole.OWNER, WorkspaceRole.ADMIN];

/** Owners are made by promotion, never by invite. */
export const INVITE_ROLES: readonly WorkspaceRole[] = [WorkspaceRole.MEMBER, WorkspaceRole.ADMIN];

export function isManager(role: WorkspaceRole | null | undefined): boolean {
  return role !== null && role !== undefined && MANAGER_ROLES.includes(role);
}

export const QuoteStatus = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
} as const;
export type QuoteStatus = ValueOf<typeof QuoteStatus>;

export const QuoteEventType = {
  CREATED: 'created',
  SENT: 'sent',
  VIEWED: 'viewed',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  DUPLICATED: 'duplicated',
} as const;
export type QuoteEventType = ValueOf<typeof QuoteEventType>;

export const Currency = { USD: 'USD', EUR: 'EUR', GBP: 'GBP', SGD: 'SGD', AUD: 'AUD', VND: 'VND' } as const;
export type Currency = ValueOf<typeof Currency>;

export const CatalogUnit = { HOUR: 'hour', DAY: 'day', ITEM: 'item', MONTH: 'month', PROJECT: 'project' } as const;
export type CatalogUnit = ValueOf<typeof CatalogUnit>;

export const DiscountType = { PERCENT: 'percent', AMOUNT: 'amount' } as const;
export type DiscountType = ValueOf<typeof DiscountType>;

export const InviteStatus = { PENDING: 'pending', ACCEPTED: 'accepted', REVOKED: 'revoked' } as const;
export type InviteStatus = ValueOf<typeof InviteStatus>;

export const QuoteSort = { NEWEST: 'newest', VALUE_DESC: 'value_desc', VALID_UNTIL_ASC: 'valid_until_asc' } as const;
export type QuoteSort = ValueOf<typeof QuoteSort>;

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  QUOTE_EXPIRED: 'QUOTE_EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
export type ErrorCode = ValueOf<typeof ErrorCode>;

/** Values of an enum object as an array, e.g. for validators and select options. */
export function enumValues<T extends Record<string, string>>(enumObject: T): ValueOf<T>[] {
  return Object.values(enumObject) as ValueOf<T>[];
}
