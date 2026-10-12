# Common hero card — Marth prototype

Open `http://127.0.0.1:5173/dev/marth-common` with the dev server running. Hash alias: `/#/dev/marth-common`. The existing Secret Rare showcase links to this page and remains unchanged in behavior. Both preview routes are dev-only.

## Asset

The approved Common artwork is at `public/art/aether/heroes/marth/characters/marth_hero-king_C.png`. Change `image` and optional `imagePosition` in `src/data/characters/marth.ts` to replace it. Artwork fills the card using cover, preserving image proportions while cropping the sides as needed. The opaque description panel and dark identity panel overlay the artwork. No text is baked into the PNG.

## Components and files

- `src/types/heroCard.ts`: separate presentation data model with layout discriminant, power and characterType; avoids inventing legacy attack/defense fields.
- `src/data/characters/marth.ts`: FE-001 and all other Marth prints, registered for packs and the archive through `src/data/characters/index.ts`.
- `src/components/cards/CommonHeroCard.tsx`: compatibility export of `HeroCardLayout`; the shared printed face retains cost and power, artwork, opaque description panel, centered identity and bottom corner rarity/ID.
- `src/components/cards/common-hero-card.css`: independent navy/parchment frame. Container-relative typography, proportional regions and full-card artwork scale together. The description wraps and permits scrolling for unusually long future rules text instead of truncation. Future exceptionally long names/types should be visually checked at the smallest supported size.
- `src/components/cards/Card.tsx`: compatibility export of the shared `CardRenderer`. All existing CardData records retain the old renderer.
- `src/pages/dev/MarthPreview.tsx`: front/back, flip and 200–400px size controls, with mobile width limits.
- `src/App.tsx`: dev-only lazy route.
- `src/pages/CardShowcase.tsx`: adds a link to the Common preview; keeps existing controls and effects.
- `tests/card-render.test.mjs`: checks the new anatomy, asset, hidden state, shared two-sided composition and inclusion in the pack catalog.

Common uses a quiet satin reflection, without Secret Rare foil. Shared TwoSidedCard still owns flip and the outer pointer tilt. When rendered inside it, the Common face disables its independent pointer handler and inherits the shared variables. Standalone faces reuse useCardPointer. Reduced motion remains supported.

## Future cards

Create another HeroCardData record with `layout: 'hero'` and pass it to Card or CardRenderer. The existing `hero-common` value remains supported. Full rarity names and C/U/R/SR/UR/SEC are accepted at this presentation boundary. Configure future frame styles in `src/config/rarityDesigns.ts`; unimplemented variants use the approved Common layout. Existing catalog records and the Secret Rare showcase keep their renderers. See [Rarity-aware card rendering](rarity-card-renderer.md) for slots, artwork layers, effects and regression coverage.

## Verification

TypeScript/Vite build, existing regression tests and Common-specific SSR tests were run. No lint script exists; use `npm.cmd run format:check` for the configured formatting check. SSR checks cannot establish pixel layout, live pointer smoothness or animation timing. Interactive visual verification requires a connected browser.
