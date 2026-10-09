import type { ComponentType, CSSProperties } from 'react';
import type { Rarity } from '../types';
import { rarityLabels } from './rarityLabels';

export type RarityCode = 'C' | 'U' | 'R' | 'SR' | 'UR' | 'SEC';
export type RarityIdentifier = Rarity | RarityCode;

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
  Effects?: ComponentType<{ active: boolean }>;
}

export interface RarityDesign {
  implemented: boolean;
  layout: 'hero-common';
  design: HeroCardDesign;
}

/** Common values remain in the approved CSS/SVG; no override is applied. */
export const rarityDesigns: Record<RarityCode, RarityDesign> = {
  C: { implemented: true, layout: 'hero-common', design: {} },
  U: { implemented: false, layout: 'hero-common', design: {} },
  R: { implemented: false, layout: 'hero-common', design: {} },
  SR: { implemented: false, layout: 'hero-common', design: {} },
  UR: { implemented: false, layout: 'hero-common', design: {} },
  SEC: { implemented: false, layout: 'hero-common', design: {} },
};

export function resolveRarityDesign(rarity: RarityIdentifier): RarityDesign {
  const variant = rarityDesigns[rarityCode(rarity)];
  return variant.implemented ? variant : rarityDesigns.C;
}
