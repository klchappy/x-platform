import { defineModule } from '@x/module-api';

export default defineModule({
  id: 'santral',
  version: '0.1.0',
  registerRoutes(router, ctx) {
    router.get('/health', (_req, res) => {
      res.json({ ok: true, module: 'santral', version: '0.1.0' });
    });
    router.get('/overview', (_req, res) => {
      res.json({
        name: 'Santral',
        tagline: 'Sesli asistan & CRM',
        capabilities: [
          'calls.log',
          'calls.reminder',
          'voice.secretary',
          'meetings.transcribe',
          'meetings.summarize',
          'tasks.recurring',
          'calendar.google.sync',
          'contacts.directory',
          'crm.pipeline',
          'crm.deals',
        ],
        roadmap: [
          'Phase 1: shell entegrasyonu (✓)',
          'Phase 2: contacts + calls + tasks port',
          'Phase 3: voice secretary + meeting transcription',
          'Phase 4: CRM pipeline + Google Calendar sync',
        ],
      });
    });
    ctx.log('santral module registered', { routes: 2 });
  },
});
