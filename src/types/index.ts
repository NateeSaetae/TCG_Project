export type Rarity =
  'Common' | 'Uncommon' | 'Rare' | 'Super Rare' | 'Ultra Rare' | 'Secret Rare';
export interface ArtworkLayers {
  background: string;
  midground?: string;
  character: string;
  foreground?: string;
}

export interface SaveData {
  version: 1;
  owned: Record<string, number>;
  packs: number;
  pending: string[];
  sound: boolean;
}
