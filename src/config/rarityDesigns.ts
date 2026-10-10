import type { HeroCardData } from '../types/heroCard';
import type { ComponentType, CSSProperties } from 'react';
import type { Rarity } from '../types';
import { rarityLabels } from './rarityLabels';
import { UltraRareFoil } from '../components/cards/UltraRareFoil';

export type RarityCode = 'C' | 'U' | 'R' | 'SR' | 'UR' | 'SEC';
/** SCR is a presentation alias of the existing SEC tier. */
export type RarityIdentifier = Rarity | RarityCode | 'SCR';

export const rarityNames: Record<RarityCode, Rarity> = {
  C: 'Common',
  U: 'Uncommon',
  R: 'Rare',
  SR: 'Super Rare',
  UR: 'Ultra Rare',
  SEC: 'Secret Rare',
};

/** Presentation-only normalization: never changes catalog or saved values. */
export function rarityCode(rarity: RarityIdentifier): RarityCode {
  if (rarity === 'SCR') return 'SEC';
  return rarity in rarityNames
    ? (rarity as RarityCode)
    : (rarityLabels[rarity as Rarity] as RarityCode);
}

export interface DesignSlot {
  className?: string;
  style?: CSSProperties;
}

/** Override slots in the shared layout; keep effects separate from printed art. */
export interface HeroCardDesign {
  frame?: DesignSlot;
  description?: DesignSlot;
  artwork?: DesignSlot & { layers?: boolean };
  background?: DesignSlot;
  nameplate?: DesignSlot;
  badge?: DesignSlot;
  Effects?: ComponentType<{ active: boolean; card?: HeroCardData }>;
}

export interface RarityDesign {
  implemented: boolean;
  layout: 'hero-common' | 'secret-full-art';
  design: HeroCardDesign;
}

/** Common values remain in the approved CSS/SVG; no override is applied. */
export const rarityDesigns: Record<RarityCode, RarityDesign> = {
  C: { implemented: true, layout: 'hero-common', design: {} },
  U: {
    implemented: true,
    layout: 'hero-common',
    design: {
      background: { className: 'uncommon-hero-body' },
      artwork: { layers: true, className: 'uncommon-art-field' },
      frame: { className: 'uncommon-print-frame' },
      description: { className: 'uncommon-description' },
      nameplate: { className: 'uncommon-nameplate' },
      badge: { className: 'uncommon-badge' },
    },
  },
  R: {
    implemented: true,
    layout: 'hero-common',
    design: {
      background: { className: 'rare-hero-body' },
      artwork: { layers: true, className: 'rare-art-field' },
      frame: { className: 'rare-print-frame' },
      description: { className: 'rare-description' },
      nameplate: { className: 'rare-nameplate' },
      badge: { className: 'rare-badge' },
    },
  },
  SR: {
    implemented: true,
    layout: 'hero-common',
    design: {
      background: { className: 'super-rare-hero-body' },
      artwork: { layers: true, className: 'super-rare-art-field' },
      frame: { className: 'super-rare-print-frame' },
      description: { className: 'super-rare-description' },
      nameplate: { className: 'super-rare-nameplate' },
      badge: { className: 'super-rare-badge' },
    },
  },
  UR: {
    implemented: true,
    layout: 'hero-common',
    design: {
      background: { className: 'ultra-rare-hero-body' },
      artwork: { layers: true, className: 'ultra-rare-art-field' },
      frame: { className: 'ultra-rare-print-frame' },
      description: { className: 'ultra-rare-description' },
      nameplate: { className: 'ultra-rare-nameplate' },
      badge: { className: 'ultra-rare-badge' },
      Effects: UltraRareFoil,
    },
  },
  SEC: { implemented: true, layout: 'secret-full-art', design: {} },
};

export function resolveRarityDesign(rarity: RarityIdentifier): RarityDesign {
  const variant = rarityDesigns[rarityCode(rarity)];
  return variant.implemented ? variant : rarityDesigns.C;
}
