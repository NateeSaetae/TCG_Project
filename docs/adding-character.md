# เพิ่มตัวละครใหม่

โครงสร้างนี้แยก **ข้อมูลและภาพของตัวละคร** ออกจาก **ตัววาดการ์ดและ CSS ตาม rarity** ดังนั้นไม่ต้องสร้าง component หรือ CSS ชุดใหม่สำหรับตัวละครแต่ละตัว

```text
src/data/characters/
  marth/
    marth.ts               ข้อมูลการ์ด Marth ทุกระดับ
    marthGameplay.ts       ข้อมูลต่อสู้ของ Marth
  roy/
    roy.ts                 ข้อมูลการ์ด Roy
  <character>/
    <character>.ts         ข้อมูลการ์ดของตัวละครใหม่ทุกระดับ
    <character>Gameplay.ts  ข้อมูลต่อสู้ (เพิ่มเมื่อพร้อม)
  index.ts                 ลงทะเบียนชุดการ์ดที่จะอยู่ในซองและคลัง

public/art/aether/heroes/
  marth/
    characters/            ภาพตัวละคร
    backgrounds/           ภาพฉาก
    effects/               เอฟเฟกต์เฉพาะตัวละคร
  <character>/             ใช้โครงสร้างเดียวกัน
```

1. ใส่ภาพของตัวละครใหม่ใน `public/art/aether/heroes/<character>/` ตามชนิดภาพ ไฟล์ที่ใช้ร่วมกันทุกตัวละคร เช่นกรอบการ์ดและ foil mask ยังอยู่ใน `public/art/aether/frames/` และ `public/art/aether/effects/`
2. สร้าง `src/data/characters/<character>/<character>.ts` โดยใช้ `HeroCardData` จาก `src/types/heroCard.ts` กำหนด ID, rarity, cost, power, ข้อความ และ path ภาพของแต่ละใบตามข้อมูลที่อนุมัติแล้ว รวมใบที่ต้องการเปิดจากซองเป็น array แล้ว export ออกมา ไม่จำเป็นต้องมีครบทุก rarity หากมีข้อมูลต่อสู้ให้เพิ่ม `<character>Gameplay.ts` ในโฟลเดอร์เดียวกัน
3. Import array นั้นใน `src/data/characters/index.ts` และเพิ่มเข้า `characterSets` เพียงจุดเดียว จากนั้น `heroCards` จะถูกใช้โดยระบบสุ่มซอง คลังการ์ด และตัวเลือกทดสอบการเปิดซอง ชุดการ์ดรวมต้องมีอย่างน้อยหนึ่งใบระดับ Rare ขึ้นไปตามกติกาซองปัจจุบัน
4. ใช้ ID ที่ไม่ซ้ำและอย่าเปลี่ยน ID ของการ์ดที่เผยแพร่แล้ว เพราะคลังที่บันทึกใน browser อ้างอิงการ์ดด้วย ID
5. รัน `npm.cmd test` และ `npm.cmd run build` เพื่อตรวจข้อมูล การแสดงการ์ด และ path ภาพ

During development, use /dev/heroes to preview every card registered in src/data/characters/index.ts. No character-specific preview page is required.
