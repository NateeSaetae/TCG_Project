/** Per-card artwork/reflection tuning; no changes to saved collection data. */
export interface MagicEffectProfile {
  enabled: boolean;
  foilArtwork: string;
  foilMask: string;
  backgroundArtwork?: string;
  foregroundOpacity: number;
  foregroundDepth: number;
  backgroundDepth: number;
  foilIntensity: number;
  highlightOpacity: number;
  colors: readonly [string, string, string, string, string];
}
