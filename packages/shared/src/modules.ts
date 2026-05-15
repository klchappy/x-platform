import { z } from 'zod';

export const MODULE_IDS = ['damga', 'santral', 'sayman', 'etik', 'envanter', 'lokma'] as const;
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
  etik: {
    id: 'etik',
    name: 'Etik',
    tagline: 'Etik bildirim & soruşturma',
    description:
      'Anonim/açık şikayet, etik kurul soruşturmaları, vaka takibi, KVKK uyumlu kanıt yönetimi.',
    sector: 'Uyum & Etik',
    icon: '⚖️',
    color: '#dc2626',
    apiBase: '/v1/modules/etik',
    webBase: '/m/etik',
  },
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
  envanter: {
    id: 'envanter',
    name: 'Envanter',
    tagline: 'Ürün & stok takibi',
    description:
      'Ürün kataloğu, stok hareketleri (giriş/çıkış/sayım), depo bazlı miktar, düşük stok uyarısı.',
    sector: 'Operasyon & Lojistik',
    icon: '📦',
    color: '#7c3aed',
    apiBase: '/v1/modules/envanter',
    webBase: '/m/envanter',
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
  lokma: {
    id: 'lokma',
    name: 'Lokma',
    tagline: 'Mutfak yönetimi',
    description:
      'Tarif, malzeme, stok lotları, SKT takibi, menü planlama. Restoran/otel/catering mutfakları için.',
    sector: 'Gıda & HoReCa',
    icon: '🍲',
    color: '#fbbf24',
    apiBase: '/v1/modules/lokma',
    webBase: '/m/lokma',
  },
};

export const ALL_MODULE_IDS: ModuleId[] = [...MODULE_IDS];

export function isValidModuleId(id: string): id is ModuleId {
  return (MODULE_IDS as readonly string[]).includes(id);
}
