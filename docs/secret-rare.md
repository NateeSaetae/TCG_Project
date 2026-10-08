# Secret Rare rendering benchmark

## Current artwork: single-image full art

AW-030 now uses `/cards/aether-world-unbound.png`. Change `image` in `src/data/cards.ts` to replace it; put the file beneath `public/` but omit `public` from the URL. The supplied file was found at `public/card/aether-world-unbound.png` and copied to the requested `public/cards/` directory without changing the original.

The optional `imagePosition: '50% 30%'` in the same card record controls cropping. The 1024×1536 portrait uses cover with only 2% overscan and 1px maximum translation per axis, preserving the face, crown and orb. A lower gradient supports text; foil/specular strength is reduced for this bright artwork. Reflections remain above the artwork and card information.

AW-030 intentionally has no `artwork` object while using this flattened image. The multi-layer support described below is retained for future separated images. Add that object when real aligned layers become available; it takes precedence over `image`.

## เปิดหน้า showcase

รัน `npm.cmd run dev` แล้วเปิด **http://127.0.0.1:5173/dev/card-showcase** (หรือ `/#/dev/card-showcase`) ใช้ URL/port ที่ Vite แสดงหากพอร์ต 5173 ไม่ว่าง

หน้าเริ่มด้วย Aether, World Unbound (AW-030) หงายหน้า เลื่อนเมาส์เพื่อดูแสงและ parallax ปุ่ม Top left / Center / Bottom right กับ sliders ใช้ตรึงตำแหน่งแสงเพื่อเทียบภาพ ปุ่ม Live pointer กลับสู่เมาส์ ปุ่ม Replay reveal เล่น sequence เดียวกับซองจริงโดยไม่เพิ่มการ์ดหรือเปลี่ยน localStorage ของ collection เสียงใช้ปุ่มเดิมใน header

หน้าโหลดผ่าน lazy import ภายใต้ `import.meta.env.DEV` และถูกตัดจาก production build การเข้า URL นี้ใน production ไม่เปิด debug page

## ขอบเขตและไฟล์ที่เปลี่ยน

- `src/components/cards/Card.tsx`: dispatch เฉพาะ AW-030 ที่ไม่ hidden ไปยัง SecretRareCard ใบอื่นกับ silhouette ยังคง renderer เดิม
- `src/components/cards/SecretRareCard.tsx`: โครงสร้าง surface, artwork, finish, particles, frame และ text ที่ยกขึ้น 3px
- `src/components/cards/CardFoil.tsx`: แยก micro-etch, rainbow diffraction, specular, glass
- `src/components/cards/secret-rare.css`: effect, responsive integration, reveal และ showcase styles โดยไม่แก้ layout หลัก
- `src/hooks/useCardPointer.ts`: pointer/rAF loop และ CSS variables
- `src/config/cardEffects.ts`: card opt-in, tilt/parallax profile, reveal timings
- `src/types/index.ts`: เพิ่ม optional ArtworkLayers ให้ CardData
- `src/data/cards.ts`: เพิ่ม artwork paths เฉพาะ AW-030
- `public/art/aether/{background,midground,character,foreground}.svg`: แยกภาพ SVG เดิมเป็น 4 ชั้นด้วย viewBox เดียวกัน
- `src/components/pack/SecretRareReveal.tsx`: sequence ที่ใช้ร่วมกันระหว่างซองจริงกับ showcase
- `src/pages/PackOpening.tsx`: เลือก reveal พิเศษเฉพาะการ์ดต้นแบบ การบันทึกซองเดิมไม่เปลี่ยน
- `src/pages/CardShowcase.tsx`: preview, fixed light positions, sliders, replay
- `src/App.tsx`: dev-only lazy route ใช้ header/navigation เดิม
- `src/vite-env.d.ts`: type สำหรับ Vite environment
- `README.md` และคู่มือนี้: วิธีใช้/ต่อยอด
- `package.json`: เพิ่ม render smoke tests เข้า `npm test`
- `tests/card-render.test.mjs`: SSR render smoke checks โดยใช้ Vite/React ที่ติดตั้งอยู่แล้ว

