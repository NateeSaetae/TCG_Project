# Fire Emblem TCG — The Hero Collection

## Scope

A presentation-only rebrand of the existing local React/Vite app. Hash routes, card IDs, card data, drop rates, pack generation, reveal timing and local collection persistence are retained. No network assets, dependencies, backend or deployment were added. Existing fictional cards remain temporary content until a separate card-design phase.

## Modified files

- `index.html`: page title and browser theme color.
- `src/App.tsx`: royal brand header, Hero Archive navigation label, keyboard skip link, fan-project footer, configurable background. Existing routes are unchanged. The detail toggle was already commented out in the user's source and has been left that way.
- `src/main.tsx`: imports the presentation theme after existing styles.
- `src/pages/Home.tsx`: new royal landing copy, actions and archive summary; existing hero card fan retained; entrance respects reduced motion.
- `src/pages/PackOpening.tsx`: summoning copy and decorative circle; state transitions and calls to the randomizer/storage are unchanged.
- `src/pages/Collection.tsx`: Hero Archive heading, collection progress and optional short rarity labels in the filter. Actual filter values remain the existing full rarity names.
- `src/pages/CardShowcase.tsx`: reliquary heading; front/back, flip, fixed lighting, sliders and replay preserved.
- `src/components/pack/BoosterPack.tsx`: new wrapper branding and configurable placeholder artwork; opening animation classes unchanged.
- `src/components/cards/TwoSidedCard.tsx`: only the accessible back-image alt text changed to the new brand.
- `src/config/brand.ts`: application name, subtitle and theme asset URLs.
- `src/config/rarityLabels.ts`: presentation-only C / U / R / SR / UR / SEC mapping for future layout integration.
- `src/theme/tokens.css`: navy, royal blue, antique gold, parchment, deep background and crimson; typography, spacing, border, surface and texture tokens.
- `src/theme/royal.css`: website chrome and responsive theme, separate from the existing card renderer.
- `public/theme/`: new original SVG placeholders.
- `tests/card-render.test.mjs`: main-page render and legacy save compatibility regression checks.
- `README.md` and this document: updated project entry point and maintenance notes.

## Theme and asset replacement

Change palette/type tokens in `src/theme/tokens.css`. Website styles live in `src/theme/royal.css`; avoid targeting `.tcg-card`, `.sr-body`, or foil/parallax layers during website-only work.

Theme URLs are configured in `src/config/brand.ts`:

| Asset             | Current source                        | Status                                                |
| ----------------- | ------------------------------------- | ----------------------------------------------------- |
| Royal sword crest | `/theme/royal-crest-placeholder.svg`  | Original geometric placeholder, not an official logo  |
| Court background  | `/theme/royal-court-placeholder.svg`  | Original architectural silhouette placeholder         |
| Booster art       | `/art/30.svg`                         | Existing fictional artwork placeholder                |
| Hero showcase     | Existing cards in `src/data/cards.ts` | Existing original artwork, not Fire Emblem characters |

There are no externally hosted images or downloaded copyrighted illustrations. Fonts use local system serif/sans stacks. Replace files in public or point the config to new local files when approved project artwork is available. Card artwork continues to be configured separately in `src/data/cards.ts`.

## Persistence and compatibility

Keep `aetherveil-save-v1` as the storage key. It is an internal compatibility identifier, not visible branding. The npm package name also remains an internal identifier. Switching to a new save key or changing card IDs would lose access to existing progress without a migration. No migration is required here.

The implementation verifies byte-identical data, rarity weights, pack generator, collection hook, main card renderer, pointer hook and normal/Secret Rare reveal components against the pre-rebrand source. The front/back renderer changes only its alt text.

## Verification

- `npm.cmd run build`: passed TypeScript and Vite production build.
- `npm.cmd test`: 14 tests passed, including 10,000 seeded packs; normal/Secret Rare starting faces; showcase controls; all four page renders; restoring a legacy save, adding a pack, reloading and clearing pending reveal while keeping owned counts.
- `npm.cmd run format:check`: passed.
- No lint script is configured in package.json, so there is no existing lint command to run. Type checking and formatting were run instead; no lint tooling was installed.
- Browser automation inventory is empty. Actual desktop/mobile screenshots, live pointer/flip interactions, visual alignment and FPS remain unverified. SSR tests exercise rendering and storage behavior but do not replace those checks.

## Next phase

1. Review the theme at desktop and phone widths, and provide Fire Emblem hero artwork/logo assets to replace the identified placeholders.
2. Define the new card layout separately using the rarityLabels mapping while retaining existing rarity values, IDs and odds.
3. Add a renderer/profile opt-in for new card designs; keep legacy records playable during the transition.
4. If fictional cards are replaced with new hero records, design an explicit save migration before changing IDs.
