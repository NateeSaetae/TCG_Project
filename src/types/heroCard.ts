import type { MagicEffectProfile } from './magicEffects';
import type { ArtworkLayers } from './index';
import type { RarityIdentifier } from '../config/rarityDesigns';
import type { CharacterGameplayData } from './combat';

/** Card data shared by every hero rarity. */
export interface HeroCardData {
  /** hero-common remains supported for existing fixtures. */
  layout: 'hero-common' | 'hero';
  id: string;
  name: string;
  rarity: RarityIdentifier;
  cost: number;
  power: number;
  /** Optional title printed in the top-right slot instead of Power. */
  heroTitle?: string;
  characterType: string;
  description: string;
  image: string;
  imagePosition?: string;
  /** Optional layers are used only when the selected design opts in. */
  artwork?: ArtworkLayers;
  magicEffects?: MagicEffectProfile;
  /** Shared by every print of the same character; optional for unfinished sets. */
  gameplay?: CharacterGameplayData;
}
