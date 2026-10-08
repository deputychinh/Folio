// Every limit, default and route in Folio. Change a number here, nowhere else.

export const API_PREFIX = '/api/v1';
export const WORKSPACE_HEADER = 'x-workspace-id';

export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_MAX = 100;

export const QUOTE_VALID_DAYS_DEFAULT = 30;
export const QUOTE_ITEMS_MAX = 100;
export const QUOTE_NUMBER_PREFIX = 'Q-';
export const QUOTE_TITLE_MAX = 140;
export const QUOTE_NOTES_MAX = 4000;
export const QUANTITY_MAX = 100_000;
export const UNIT_PRICE_MINOR_MAX = 10_000_000_000; // 100 million in major units (2 decimals)
export const TAX_PERCENT_MAX = 50;
export const DISCOUNT_PERCENT_MAX = 100;

export const SHARE_TOKEN_BYTES = 32;
export const INVITE_VALID_DAYS = 7;
export const PUBLIC_RATE_LIMIT = { requests: 30, windowSeconds: 60 } as const;

export const EXPIRING_SOON_DAYS = 7;
export const WIN_RATE_WINDOW_DAYS = 30;
export const RECENT_ACTIVITY_LIMIT = 10;

export const NAME_MAX = 120;
/** Also set in supabase/config.toml (auth.minimum_password_length). */
export const PASSWORD_MIN_LENGTH = 8;
export const SEARCH_MAX = 80;
export const DECLINE_REASON_MAX = 500;

export const SEARCH_DEBOUNCE_MS = 250;
export const AUTOSAVE_DELAY_MS = 1500;
export const TOAST_DURATION_MS = 4000;

/** Decimal places per currency (VND has no minor unit). */
export const CURRENCY_DECIMALS: Record<string, number> = { VND: 0 };
export const CURRENCY_DECIMALS_DEFAULT = 2;

export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  RESET: '/reset',
  ONBOARDING: '/onboarding',
  INVITE: '/invite/:token',
  DASHBOARD: '/',
  QUOTES: '/quotes',
  QUOTE_NEW: '/quotes/new',
  QUOTE: '/quotes/:id',
  CUSTOMERS: '/customers',
  CUSTOMER: '/customers/:id',
  CATALOG: '/catalog',
  SETTINGS: '/settings',
  PUBLIC_QUOTE: '/q/:token',
} as const;
