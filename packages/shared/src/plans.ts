import type { ModuleId } from './modules.js';

export interface PlanDef {
  id: string;
  name: string;
  tagline: string;
  priceMonthlyTry: number;
  trialDays: number;
  features: string[];
  modules: ModuleId[];
  quotas: {
    maxUsers: number;
    maxOrgsPerOwner: number;
    aiTokensPerMonth: number;
    storageMb: number;
    apiCallsPerDay: number;
  };
  highlight?: boolean;
}

export const PLANS: PlanDef[] = [
  {
    id: 'free',
    name: 'Ücretsiz',
    tagline: 'Deneme için, küçük takımlar',
    priceMonthlyTry: 0,
    trialDays: 0,
    features: [
      '1 modül (kendi seçer)',
      'En fazla 3 kullanıcı',
      'Topluluk desteği',
      'AI: 50K token/ay (deneme)',
    ],
    modules: ['damga'],
    quotas: {
      maxUsers: 3,
      maxOrgsPerOwner: 1,
      aiTokensPerMonth: 50_000,
      storageMb: 500,
      apiCallsPerDay: 1_000,
    },
  },
  {
    id: 'starter',
    name: 'Başlangıç',
    tagline: 'Tek lokasyonlu işletmeler için',
    priceMonthlyTry: 49_900,
    trialDays: 14,
    features: [
      '2 modül seçimi',
      'En fazla 15 kullanıcı',
      'AI: 500K token/ay',
      'E-posta + WhatsApp bildirim',
      '14 gün ücretsiz deneme',
    ],
    modules: ['damga', 'lokma'],
    quotas: {
      maxUsers: 15,
      maxOrgsPerOwner: 1,
      aiTokensPerMonth: 500_000,
      storageMb: 5_000,
      apiCallsPerDay: 10_000,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Çoklu sektör + AI yoğun kullanım',
    priceMonthlyTry: 149_900,
    trialDays: 14,
    features: [
      'Tüm 5 modül',
      'En fazla 50 kullanıcı',
      'AI: 5M token/ay',
      'Sesli sekreter + toplantı özetleri',
      'Webhook + REST API',
      'Öncelikli destek',
    ],
    modules: ['damga', 'lokma', 'santral', 'ticaret', 'sayman'],
    quotas: {
      maxUsers: 50,
      maxOrgsPerOwner: 3,
      aiTokensPerMonth: 5_000_000,
      storageMb: 50_000,
      apiCallsPerDay: 100_000,
    },
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Kurumsal',
    tagline: 'Holding/çoklu lokasyon, özel SLA',
    priceMonthlyTry: 499_900,
    trialDays: 30,
    features: [
      'Tüm modüller + özelleştirme',
      'Sınırsız kullanıcı',
      'AI: 50M token/ay + özel model erişimi',
      'Çoklu organizasyon (holding modu)',
      'KEP + e-Fatura tam entegrasyon',
      'Özel SLA + dedike destek',
      'Self-hosted seçeneği',
    ],
    modules: ['damga', 'lokma', 'santral', 'ticaret', 'sayman'],
    quotas: {
      maxUsers: 1_000_000,
      maxOrgsPerOwner: 50,
      aiTokensPerMonth: 50_000_000,
      storageMb: 500_000,
      apiCallsPerDay: 1_000_000,
    },
  },
];

export const PLAN_BY_ID: Record<string, PlanDef> = Object.fromEntries(PLANS.map((p) => [p.id, p]));

export function formatTry(cents: number): string {
  const tl = cents / 100;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(tl);
}
