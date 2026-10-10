# Marth SCR / FE-006

Open /dev/marth-common (or /#/dev/marth-common) to compare all six Marth prints. SCR is the final item and shares front/back/flip/size controls.

The supplied transparent marth_of_beginnings_SCR.png sits over the supplied cathedral marth-BG-SCR.png, copied into public/art/aether/backgrounds. Character artwork and background are separate and use existing smoothed pointer displacements. No additional foreground effect art was fabricated.

SecretRareSurface is the shared physical face used by both Aether and SecretHeroCard: identical layered artwork pipeline, fine gold frame, etched finish, diffraction, specular reflection, glass and tiny particles. SecretRareCard retains Aether's original information markup; SecretHeroCard displays real hero cost/power/type/description/ID rather than inventing legacy attack/defense values.

secret-hero-card.css scopes the new character composition, restrained finishing, lower text vignette and responsive typography to .scr-hero-card. The existing Aether CSS and the C/U/R/SR/UR variants are unchanged. Reduced motion and reveal/effects gating reuse the existing implementation. Hidden SCR cards render neither artwork URLs nor foil.

The rarity registry selects secret-full-art for canonical SEC. SCR is accepted as a presentation alias of SEC, and the new face displays SCR. Existing catalog rarity names, weights, save data and AW-030 remain unchanged. FE-006 is only a preview fixture and is absent from pack rolls/collection.

Tune src/data/marthSecretRarePreview.ts for assets and content, and secret-hero-card.css for crop/character scale/foil strength. Swap the SEC registry layout back to hero-common to test the standard layout if desired.