ไม่มี dependency ใหม่ ไม่มีการแก้ rarity probabilities

## Pointer และ physical tilt

วัดกรอบ wrapper ที่อยู่นิ่งด้วย getBoundingClientRect แล้ว normalize X/Y เป็น -1 ถึง +1 clamp ไม่ให้เกินขอบ หลีกเลี่ยงวัด face ที่กำลังเอียง ซึ่งจะทำให้ตำแหน่งวนกลับและสั่น

เก็บ target/current ใน refs ใช้ requestAnimationFrame interpolation 14% ต่อเฟรม เขียน CSS custom properties โดยตรง ไม่มี React setState ใน pointermove loop หยุดเมื่อเข้าใกล้ target และ cancel เมื่อ unmount เมื่อเมาส์ออก interpolates กลับศูนย์ รวมทั้งตำแหน่งแสงและความแรง ไม่ได้คืนแค่ rotation

rotateX = -Y × 7 องศา, rotateY = X × 9 องศา, perspective 1100px, text plane translateZ(3px) พื้นผิวภาพถูก clip ใน inner surface ขณะที่ outer body ใช้ preserve-3d เพื่อรักษาความลึก text ขอบบางและเงาซ้อน 2/4/6px ทำให้เห็นความหนา

## Holographic finish

เป็น CSS optical approximation ไม่ใช่ WebGL shader:

1. micro-etch ใช้ repeating gradients แบบเส้นบาง + soft-light
2. rainbow diffraction ใช้ repeating linear gradient โทน cyan/violet/magenta/gold/blue/green สีลดความสด ผสมด้วย color-dodge และ radial mask
3. pointer เปลี่ยน gradient angle, background-position, mask center และ opacity โดยความแรงสัมพันธ์กับระยะ tilt
4. specular สีขาวเป็น radial gradient อีกชั้นเหนือ rainbow ติดตามตำแหน่งเมาส์ในทิศทางเดียวกัน
5. glass reflection เป็นแถบแสงจาง และ frame เป็น masked gradient ที่เปลี่ยนมุมตาม tilt ทำให้ขอบด้านรับแสงสว่างกว่าอีกด้าน

ไม่มี rainbow animation ที่ไหลตลอดเวลา เมื่ออยู่นิ่ง finish จาง การเคลื่อนเมาส์เป็นตัวเปลี่ยนแสง Text อยู่เหนือ finish พร้อม vignette ด้านล่างให้อ่านได้

## Parallax และภาพใหม่

ทุก layer ใช้ canvas/viewBox 600×800 ตรงกัน พร้อมขยายพื้นที่ภาพ 110% กันขอบโผล่เมื่อเคลื่อน ระยะสูงสุด background 2px, midground 4px, character 7px, foreground 10px ต่อแกน อนุภาค 12 จุดใช้ foreground offset เดียวกันและเพิ่ม opacity เมื่อ hover

เปลี่ยน path ของ AW-030 ใน cards.ts:

```ts
artwork: {
  background: '/art/aether/background.webp',
  midground: '/art/aether/midground.webp',
  character: '/art/aether/character.webp',
  foreground: '/art/aether/foreground.webp',
},
```

วางไฟล์ใน public/art/aether ใช้ขนาดภาพ/ตำแหน่งร่วมกัน background ควรเต็มภาพ ส่วน midground/character/foreground ใช้ WebP/PNG ที่มี alpha อย่า crop แต่ละ layer ชิดวัตถุ เพราะจะเสีย alignment midground และ foreground เป็น optional ถ้าไม่มี artwork object จะ fallback ไป card.image

## Reveal และ reduced motion

idle → charging 1000ms → flipping 600ms → settling 1000ms → ready รวม 2.6 วินาที charging มีแสงขอบและประกายจาง flip แบบสองหน้าด้วย backface-visibility เมื่อเปิดแล้วมี flash ครั้งเดียวภายในบริเวณการ์ดและค่อยยกเข้าใกล้ผู้ชม ระหว่างทำงานปิดปุ่มกันคลิกซ้ำ หลัง ready กลับมา tilt ได้และคลิกไปใบถัดไป

