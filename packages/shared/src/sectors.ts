import type { ModuleId } from './modules.js';

export interface SectorBundle {
  id: string;
  name: string;
  description: string;
  recommendedModules: ModuleId[];
}

export const SECTOR_BUNDLES: SectorBundle[] = [
  {
    id: 'uyum_etik',
    name: 'Uyum / Etik Kurul',
    description: 'Etik bildirim, soruşturma, personel takibi — kurumsal uyum.',
    recommendedModules: ['etik', 'damga'],
  },
  {
    id: 'perakende_depo',
    name: 'Perakende / Depo',
    description: 'Envanter + personel + müşteri çağrıları — küçük işletme operasyonu.',
    recommendedModules: ['envanter', 'damga', 'santral'],
  },
  {
    id: 'muhasebe_butik',
    name: 'Muhasebe / SMMM Bürosu',
    description: 'Müşteri firma takibi, ödeme tahsilatı, periyodik aboneliklerin yönetimi.',
    recommendedModules: ['sayman', 'santral'],
  },
  {
    id: 'ofis_hizmet',
    name: 'Ofis / Hizmet',
    description: 'Sekretarya + personel takibi + (opsiyonel) etik kurul.',
    recommendedModules: ['santral', 'damga', 'etik'],
  },
  {
    id: 'tam_paket',
    name: 'Tam Paket (Çoklu Sektör)',
    description: 'Tüm 5 modül — büyük holding/multi-sektör için.',
    recommendedModules: ['etik', 'damga', 'envanter', 'sayman', 'santral'],
  },
];
