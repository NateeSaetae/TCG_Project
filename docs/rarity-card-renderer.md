# Rarity-aware card rendering

Card remains a compatibility export of CardRenderer. Existing callers, catalog records, IDs, drop rates and saved data are unchanged.

## Presentation boundary

- CardRenderer owns dispatch and composes the existing TwoSidedCard for flip and shared tilt.
- Legacy CardData continues through its existing layout, including the AW-030 SecretRareCard opt-in and existing foil behavior.
- HeroCardData accepts layout: 'hero' for new cards and retains 'hero-common' for FE-001. It accepts either full rarity names or C/U/R/SR/UR/SEC. Normalization happens only during rendering.
- HeroCardLayout owns the approved Common print layout. CommonHeroCard remains a compatibility export.
- HeroArtwork owns character image selection and optional layers. It creates no extra DOM wrapper. With no layer opt-in, image, crop and focal point remain identical.
- common-hero-card.css is unchanged. Common configuration contains no overrides.

## Adding a future rarity design

Edit src/config/rarityDesigns.ts. Only C is implemented; U/R/SR/UR/SEC all resolve to C until their implemented flag is true. The card's badge still displays its actual rarity. These entries apply to HeroCardData, not the legacy catalog or existing Secret Rare showcase.

Each variant exposes className and inline style slots for frame, description, artwork, background, nameplate and badge. Use variant CSS selectors to target SVG paths, trim, typography or child artwork inside those slots. Background is the print body; artwork is its cropped art field. No additional stylesheet or variant design is applied in this task.

Example for the future Uncommon implementation (not enabled now):

```tsx
U: {
  implemented: true,
  layout: 'hero-common',
  design: {
    frame: { className: 'uncommon-frame' },
    description: { className: 'uncommon-description' },
    artwork: { className: 'uncommon-artwork', layers: true },
    background: { className: 'uncommon-background' },
    Effects: UncommonEffects,
  },
}
```

Effects is an optional React component receiving active. It must honor active=false and reduced motion, position itself inside the existing body, and avoid exposing hidden artwork. Hidden cards do not mount effects or image layers. Inside TwoSidedCard, the existing data-effects gate still controls reveal timing. Keep holographic finishing in this component rather than baking it into character artwork.

Optional artwork data uses the existing ArtworkLayers shape: background, midground, character, foreground. The shared artwork renderer draws those in that order only when design.artwork.layers is enabled. Otherwise it uses card.image. Artwork positioning stays in card.imagePosition; custom crop/layout belongs to variant CSS.

A future design with fundamentally different geometry may add a layout variant at this boundary. Do not duplicate CardRenderer or the flip/pointer wrappers.

## Regression coverage

The fixture tests/fixtures/common-baseline.json was captured before this refactor. Tests compare exact Common rendered markup for default/small/hidden/front/back/effects-off states and the SHA-256 of its approved stylesheet. Existing pack, local storage and showcase regression tests are retained. New tests exercise every rarity name/code, fallback, configurable slots, image layers and hidden/effects-off behavior. DOM/CSS equality protects the existing visual inputs; it is not a live-browser animation test.
