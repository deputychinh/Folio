import { CatalogUnit, Currency, DiscountType, QuoteStatus, WorkspaceRole, type Quote, type SaveQuoteInput } from '@folio/shared';
import type { WorkspaceContext } from '../../src/common/request-context';

export const ctx: WorkspaceContext = {
  userId: 'user-1',
  email: 'owner@example.com',
  workspaceId: 'ws-1',
  role: WorkspaceRole.OWNER,
  db: {} as WorkspaceContext['db'],
};

export function quote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: 'q-1',
    number: 'Q-2026-0001',
    title: 'Website',
    status: QuoteStatus.DRAFT,
    currency: Currency.USD,
    customerId: 'c-1',
    customerName: 'Acme',
    validUntil: '2099-01-01',
    createdAt: '2026-10-01T00:00:00Z',
    subtotalMinor: 10000,
    discountMinor: 0,
    taxMinor: 0,
    totalMinor: 10000,
    discountType: DiscountType.AMOUNT,
    discountValue: 0,
    taxPercent: 0,
    notes: '',
    items: [{ id: 'i-1', position: 1, name: 'Design', unit: CatalogUnit.DAY, quantity: 1, unitPriceMinor: 10000, lineTotalMinor: 10000 }],
    sentAt: null,
    viewedAt: null,
    respondedAt: null,
    clientName: null,
    declineReason: null,
    ...overrides,
  };
}

export function saveInput(overrides: Partial<SaveQuoteInput> = {}): SaveQuoteInput {
  return {
    customerId: 'c-1',
    title: 'Website',
    validUntil: '2099-01-01',
    items: [
      { name: 'Design', unit: CatalogUnit.DAY, quantity: 2.5, unitPriceMinor: 80000 },
      { name: 'Build', unit: CatalogUnit.DAY, quantity: 3, unitPriceMinor: 95000 },
    ],
    discountType: DiscountType.PERCENT,
    discountValue: 10,
    taxPercent: 8,
    ...overrides,
  };
}
