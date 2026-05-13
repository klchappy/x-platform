import type { ModuleId } from './modules.js';

export interface SectorBundle {
  id: string;
  name: string;
  description: string;
  recommendedModules: ModuleId[];
}

export const SECTOR_BUNDLES: SectorBundle[] = [
  {
    id: 'restoran',
    name: 'Restoran / Catering',
    description: 'Mutfak operasyonu + personel takibi + müşteri çağrıları.',
    recommendedModules: ['lokma', 'damga', 'santral'],
  },
  {
    id: 'tekstil_uretim',
    name: 'Tekstil / Üretim',
    description: 'Üretim/ihracat ERP + personel + ofis sekretaryası.',
    recommendedModules: ['ticaret', 'damga', 'santral'],
  },
  {
    id: 'ofis_hizmet',
    name: 'Ofis / Hizmet',
    description: 'Sekretarya + personel takibi + (opsiyonel) satış.',
    recommendedModules: ['santral', 'damga'],
  },
  {
    id: 'tam_pakcage',
    name: 'Tam Paket (Çoklu Sektör)',
    description: 'Tüm modüller — büyük holding/multi-sektör için.',
    recommendedModules: ['damga', 'lokma', 'santral', 'ticaret'],
  },
];
