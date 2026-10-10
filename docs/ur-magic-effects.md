# UR interactive magic experiment

FE-005 keeps its approved character, castle WebP, printed frame, cost/power, rarity badge, dimensions and text. No dependency or pointer listener was added. FE-001 through FE-004 data/CSS are unchanged.

## Compare and revert

Open /dev/marth-common and toggle **UR magic: Enhanced / Original**. Original disables the profile and renders the previous PNG at its original opacity (.55), depth (1) and position. To make this permanent, set magicEffects.enabled to false in src/data/marthUltraRarePreview.ts. Frame foil is independent and remains unchanged in both modes.

## Artwork and reflection

The existing /art/aether/effects/marth_sr_front.png remains the foreground artwork. Enhanced mode lowers its opacity to .34, shifts the composition down 2cqw and gives it 1.1 times the foreground pointer displacement. No SR back PNG is added. A very soft cyan aura sits behind the character; a future clean background PNG can be supplied through backgroundArtwork.

MagicEffects renders a separate reflection: an outer alpha mask uses the same foreground PNG, and an inner selective SVG mask permits only four small peripheral crystal facets. This intersection prevents diffuse glow or the broad diagonal streak from becoming a rainbow overlay. The masks use the same contain sizing, centering and translation as the PNG. The overlay sits above artwork but below description/name/cost/badge.

New asset: public/art/aether/effects/ur_magic_selective_mask.svg. This is an original small facet mask for the existing PNG, not replacement illustrated artwork. Use a matching selective mask for each future effect PNG.

## Configuration

MagicEffectProfile (src/types/magicEffects.ts) provides foilArtwork, foilMask, optional backgroundArtwork, foregroundOpacity, foregroundDepth, backgroundDepth, foilIntensity, highlightOpacity and five reflection colors. Existing artwork.foreground remains the primary artistic source.

The approved castle and character keep their existing displacement. Background aura uses .25 times the background displacement (about .5px maximum), character keeps 7px, and foreground/reflection use 1.1 times foreground displacement (11px maximum). Reflection stays attached to the same crystal pixels; its color/highlight moves independently through existing --foil-angle, --foil-x/y, --mx/my and --presence values. No continuously running rainbow or particle animation is used. Reduced motion fixes these overlays and disables specular movement. Reveal gating and hidden-card behavior suppress the new reflection.

## Asset limitations

The straight streaks, large stars, curved ribbons and small crystals are baked together in marth_sr_front.png. Reduced opacity/repositioning improves restraint but cannot remove individual baked elements. The Marth character PNG also includes its own cyan flame/glow, which is intentionally untouched.

For the fully refined Royal Magical Aura composition, supply separate transparent foreground ribbons, a sparse crystal-only layer, and a soft background-aura PNG without stars/streaks, each with a dedicated narrow highlight mask. Do not crop out unwanted baked details through destructive CSS or replace the art with procedural drawings.

## Verification

Regression tests cover legacy-mode equivalence, retained assets, selective masks, disabled/hidden effects, and original Common markup/CSS. Build and tests validate structure; live browser inspection is still needed for the artistic composition and tilt feel.
