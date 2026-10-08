import { Injectable } from '@nestjs/common';
import type { PublicQuote, QuoteStatus, RespondQuoteInput } from '@folio/shared';
import { unwrap } from '../../supabase/db-error';
import { SupabaseService } from '../../supabase/supabase.service';

/** Shape returned by the get_public_quote Postgres function. */
interface PublicQuoteJson {
  number: string;
  title: string;
  status: PublicQuote['status'];
  currency: PublicQuote['currency'];
  valid_until: string;
  sent_at: string;
  notes: string;
  discount_type: PublicQuote['discountType'];
  discount_value: number;
  tax_percent: number;
  subtotal_minor: number;
  discount_minor: number;
  tax_minor: number;
  total_minor: number;
  client_name: string | null;
  responded_at: string | null;
  seller: { name: string; logo_path: string | null; brand_accent: string | null };
  customer: { company_name: string; contact_name: string };
  items: { name: string; unit: PublicQuote['items'][number]['unit']; quantity: number; unit_price_minor: number; line_total_minor: number }[];
}

function toPublicQuote(json: PublicQuoteJson): PublicQuote {
  return {
    number: json.number,
    title: json.title,
    status: json.status,
    currency: json.currency,
    validUntil: json.valid_until,
    sentAt: json.sent_at,
    notes: json.notes,
    discountType: json.discount_type,
    discountValue: Number(json.discount_value),
    taxPercent: Number(json.tax_percent),
    subtotalMinor: json.subtotal_minor,
    discountMinor: json.discount_minor,
    taxMinor: json.tax_minor,
    totalMinor: json.total_minor,
    clientName: json.client_name,
    respondedAt: json.responded_at,
    seller: { name: json.seller.name, logoUrl: json.seller.logo_path, brandAccent: json.seller.brand_accent },
    customer: { companyName: json.customer.company_name, contactName: json.customer.contact_name },
    items: json.items.map((item) => ({
      name: item.name,
      unit: item.unit,
      quantity: Number(item.quantity),
      unitPriceMinor: item.unit_price_minor,
      lineTotalMinor: item.line_total_minor,
    })),
  };
}

/**
 * The only module that uses the service role. It calls three Postgres
 * functions that check the token hash themselves; it never reads tables.
 */
@Injectable()
export class PublicQuotesRepository {
  constructor(private readonly supabase: SupabaseService) {}

  async allow(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    return unwrap(
      await this.supabase.admin().rpc('rate_limit_hit', { p_key: key, p_limit: limit, p_window_seconds: windowSeconds }),
    );
  }

  async open(tokenHash: string): Promise<PublicQuote> {
    const json = unwrap(await this.supabase.admin().rpc('get_public_quote', { p_token_hash: tokenHash }));
    return toPublicQuote(json as unknown as PublicQuoteJson);
  }

  async respond(tokenHash: string, input: RespondQuoteInput): Promise<QuoteStatus> {
    return unwrap(
      await this.supabase.admin().rpc('respond_public_quote', {
        p_token_hash: tokenHash,
        p_accept: input.accept,
        p_client_name: input.clientName.trim(),
        p_reason: input.declineReason?.trim() ?? '',
      }),
    );
  }
}