ใช้ effect timeout ทีละช่วงและ cleanup เมื่อ unmount/replay/ข้ามไปผลลัพธ์ Sound เดิมไม่มี background music จึงไม่เพิ่มระบบเสียงพื้นหลัง เล่น chime เดิมเฉพาะตอนเปิดหน้าการ์ดและเมื่อผู้ใช้เปิดเสียง

prefers-reduced-motion ปิด tilt/parallax/particles/flash ลด foil และจบ reveal ทันที หากเปลี่ยน preference ระหว่าง animation ก็จบอย่างปลอดภัย Touch ไม่เปิด pointer tilt เพื่อไม่รบกวนการเลื่อนหน้า ยังใช้ showcase sliders เพื่อสำรวจแสงได้

## ต่อ Ultra Rare / Super Rare ในอนาคต

ปัจจุบัน isShowcaseCard opt-in เฉพาะ AW-030 สามารถเปลี่ยนเป็น resolver ที่คืน effect profile ต่อ card/rarity แล้วให้ renderer รับ profile ลดแรง tilt/foil และปิด parallax/particles ตาม tier CardFoil กับ useCardPointer แยกไว้ให้ reuse ไม่จำเป็นต้องเพิ่ม Three.js และไม่ควรเปิดเอฟเฟกต์หนักกับทุกใบใน collection โดยอัตโนมัติ

## การตรวจสอบ

- `npm.cmd run build`: TypeScript และ production bundling
- `npm.cmd test`: สุ่ม 10,000 ซองและ invariants
- `node --test tests/card-render.test.mjs`: render smoke checks สำหรับทุก card, silhouette, reveal, showcase และ asset paths
- ตรวจ manual ใน browser: hover ทุกมุม/ออกขอบ, fixed positions, replay ซ้ำ/ข้ามระหว่าง animation, mobile scrolling, reduced motion, เปิด Secret Rare จริง และกลับ collection

Render smoke checks ไม่ทดแทนการตรวจ browser interaction หรือวัด FPS เป้าหมายคือ 60 FPS แต่ต้องวัดบนอุปกรณ์จริงก่อนสรุป

## Physical front/back prototype

The shared back is `public/cards/card-back.png` (copied from the supplied `public/card/card-back.png`). Its URL is configured in `src/components/cards/TwoSidedCard.tsx` as `CARD_BACK_IMAGE`. It uses cover/center with a 1.09 scale and 1.5% downward offset to trim the dark margin embedded in the prototype PNG. This fills the card without stretching the artwork. Adjust these values in `src/components/cards/two-sided-card.css` when replacing the back image.

Use `<Card card={card} face="back" />` or `face="front"` for the reusable two-sided object. Omit face for existing front-only collection/hero displays. TwoSidedCard owns the stationary pointer target, common perspective, tilt plane and rotateY flip plane. Both faces share dimensions/radius and backface-visibility. The existing front renderer runs with its local pointer tracking disabled so only one tilt is applied; its lighting and parallax inherit the shared CSS properties. The reverse has only a soft neutral pointer reflection and no rarity finish.

Normal reveal: 180ms anticipation + 600ms flip. Secret Rare keeps its 1000ms anticipation + 600ms flip + 1000ms settling. Front effects remain off while the back is showing or the flip is in progress. Timers clean up on unmount/skip and reduced motion finishes without an animated rotation. Repeated showcase flips reset the completion gate, preventing an early foil flash.

The showcase now provides Show Front, Show Back, Flip Card and Replay reveal, alongside the existing lighting controls. The artwork on the front is unchanged.

Tests cover both face markup, the common back across all rarities, front effect gating, initial normal/Secret Rare pack faces and showcase controls. Browser timing, pointer motion and visual smoothness still require an interactive browser check; SSR tests cannot measure those.
