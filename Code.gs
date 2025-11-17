/**
 * JobLocal - Google Apps Script Backend
 * รองรับทั้ง jobseeker และ employer forms
 * เชื่อมต่อกับ Google Sheets
 */

// ⚠️ กรุณาแก้ไข SPREADSHEET_ID ให้ตรงกับ Google Sheets ของคุณ
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";  // เช่น "1AbC_dEfGhIjKlMnOpQrStUvWxYz"

// ชื่อ Sheets
const SHEETS = {
  JOBSEEKER: "ผู้หางาน",
  EMPLOYER: "นายจ้าง"
};

/**
 * doGet - รองรับ GET request สำหรับดึงประวัติ
 */
function doGet(e) {
  try {
    const type = e.parameter.type;
    const userId = e.parameter.userId;

    if (type === "employer" && userId) {
      const history = getEmployerHistory(userId);
      return ContentService.createTextOutput(JSON.stringify(history))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: "Invalid GET request"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("❌ doGet Error: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * doPost - รองรับ POST request สำหรับบันทึกข้อมูล
 */
function doPost(e) {
  try {
    Logger.log("=== POST Request Received ===");

    const payload = JSON.parse(e.postData.contents);
    Logger.log("Payload type: " + payload.type);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (payload.type === "jobseeker") {
      saveJobseeker(ss, payload);
    } else if (payload.type === "employer") {
      saveEmployer(ss, payload);
    } else {
      throw new Error("Invalid type: " + payload.type);
    }

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      message: "บันทึกข้อมูลสำเร็จ"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("❌ doPost Error: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * บันทึกข้อมูลผู้หางาน
 */
function saveJobseeker(ss, payload) {
  let sheet = ss.getSheetByName(SHEETS.JOBSEEKER);

  // สร้าง Sheet ถ้ายังไม่มี
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.JOBSEEKER);
    sheet.appendRow([
      "วันที่-เวลาส่งฟอร์ม",
      "LINE User ID",
      "LINE Display Name",
      "LINE Picture URL",
      "PDPA Consent",
      "ชื่อ-นามสกุล",
      "อายุ",
      "เบอร์โทรศัพท์",
      "อีเมล",
      "ระดับการศึกษา",
      "อำเภอที่อยู่",
      "ประสบการณ์ทำงาน",
      "ทักษะ",
      "งานที่ต้องการ",
      "ความพร้อมในการทำงาน",
      "รูปแบบงาน",
      "คำอธิบายเพิ่มเติม"
    ]);

    // จัดรูปแบบ header
    const headerRange = sheet.getRange(1, 1, 1, 17);
    headerRange.setBackground("#17a2b8");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  const data = payload.data;
  const profile = payload.profile;
  const timestamp = new Date();

  sheet.appendRow([
    timestamp,
    profile.userId,
    profile.displayName,
    profile.pictureUrl,
    data.pdpa_consent,
    data.full_name,
    data.age,
    data.phone,
    data.email,
    data.education,
    data.district,
    data.work_experience,
    data.skills,
    data.desired_job,
    data.availability,
    data.work_type,
    data.description_note
  ]);

  Logger.log("✅ Jobseeker saved: " + profile.displayName);
}

/**
 * บันทึกข้อมูลนายจ้าง
 */
function saveEmployer(ss, payload) {
  let sheet = ss.getSheetByName(SHEETS.EMPLOYER);

  // สร้าง Sheet ถ้ายังไม่มี
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.EMPLOYER);
    sheet.appendRow([
      "วันที่-เวลาส่งฟอร์ม",
      "สถานะ",
      "LINE User ID",
      "LINE Display Name",
      "LINE Picture URL",
      "PDPA Consent",
      "ประเภทผู้ว่าจ้าง",
      "ชื่อบริษัท/บุคคล",
      "ชื่อผู้ติดต่อ",
      "เบอร์โทรศัพท์",
      "ตำแหน่งงาน",
      "ประเภทงาน",
      "รายละเอียดงาน",
      "สถานที่ทำงาน",
      "อำเภอ",
      "จำนวนคนที่ต้องการ",
      "รูปแบบค่าจ้าง",
      "เหมาจ้างกี่วัน",
      "จำนวนค่าจ้าง (บาท)",
      "วันที่เริ่มงาน",
      "เวลาเริ่มงาน",
      "LINE ID ผู้ติดต่อ"
    ]);

    // จัดรูปแบบ header
    const headerRange = sheet.getRange(1, 1, 1, 22);
    headerRange.setBackground("#00b900");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  const data = payload.data;
  const profile = payload.profile;
  const timestamp = new Date();

  sheet.appendRow([
    timestamp,
    "เปิดรับสมัคร",  // สถานะเริ่มต้น
    profile.userId,
    profile.displayName,
    profile.pictureUrl,
    data.pdpa_consent,
    data.user_type,
    data.company_or_org,
    data.contact_person,
    data.contact_phone,
    data.job_title,
    data.job_category,
    data.job_description,
    data.location_area,
    data.district,
    data.headcount,
    data.wage_type,
    data.lump_sum_days,
    data.wage_amount,
    data.start_date,
    data.start_time,
    data.contact_line_id
  ]);

  Logger.log("✅ Employer saved: " + profile.displayName);
}

/**
 * ดึงประวัติการส่งฟอร์มของนายจ้าง
 */
function getEmployerHistory(userId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.EMPLOYER);

    if (!sheet) {
      return {
        hasSubmitted: false,
        latestSubmission: null
      };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // หา index ของคอลัมน์ User ID
    const userIdIndex = headers.indexOf("LINE User ID");

    if (userIdIndex === -1) {
      return {
        hasSubmitted: false,
        latestSubmission: null
      };
    }

    // ค้นหาแถวล่าสุดของ user นี้
    let latestRow = null;
    for (let i = data.length - 1; i > 0; i--) {  // วนจากล่างขึ้นบน
      if (data[i][userIdIndex] === userId) {
        latestRow = data[i];
        break;
      }
    }

    if (!latestRow) {
      return {
        hasSubmitted: false,
        latestSubmission: null
      };
    }

    // แปลง array เป็น object
    const submission = {};
    headers.forEach((header, index) => {
      submission[header] = latestRow[index];
    });

    return {
      hasSubmitted: true,
      latestSubmission: submission
    };

  } catch (error) {
    Logger.log("❌ getEmployerHistory Error: " + error.toString());
    return {
      hasSubmitted: false,
      latestSubmission: null,
      error: error.toString()
    };
  }
}

/**
 * ฟังก์ชันทดสอบ - สามารถรันเพื่อทดสอบการสร้าง Sheet
 */
function testSetup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // สร้าง Sheet ทั้งสองถ้ายังไม่มี
  const testPayloadJobseeker = {
    type: "jobseeker",
    profile: {
      userId: "TEST_USER_ID",
      displayName: "Test User",
      pictureUrl: ""
    },
    data: {
      pdpa_consent: "on",
      full_name: "ทดสอบ ระบบ",
      age: "25",
      phone: "0812345678",
      email: "test@example.com",
      education: "ปริญญาตรี",
      district: "เมืองปทุมธานี",
      work_experience: "1-3 ปี",
      skills: "ทดสอบระบบ",
      desired_job: "งานออฟฟิศ",
      availability: "เริ่มงานได้ทันที",
      work_type: "งานประจำ",
      description_note: "ทดสอบระบบ"
    }
  };

  saveJobseeker(ss, testPayloadJobseeker);
  Logger.log("✅ Test Jobseeker sheet created");

  const testPayloadEmployer = {
    type: "employer",
    profile: {
      userId: "TEST_EMPLOYER_ID",
      displayName: "Test Employer",
      pictureUrl: ""
    },
    data: {
      pdpa_consent: "ยอมรับ",
      user_type: "บริษัท / องค์กร",
      company_or_org: "บริษัททดสอบ",
      contact_person: "คุณทดสอบ",
      contact_phone: "0812345678",
      job_title: "พนักงานทดสอบ",
      job_category: "งานออฟฟิศ",
      job_description: "ทดสอบระบบ",
      location_area: "สำนักงานใหญ่",
      district: "เมืองปทุมธานี",
      headcount: "1",
      wage_type: "เดือนละ",
      lump_sum_days: "",
      wage_amount: "15000",
      start_date: "2024-01-01",
      start_time: "09:00",
      contact_line_id: "@test"
    }
  };

  saveEmployer(ss, testPayloadEmployer);
  Logger.log("✅ Test Employer sheet created");
}
