# Fire Emblem Awakening Card Back Assets

Canvas: 1074 x 1464 px. All PNGs align at (0,0).

01_background.png — reconstructed background from approved flattened mockup. IMPORTANT: existing border is still baked into this image; central logo region was reconstructed by inpainting and is an approximation.
02_frame_overlay.png — cropped border from approved mockup, transparent elsewhere. Overlaying on background is optional because border is baked into background.
03_logo.png — user-supplied transparent Fire Emblem Awakening logo, centered on transparent full-size canvas.
04_frame_foil_mask.png — transparent image with opaque white where CSS foil gradient should show.
05_logo_foil_mask.png — transparent image with white alpha matching the logo.
06_light_overlay.png — optional faint static shine, transparent elsewhere.
preview.png — static composition.

Suggested render order: background -> logo -> optional light; foil gradients masked with 04 and 05, rendered over their corresponding layers.

Note: Since the approved design was supplied as a single flattened raster, this is an MVP extraction, not lossless source-layer separation. For truly independent background and frame, redraw/export each from source artwork.
