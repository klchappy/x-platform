import { z } from 'zod';

export const MODULE_IDS = ['damga', 'lokma', 'santral', 'ticaret', 'sayman'] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export const ModuleIdSchema = z.enum(MODULE_IDS);

export interface ModuleMeta {
  id: ModuleId;
  name: string;
  tagline: string;
  description: string;
  sector: string;
  icon: string;
  color: string;
  apiBase: string;
  webBase: string;
}

export const MODULES: Record<ModuleId, ModuleMeta> = {
  damga: {
    id: 'damga',
    name: 'Damga',
    tagline: 'Şeffaf personel takibi',
    description:
      'NFC/QR/GPS doğrulamalı yoklama, vardiya, izin, bordro ve oyunlaştırma. Hash-chain ile değiştirilemez kayıt.',
    sector: 'İnsan Kaynakları & Operasyon',
    icon: '🪪',
    color: '#f97316',
    apiBase: '/v1/modules/damga',
    webBase: '/m/damga',
  },
  lokma: {
    id: 'lokma',
    name: 'Lokma',
    tagline: 'Mutfak işletim sistemi',
    description:
      'Reçete, stok, tedarikçi, satın alma, menü planı ve AI destekli mutfak operasyonu.',
    sector: 'Restoran & Catering',
    icon: '🍳',
    color: '#16a34a',
    apiBase: '/v1/modules/lokma',
    webBase: '/m/lokma',
  },
  santral: {
    id: 'santral',
    name: 'Santral',
    tagline: 'Sesli asistan & CRM',
    description:
      'Çağrı kaydı, sesli sekreter, randevu, görev otomasyonu, toplantı transkripsiyonu ve CRM.',
    sector: 'Ofis & Hizmet',
    icon: '☎️',
    color: '#2563eb',
    apiBase: '/v1/modules/santral',
    webBase: '/m/santral',
  },
  ticaret: {
    id: 'ticaret',
    name: 'Ticaret',
    tagline: 'Üretim & ihracat ERP',
    description:
      'Satış, sevk, e-Fatura, KEP, etiket basımı, onay akışları, kasa ve risk skoru. Tekstil/üretim odaklı.',
    sector: 'Üretim & Ticaret',
    icon: '📦',
    color: '#7c3aed',
    apiBase: '/v1/modules/ticaret',
    webBase: '/m/ticaret',
  },
  sayman: {
    id: 'sayman',
    name: 'Sayman',
    tagline: 'Muhasebe & ödeme takibi',
    description:
      'Borç/alacak takibi, fatura kaydı, ödeme tahsilatı, periyodik abonelikler, nakit akışı. Küçük işletme muhasebesi.',
    sector: 'Muhasebe & Finans',
    icon: '🧮',
    color: '#0ea5e9',
    apiBase: '/v1/modules/sayman',
    webBase: '/m/sayman',
  },
};

export const ALL_MODULE_IDS: ModuleId[] = [...MODULE_IDS];

export function isValidModuleId(id: string): id is ModuleId {
  return (MODULE_IDS as readonly string[]).includes(id);
}
