# Project Context: Thai Wedding Envelope Calculator (ระบบคำนวณค่าซองงานแต่งของคนไทย)

## 1. Core Formula (สมการหลัก)
$$\text{Final Envelope} = \text{Round}_{\text{Auspicious}}\Big( \max\big(H_{\text{min}}, \; \min(B_{\max}, \; C_{\text{target}})\big) \Big)$$

### Sub-formulas:
* **Social Target ($C_{\text{target}}$):** $\big[(V \times N) + R\big] \times S$
* **Monthly Budget Cap per Wedding ($B_{\max}$):** $\frac{I \times (P / 100)}{W}$
* **Historical Reciprocity Floor ($H_{\text{min}}$):** If $H > 0$, then $H + 200$, else $0$.

## 2. Variables (ตัวแปรทั้ง 8 ตัว)
1. **$V$ (Venue Cost):** บ้าน/หอประชุม (400), ร้านอาหาร/สโมสร (600), โรงแรม 3-4 ดาว (1,000), โรงแรม 5 ดาว (1,800)
2. **$N$ (Attendees):** ฝากซอง (0.5), ไปคนเดียว (1.0), ไปเป็นคู่ 2 คน (1.8)
3. **$R$ (Relationship Value):** รู้จัก (0), คุ้นเคย (300), สนิท (1,000), สนิทมาก (2,500) + Slider ปรับละเอียด (0 - 3,500)
4. **$S$ (Seniority Multiplier):** รุ่นน้อง/เพิ่งเริ่มทำงาน (0.8), รุ่นเดียวกัน (1.0), รุ่นพี่อาวุโส/หัวหน้างาน (1.3)
5. **$I$ (Monthly Income):** รายได้สุทธิต่อเดือน (บาท)
6. **$P$ (Social Budget %):** สัดส่วนงบสังคมต่อเดือน (ค่ามาตรฐาน 3% - 5%)
7. **$W$ (Weddings per Month):** จำนวนงานแต่งในเดือนนั้น (ตัวหารกระจายงบ)
8. **$H$ (Historical Gift):** ยอดที่เจ้าภาพเคยใส่ซองให้ในอดีต (บาท)

## 3. Auspicious Rounding Rules (กฎการปัดเศษเลขมงคล)
* **Allowed Set:** `[400, 500, 600, 800, 900, 1000, 1200, 1500, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200, 3600, 3800, 4000, 4600, 5000, 6000, 8000, 10000]`
* **Forbidden Numbers:** ห้ามปัดลงเลขคี่อวมงคล เช่น 700, 1100, 1300, 1700, 1900 (ยกเว้น 500, 900, 1500 ที่อนุโลมตามธรรมเนียมไทย)

## 4. Current Tech Stack
* Single-file HTML5 + Tailwind CSS (CDN) + Vanilla JavaScript.
* Features: Real-time reactive calculation, 3 tier options (ประหยัด / แนะนำ / ใจป้ำ), Banknote breakdown (1,000 / 500 / 100 THB), and Financial Health status indicator.