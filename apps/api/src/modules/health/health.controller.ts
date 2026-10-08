import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Controller('health')
export class HealthController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async check(): Promise<{ status: 'ok' | 'degraded'; db: boolean; time: string }> {
    const { error } = await this.supabase.admin().from('rate_limit_hits').select('key', { head: true, count: 'exact' });
    return { status: error ? 'degraded' : 'ok', db: !error, time: new Date().toISOString() };
  }
}
