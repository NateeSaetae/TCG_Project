export type Rarity =
  'Common' | 'Uncommon' | 'Rare' | 'Super Rare' | 'Ultra Rare' | 'Secret Rare';
export interface ArtworkLayers {
  background: string;
  /** Brightness of the background layer only; 1 keeps the original image. */
  backgroundBrightness?: number;
  midground?: string;
  character: string;
  /** Fade a clipped top edge of the character artwork into the background. */
  characterTopFade?: number;
  foreground?: string;
}

export interface SaveData {
  version: 1;
  owned: Record<string, number>;
  packs: number;
  pending: string[];
  sound: boolean;
}
