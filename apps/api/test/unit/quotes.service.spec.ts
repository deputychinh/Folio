import { ErrorCode, QuoteStatus } from '@folio/shared';
import { AppError } from '../../src/common/app-error';
import type { QuotesRepository } from '../../src/modules/quotes/quotes.repository';
import { QuotesService } from '../../src/modules/quotes/quotes.service';
import { ctx, quote, saveInput } from './fakes';

function setup(current = quote()) {
  const repository = {
    find: jest.fn().mockResolvedValue(current),
    save: jest.fn().mockResolvedValue(current.id),
    send: jest.fn().mockResolvedValue(undefined),
    duplicate: jest.fn().mockResolvedValue('q-2'),
  };
  const service = new QuotesService(repository as unknown as QuotesRepository, 'https://app.example');
  return { service, repository };
}

async function expectError(promise: Promise<unknown>, code: ErrorCode) {
  await expect(promise).rejects.toBeInstanceOf(AppError);
  await expect(promise).rejects.toMatchObject({ code });
}

describe('QuotesService', () => {
  describe('save', () => {
    it('computes totals on the server, ignoring anything the browser sent', async () => {
      const { service, repository } = setup();
      await service.create(ctx, saveInput());

      const record = repository.save.mock.calls[0][2];
      // 2.5 × 800.00 + 3 × 950.00 = 4850.00; −10 % = 4365.00; +8 % tax = 349.20
      expect(record.lineTotals).toEqual([200000, 285000]);
      expect(record.totals).toEqual({ subtotalMinor: 485000, discountMinor: 48500, taxMinor: 34920, totalMinor: 471420 });
    });

    it('rejects a percent discount above 100', async () => {
      const { service } = setup();
      await expectError(service.create(ctx, saveInput({ discountValue: 101 })), ErrorCode.VALIDATION_ERROR);
    });

    it('rejects a valid-until date in the past', async () => {
      const { service } = setup();
      await expectError(service.create(ctx, saveInput({ validUntil: '2000-01-01' })), ErrorCode.VALIDATION_ERROR);
    });

    it.each([QuoteStatus.SENT, QuoteStatus.VIEWED, QuoteStatus.ACCEPTED, QuoteStatus.DECLINED, QuoteStatus.EXPIRED])(
      'refuses to edit a %s quote',
      async (status) => {
        const { service, repository } = setup(quote({ status }));
        await expectError(service.update(ctx, 'q-1', saveInput()), ErrorCode.INVALID_TRANSITION);
        expect(repository.save).not.toHaveBeenCalled();
      },
    );
  });

  describe('send', () => {
    it('stores only the token hash and returns the link once', async () => {
      const { service, repository } = setup();
      const result = await service.send(ctx, 'q-1');

      const [, , hash] = repository.send.mock.calls[0];
      const token = result.shareUrl.split('/q/')[1];
      expect(result.shareUrl).toMatch(/^https:\/\/app\.example\/q\/[A-Za-z0-9_-]{43}$/);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(hash).not.toContain(token);
    });

    it('creates a different link each time', async () => {
      const { service } = setup(quote({ status: QuoteStatus.SENT }));
      const first = await service.send(ctx, 'q-1');
      const second = await service.send(ctx, 'q-1');
      expect(first.shareUrl).not.toBe(second.shareUrl);
    });

    it('refuses an empty quote', async () => {
      const { service } = setup(quote({ items: [] }));
      await expectError(service.send(ctx, 'q-1'), ErrorCode.VALIDATION_ERROR);
    });

    it('refuses an expired quote', async () => {
      const { service } = setup(quote({ status: QuoteStatus.EXPIRED }));
      await expectError(service.send(ctx, 'q-1'), ErrorCode.QUOTE_EXPIRED);
    });

    it.each([QuoteStatus.ACCEPTED, QuoteStatus.DECLINED])('refuses a %s quote', async (status) => {
      const { service, repository } = setup(quote({ status }));
      await expectError(service.send(ctx, 'q-1'), ErrorCode.INVALID_TRANSITION);
      expect(repository.send).not.toHaveBeenCalled();
    });
  });

  it('duplicates with a fresh valid-until date', async () => {
    const { service, repository } = setup();
    await service.duplicate(ctx, 'q-1');
    const validUntil: string = repository.duplicate.mock.calls[0][2];
    expect(validUntil > new Date().toISOString().slice(0, 10)).toBe(true);
  });
});
