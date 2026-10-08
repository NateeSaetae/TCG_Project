# Fire Emblem TCG — The Hero Collection

โปรเจกต์แฟนเมดจำลองเปิดซองสะสมการ์ดสำหรับเล่นในเครื่อง ธีมราชสำนักแฟนตาซี โดยยังใช้การ์ดต้นฉบับเดิมเป็นข้อมูล prototype สร้างด้วย React, TypeScript, Vite, Tailwind CSS และ Framer Motion ไม่มี backend, บัญชีผู้ใช้ หรือเงินจริง

## เริ่มใช้งาน

ต้องมี Node.js 20.19+ หรือ 22.12+ (แนะนำ Node 24)

```sh
npm install
npm run dev
```

เปิด URL ที่ Vite แสดง (ปกติ http://127.0.0.1:5173)

- `npm run build` ตรวจ TypeScript และสร้าง production bundle ใน `dist/`
- `npm run preview` เปิดดู production build
- `npm test` ทดสอบระบบสุ่ม 10,000 ซอง รวมกรณีขอบเขต

## วิธีเล่น

Home → Open Packs → คลิกหรือปัดซอง → คลิกการ์ดเพื่อพลิก → คลิกอีกครั้งเพื่อไปใบถัดไป → ผลลัพธ์

เปิดได้ฟรีไม่จำกัด ซองละ 5 ใบ มี Rare ขึ้นไปอย่างน้อยหนึ่งใบ การ์ดสะสมอัตโนมัติตั้งแต่เริ่มเปิดซอง ปุ่ม Reveal all ข้ามไปผลลัพธ์ได้ เปิดเสียงสังเคราะห์ด้วยปุ่ม ♪ ในแถบบน (เริ่มต้นปิดเสียง)

Collection ค้นหาชื่อ กรองระดับความหายาก ธาตุ ประเภท และการ์ดที่มี เรียงเลขหรือ rarity ได้ คลิกการ์ดเพื่อดูรายละเอียด การ์ดที่ยังไม่ได้จะถูกซ่อนภาพและเรื่องราว

## โครงสร้าง

- `src/App.tsx` เมนูและ hash routing แบบเบา รองรับ back/forward โดยไม่ต้องติดตั้ง router
- `src/pages/` Home, PackOpening และ Collection
- `src/components/cards/Card.tsx` กรอบการ์ด สถิติ tilt และ foil
- `src/components/pack/BoosterPack.tsx` ซองการ์ด
- `src/types/index.ts` โมเดล CardData และ SaveData
- `src/data/cards.ts` ข้อมูลการ์ด 30 ใบ
- `src/config/rarity.ts` rarity, น้ำหนัก, สี และจำนวนการ์ดต่อซอง
- `src/utils/packGenerator.ts` ระบบสุ่ม แยกจาก UI และใส่ RNG สำหรับทดสอบได้
- `src/hooks/useCollection.ts` โหลด ตรวจสอบ และบันทึก localStorage
- `src/utils/sound.ts` เสียงสังเคราะห์ผ่าน Web Audio ไม่ต้องดาวน์โหลดไฟล์เสียง
- `src/styles.css` ธีม responsive, rarity finishes, reduced motion
- `public/art/` ภาพ SVG placeholder ต้นฉบับครบ 30 ใบ ใช้ภาษาภาพร่วมกันและแตกต่างด้วยสี/รายละเอียด

## ความน่าจะเป็น

น้ำหนักเริ่มต้น Common 55, Uncommon 25, Rare 12, Super Rare 5, Ultra Rare 2.5, Secret Rare 0.5 แก้ได้ใน `rarityWeights`

แต่ละช่องสุ่ม rarity ตามน้ำหนัก แล้วสุ่มการ์ดแบบเท่ากันภายใน rarity นั้น โดยตัดใบที่อยู่ในซองแล้วออก หากสี่ใบแรกไม่มี Rare+ ช่องสุดท้ายจะสุ่มเฉพาะ Rare, Super Rare, Ultra Rare และ Secret Rare โดยปรับน้ำหนักให้รวมเป็น 100% ในกลุ่มนั้น หาก rarity ใดไม่มีใบเหลือจะถูกตัดออกจากการสุ่ม

ดังนั้นเปอร์เซ็นต์ที่แสดงเป็นน้ำหนักพื้นฐาน ไม่ใช่อัตรารวมสุดท้ายทั้งซอง การรับประกันและการไม่ซ้ำทำให้อัตราที่สังเกตได้เปลี่ยนไป ซองเรียง rarity ต่ำไปสูงเพื่อให้การเปิดไต่ระดับความตื่นเต้น

เพิ่มน้ำหนักเป็นเลขบวก ตั้ง 0 เพื่อปิด rarity ได้ แต่ต้องเหลือการ์ดที่สุ่มได้อย่างน้อย 5 ใบและมี Rare+ สำหรับการรับประกัน มิฉะนั้น generator จะรายงานข้อผิดพลาด

## เพิ่มการ์ด / เปลี่ยนภาพ

เพิ่ม object ตาม CardData ใน `src/data/cards.ts` โดยใช้ id และ cardNumber ไม่ซ้ำ ใส่ชื่อ character, rarity, element, cardType, cost, attack, defense, description, image, set ครบทุกช่อง

แทนที่ `image` เช่น `/art/my-character.webp` แล้ววางไฟล์ใน `public/art/` แนะนำภาพแนวตั้งอัตราส่วน 3:4 ขึ้นไป ระบบใช้ object-fit cover จึงไม่บิดภาพ หากเพิ่มจำนวนเกิน 30 ให้ปรับจำนวนชุดที่แสดงใน Home, Collection และ Card footer ด้วย

## งานภาพและประสิทธิภาพ

CSS perspective และ rotateX/Y ทำให้การ์ดเอียงตามเมาส์ radial highlight ตามตำแหน่ง cursor Common/Uncommon ใช้กรอบเรียบ Rare ใช้สีโลหะ Super Rare ขึ้นไปเพิ่ม animated foil และ Secret Rare ใช้กรอบพิเศษพร้อม holographic layer ภาพเต็มพื้นที่ การเปิดระดับสูงมีแสงและประกายมากขึ้น

ใช้ Framer Motion สำหรับ entrance, reveal และ drag ส่วน CSS ใช้ทำ foil, แสง, ฉีกซอง ไม่ใช้ Three.js เพราะยังไม่ต้องใช้ฉาก 3D จริง ภาพโหลดแบบ lazy, touch ไม่ใช้ hover tilt และเคารพ prefers-reduced-motion

## การบันทึก

localStorage key: `aetherveil-save-v1` เก็บจำนวนการ์ด จำนวนซอง เสียง และรายการซองที่ยังดูไม่จบ บันทึกเมื่อเริ่มเปิดจึงไม่เพิ่มการ์ดซ้ำเมื่อกลับมาดูซองเดิม หากรีเฟรชระหว่างเปิด ให้เข้า Open Packs เพื่อดูซองเดิมต่อ (เริ่มดูใหม่ตั้งแต่ใบแรก)

ข้อมูลอยู่เฉพาะ browser และ origin นี้ การล้างข้อมูล browser หรือเปลี่ยนพอร์ต/hostname ทำให้เห็นคลังใหม่ เล่นทีละแท็บเพื่อหลีกเลี่ยงการเขียนทับข้อมูลระหว่างแท็บ หาก storage ใช้ไม่ได้จะแจ้งเตือนและเล่นต่อได้เฉพาะ session ปัจจุบัน

## ขอบเขต V1

เน้นเปิดซองและสะสม ยังไม่มีระบบต่อสู้ การซื้อขาย หรือเศรษฐกิจ ภาพเป็น SVG placeholder ไม่ใช่ภาพตัวละครสำเร็จรูปจากแฟรนไชส์อื่น

### Windows PowerShell

หากเครื่องบล็อก npm.ps1 ให้ใช้ `npm.cmd install`, `npm.cmd run dev`, `npm.cmd run build` และ `npm.cmd test` แทน โดยไม่ต้องเปลี่ยน Execution Policy

## Secret Rare showcase

เปิด `http://127.0.0.1:5173/dev/card-showcase` ขณะรัน dev server เพื่อทดลอง Aether, World Unbound: pointer tilt, foil, parallax และ replay reveal โดยไม่เปลี่ยนคลังสะสม ดูไฟล์ที่แก้ หลักการ render และการเปลี่ยนภาพใน [คู่มือ Secret Rare](docs/secret-rare.md)

## Fire Emblem website theme

สีและฟอนต์อยู่ใน `src/theme/tokens.css`, UI อยู่ใน `src/theme/royal.css`, ชื่อและ path ภาพตกแต่งอยู่ใน `src/config/brand.ts` ดู [รายละเอียด rebrand, placeholder และผลตรวจสอบ](docs/fire-emblem-theme.md)
