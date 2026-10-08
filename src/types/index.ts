export type Rarity =
  'Common' | 'Uncommon' | 'Rare' | 'Super Rare' | 'Ultra Rare' | 'Secret Rare';
export type Element = 'Fire' | 'Water' | 'Nature' | 'Light' | 'Dark' | 'Arcane';
export interface ArtworkLayers {
  background: string;
  midground?: string;
  character: string;
  foreground?: string;
}

export interface CardData {
  id: string;
  name: string;
  character: string;
  rarity: Rarity;
  element: Element;
  cardType: 'Guardian' | 'Spirit' | 'Relic';
  cost: number;
  attack: number;
  defense: number;
  description: string;
  image: string;
  /** Focal point for full-art cropping; defaults to the center. */
  imagePosition?: string;
  artwork?: ArtworkLayers;
  set: string;
  cardNumber: number;
}
export interface SaveData {
  version: 1;
  owned: Record<string, number>;
  packs: number;
  pending: string[];
  sound: boolean;
}
