# Single-image card back

The back now uses only public/card/card-back-fitted.png. Change the path in src/config/cardBack.ts. The original public/card/card-back-prod.png remains untouched.

CardBack.tsx renders one image; card-back.css uses the fe-card-back namespace to avoid the legacy .card-back pack stack rules (fixed width, inset border and stacked shadows). The transparent artwork fills the physical card with object-fit: cover and centered positioning. The fitted asset was cropped pixel-for-pixel from the original at x=60, y=24, width=954, height=1390. Its aspect ratio matches the physical card; CSS uses object-fit: cover without an extra transform. This trims a small amount of the side ornaments to fill the card while preserving the original logo and texture. The backing surface and flip face are transparent, so no solid color shows through the transparent corners.

TwoSidedCard retains shared tilt and flip. No foil, masks, separate logo layers or back-holographic controls are active. Layered PNG assets remain on disk for future use. Front rendering, card data and pack probabilities are unchanged.

Verification: build and renderer/pack tests are run for this change. Live browser inspection is unavailable in this session.
