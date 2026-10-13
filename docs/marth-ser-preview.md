# Marth SER / FE-006

Open /dev/heroes (or /#/dev/heroes) to compare every registered hero card. Marth SER shares front/back/flip/size controls with the other cards. The former /dev/marth-common URL remains available as an alias.

The supplied transparent marth_of_beginnings_SCR.png sits over the supplied cathedral marth-BG-SCR.png, copied into public/art/aether/heroes/marth/backgrounds. Character artwork and background are separate and use existing smoothed pointer displacements. No additional foreground effect art was fabricated.

SecretRareSurface is the physical face used by SecretHeroCard: layered artwork, fine gold frame, etched finish, diffraction, specular reflection, glass and tiny particles. SecretHeroCard displays hero cost, power, type, description and ID.

secret-hero-card.css scopes the character composition, restrained finishing, lower text vignette and responsive typography to .scr-hero-card. Reduced motion and reveal/effects gating reuse the existing implementation. Hidden SER cards render neither artwork URLs nor foil.

The rarity registry selects secret-full-art for canonical SEC. SER is accepted as a presentation alias of SEC, and the face displays SER. FE-006 is registered for pack rolls and the collection.

Tune src/data/characters/marth.ts for assets and content, and secret-hero-card.css for crop/character scale/foil strength. Swap the SEC registry layout back to hero-common to test the standard layout if desired.
