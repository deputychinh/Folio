// The Postgres enums (via the generated types, regenerated in CI) must match
// packages/shared exactly, so neither side can drift.
import { CatalogUnit, Currency, DiscountType, InviteStatus, QuoteEventType, QuoteStatus, WorkspaceRole, enumValues } from '@folio/shared';
import { Constants } from '../../src/supabase/database.types';

const db = Constants.public.Enums;

it.each([
  ['workspace_role', WorkspaceRole],
  ['quote_status', QuoteStatus],
  ['quote_event_type', QuoteEventType],
  ['currency_code', Currency],
  ['catalog_unit', CatalogUnit],
  ['discount_type', DiscountType],
  ['invite_status', InviteStatus],
] as const)('%s matches the shared enum', (name, sharedEnum) => {
  expect([...db[name]]).toEqual(enumValues(sharedEnum));
});
