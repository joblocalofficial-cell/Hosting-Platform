# JobLocal - ระบบจับคู่งานปทุมธานี

ระบบจับคู่งานออนไลน์สำหรับผู้หางานและนายจ้างในจังหวัดปทุมธานี ผ่าน LINE LIFF

---

## 📁 โครงสร้างโปรเจค

```
Hosting-Platform/
├── jobseeker.html          # ฟอร์มสำหรับผู้หางาน
├── employee.html           # ฟอร์มสำหรับนายจ้าง
├── 

---

##  ฟีเจอร์หลัก

### ฟอร์มผู้หางาน (jobseeker.html)
- ✅ เชื่อมต่อ LINE LIFF เพื่อดึงข้อมูลผู้ใช้
- ✅ ยินยอม PDPA
- ✅ กรอกข้อมูลส่วนตัว (ชื่อ, อายุ, เบอร์, การศึกษา, อำเภอ)
- ✅ บันทึกประสบการณ์และทักษะ
- ✅ ระบุงานที่ต้องการและความพร้อม
- ✅ ส่งข้อมูลไปยัง Google Sheets

### ฟอร์มนายจ้าง (employee.html)
- ✅ เชื่อมต่อ LINE LIFF เพื่อดึงข้อมูลผู้ใช้
- ✅ ยินยอม PDPA
- ✅ กรอกข้อมูลบริษัท/ผู้ว่าจ้าง
- ✅ ประกาศงาน (ตำแหน่ง, สถานที่, เงินเดือน)
- ✅ ดูประวัติการประกาศงาน
- ✅ แชร์ประกาศงานผ่าน LINE
- ✅ ส่งข้อมูลไปยัง Google Sheets

### Backend (Code.gs)
- ✅ รองรับ POST request สำหรับบันทึกข้อมูล
- ✅ รองรับ GET request สำหรับดึงประวัติ
- ✅ สร้าง Google Sheets อัตโนมัติ
- ✅ แยก Sheet เป็น "ผู้หางาน" และ "นายจ้าง"
- ✅ จัดการข้อมูลและ validation

---

##  การติดตั้งและใช้งาน

### 1. ติดตั้ง Backend (Google Apps Script)
📖 **อ่านคู่มือการติดตั้งแบบละเอียดได้ที่:** [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md)

**สรุปขั้นตอน:**
1. สร้าง Google Sheets ใหม่
2. สร้าง Google Apps Script Project
3. คัดลอกโค้ดจาก `Code.gs` และแก้ไข `SPREADSHEET_ID`
4. Deploy เป็น Web App (Anyone access)
5. คัดลอก Deployment URL

### 2. ตั้งค่าไฟล์ HTML

#### `jobseeker.html` (บรรทัดที่ 210-211):
```javascript
const GAS_ENDPOINT = "YOUR_DEPLOYMENT_URL_HERE";
const LIFF_ID = "YOUR_LIFF_ID_HERE";
```

#### `employee.html` (บรรทัดที่ 235-236):
```javascript
const GAS_ENDPOINT = "YOUR_DEPLOYMENT_URL_HERE";
const LIFF_ID = "YOUR_LIFF_ID_HERE";
```

### 3. Deploy ไฟล์ HTML
- อัปโหลดไปยัง Web Hosting (GitHub Pages, Netlify, Vercel, etc.)
- หรือใช้ผ่าน LIFF Endpoint URL

### 4. ตั้งค่า LINE LIFF
1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง LIFF App
3. ตั้งค่า Endpoint URL ให้ชี้ไปยังไฟล์ HTML ที่ deploy แล้ว
4. คัดลอก LIFF ID มาใส่ในไฟล์ HTML

---

## 🔧 การทำงานของระบบ

```
┌──────────────┐
│  LINE User   │
│   (Mobile)   │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│   LIFF App       │
│ jobseeker.html   │
│ employee.html    │
└──────┬───────────┘
       │
       │ POST Request
       ▼
┌────────────────────┐
│ Google Apps Script │
│    Code.gs         │
└──────┬─────────────┘
       │
       ▼
┌────────────────┐
│ Google Sheets  │
│  - ผู้หางาน    │
│  - นายจ้าง      │
└────────────────┘
```

---

## 📊 โครงสร้างข้อมูลใน Google Sheets

### Sheet: ผู้หางาน
| วันที่-เวลา | LINE User ID | Display Name | ชื่อ-นามสกุล | อายุ | เบอร์ | ... |
|-------------|--------------|--------------|-------------|------|-------|-----|

### Sheet: นายจ้าง
| วันที่-เวลา | สถานะ | LINE User ID | Display Name | ชื่อบริษัท | ตำแหน่ง | ค่าจ้าง | ... |
|-------------|--------|--------------|--------------|------------|---------|---------|-----|

---

##  ความปลอดภัย

- ✅ ใช้ HTTPS สำหรับการส่งข้อมูล
- ✅ ยินยอม PDPA ก่อนเก็บข้อมูล
- ✅ ตรวจสอบ LINE User ID ผ่าน LIFF
- ✅ ไม่เก็บรหัสผ่านหรือข้อมูลที่ละเอียดอ่อน

---

##  การอัปเดตโค้ด

### อัปเดต Backend (Code.gs):
1. แก้ไขโค้ดใน Apps Script Editor
2. Save
3. Deploy → Manage deployments → Edit → New version
4. URL ยังคงเหมือนเดิม

### อัปเดต Frontend (HTML):
1. แก้ไขไฟล์ HTML
2. อัปโหลดใหม่ไปยัง Hosting
3. LIFF Endpoint URL ยังคงเหมือนเดิม

---

##  การแก้ปัญหา

### ปัญหา: ส่งข้อมูลไม่สำเร็จ
- ✅ ตรวจสอบ `GAS_ENDPOINT` ว่าถูกต้อง
- ✅ ตรวจสอบ Apps Script deployment ตั้งค่าเป็น "Anyone"
- ✅ ดู Console (F12) เพื่อดู error messages
- ✅ ดู Executions ใน Apps Script Editor

### ปัญหา: LIFF ไม่ทำงาน
- ✅ ตรวจสอบ `LIFF_ID` ว่าถูกต้อง
- ✅ ตรวจสอบ Endpoint URL ใน LINE Developers
- ✅ ตรวจสอบว่าเปิดใน LINE App

### ปัญหา: ข้อมูลไม่เข้า Sheet
- ✅ ตรวจสอบ `SPREADSHEET_ID` ในไฟล์ `Code.gs`
- ✅ รันฟังก์ชัน `testSetup` เพื่อสร้าง Sheets
- ✅ ดู Logs ใน Apps Script

---

##  Browser Support

- ✅ Chrome (Desktop & Mobile)
- ✅ Safari (iOS)
- ✅ LINE In-App Browser
- ✅ Edge
- ⚠️ Firefox (อาจมีปัญหา LIFF)

---

## 📄 License

ใช้งานได้ฟรี แก้ไขได้ตามต้องการ

---

## 👥 ผู้พัฒนา

พัฒนาโดย JobLocal Team
สำหรับจังหวัดปทุมธานี

---

## 📞 ติดต่อสอบถาม

หากมีปัญหาหรือข้อสงสัย:
1. ตรวจสอบ [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md)
2. ดู Console และ Logs
3. ติดต่อทีมพัฒนา

---

**สร้างด้วย ❤️ เพื่อชุมชนปทุมธานี**
