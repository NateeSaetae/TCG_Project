# Fire Emblem TCG — The Hero Collection

โปรเจกต์แฟนเมดสำหรับเปิดซองและสะสมการ์ดตัวละครบนเครื่องตัวเอง สร้างด้วย React, TypeScript และ Vite ไม่มี backend หรือระบบเงินจริง

## เริ่มใช้งาน

```sh
npm install
npm run dev
```

บน Windows PowerShell หาก `npm` ถูกบล็อก ให้ใช้ `npm.cmd` แทน

```sh
npm run build
npm test
```

## โครงสร้างหลัก

- `src/data/characters/<name>/<name>.ts` — ข้อมูลการ์ดและ path รูปของตัวละคร
- `src/data/characters/<name>/<name>Gameplay.ts` — ข้อมูลต่อสู้ของตัวละคร (เมื่อพร้อมใช้งาน)
- `src/data/characters/index.ts` — ลงทะเบียนชุดตัวละครที่พร้อมใช้งาน
- `src/data/catalog.ts` — รายการการ์ดสำหรับคลังและค้นด้วย ID
- `src/types/heroCard.ts` — รูปแบบข้อมูล HeroCard
- `src/components/cards/CardRenderer.tsx` — เลือก layout ตาม rarity
- `src/components/cards/HeroCardLayout.tsx` และ `SecretHeroCard.tsx` — หน้าการ์ด
- `src/utils/packGenerator.ts` — สุ่มการ์ด 5 ใบต่อซอง โดยมี Rare ขึ้นไปอย่างน้อยหนึ่งใบ
- `src/hooks/useCollection.ts` — บันทึกคลังไว้ใน localStorage
- `src/pages/` — Home, PackOpening และ Collection
- `src/combat/engine.ts` — ฐานคำนวณการต่อสู้แบบไม่พึ่ง React; ดู [docs/combat-foundation.md](docs/combat-foundation.md)
- `public/art/aether/heroes/<name>/` — รูปตัวละคร พื้นหลัง และ effect แยกโฟลเดอร์

ตอนนี้ลงทะเบียน Marth 6 ใบ (`FE-001`–`FE-006`), Roy C/U/R/SR/UR (`FE-007`–`FE-011`), Hector C/U/R/SR/UR (`FE-012`–`FE-016`), Ephraim C/U/R/SR/UR (`FE-018`–`FE-022`), Lilina C/U/R/SR/UR (`FE-023`–`FE-027`) และ Lyn C/U/R/SR/UR (`FE-028`–`FE-032`) แล้ว Cost/Power ของตัวละครที่เพิ่มหลัง Roy ยังเป็นค่าชั่วคราว ส่วน SER ของ Roy, Hector, Ephraim, Lilina และ Lyn ยังไม่เข้าซองหรือคลังจนกว่าภาพและข้อมูลหน้าการ์ดจะพร้อม

ดูขั้นตอนเพิ่มตัวละครใน [docs/adding-character.md](docs/adding-character.md)

ระหว่างพัฒนา เปิด `/dev/heroes` หรือ `/#/dev/heroes` เพื่อดูการ์ดของทุกตัวละครที่ลงทะเบียนไว้ในหน้า preview เดียวกัน

## การเปิดซองและข้อมูลที่บันทึก

ซองมี 5 ใบและรับประกัน Rare ขึ้นไปอย่างน้อยหนึ่งใบ การ์ดซ้ำเกิดได้ ระหว่างพัฒนา หน้า Open Packs มี `Test pull` สำหรับเลือกใบหรือ rarity ที่ต้องการทดสอบ

ข้อมูลคลังเก็บใน localStorage ด้วย key `aetherveil-save-v1` โดยอ่านเฉพาะ ID ที่ลงทะเบียนอยู่ใน catalog ปัจจุบัน การ์ดชุด AW เดิมจึงไม่แสดงในคลังและไม่ถูกสุ่มอีก

โปรเจกต์นี้ไม่เกี่ยวข้องกับ Nintendo หรือ Intelligent Systems
