import * as React from 'react';
import { api } from '../lib/api.js';

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiResponse {
  text: string;
  model: string;
  usage?: { totalTokens?: number; monthRemaining?: number; monthLimit?: number };
}

export function AiChat({ moduleId, systemPrompt }: { moduleId: string; systemPrompt?: string }): React.ReactElement {
  const [messages, setMessages] = React.useState<AiMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [usage, setUsage] = React.useState<AiResponse['usage']>();
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    if (!input.trim() || busy) return;
    const userMsg: AiMessage = { role: 'user', content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setBusy(true);
    setError(null);
    try {
      const sysMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = systemPrompt
        ? [{ role: 'system', content: systemPrompt }]
        : [];
      const resp = await api<AiResponse>('/v1/ai/chat', {
        method: 'POST',
        body: {
          provider: 'anthropic',
          moduleId,
          messages: [...sysMessages, ...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        },
      });
      setMessages((m) => [...m, { role: 'assistant', content: resp.text }]);
      setUsage(resp.usage);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
      try {
        const parsed = JSON.parse(msg.replace(/^API \d+: /, ''));
        setError(parsed?.error?.message ?? msg);
      } catch {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--x-line)',
        borderRadius: 14,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        height: 380,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>🤖 AI Asistan</div>
        {usage?.monthRemaining !== undefined && usage?.monthLimit !== undefined && (
          <div style={{ fontSize: 11, color: 'var(--x-muted)' }}>
            Kalan: {usage.monthRemaining.toLocaleString('tr-TR')} / {usage.monthLimit.toLocaleString('tr-TR')} token
          </div>
        )}
      </div>

      <div ref={scrollerRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        {messages.length === 0 && (
          <div style={{ color: 'var(--x-muted)', fontSize: 13, textAlign: 'center', margin: 'auto', maxWidth: 340 }}>
            Bu modüle özel sorunu yaz. (Şu an Anthropic Claude proxied, /v1/ai/chat üzerinden plan kotanızı kullanır.)
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '8px 12px',
              borderRadius: 12,
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              background: m.role === 'user' ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.06)',
              border: '1px solid var(--x-line)',
            }}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--x-muted)', fontSize: 13, padding: '6px 12px' }}>
            yazıyor…
          </div>
        )}
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#fca5a5', padding: 8, background: 'rgba(239,68,68,0.1)', borderRadius: 8, marginBottom: 8 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="x-input"
          placeholder="Sor…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={busy}
        />
        <button className="x-btn" onClick={send} disabled={busy || !input.trim()}>
          Gönder
        </button>
      </div>
    </div>
  );
}
