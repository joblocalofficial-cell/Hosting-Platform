/**
 * Notification.gs - LINE Notification System
 * Version: 3.1.0
 * ส่งการแจ้งเตือนผ่าน LINE Messaging API
 */

// ==================== LINE Messaging API Configuration ====================
const LINE_MESSAGING_API = {
  CHANNEL_ACCESS_TOKEN: "YOUR_CHANNEL_ACCESS_TOKEN_HERE", // ⚠️ ใส่ Channel Access Token ของคุณ
  ENDPOINT: "https://api.line.me/v2/bot/message/push"
};

/**
 * ส่งข้อความยืนยันให้ผู้หางานหลังส่งฟอร์มสำเร็จ
 */
function sendJobSeekerConfirmation(userId, data) {
  try {
    const message = {
      type: "text",
      text: `✅ ลงทะเบียนผู้หางานสำเร็จ!\n\n` +
            `สวัสดีคุณ ${data.full_name}\n` +
            `อายุ: ${data.age} ปี\n` +
            `งานที่ต้องการ: ${data.desired_job}\n` +
            `พื้นที่: ${data.district}\n` +
            `รูปแบบงาน: ${data.work_type}\n\n` +
            `📌 เราจะแจ้งเตือนคุณเมื่อมีงานที่เหมาะสมในพื้นที่ของคุณ!\n\n` +
            `ติดตามงานใหม่ๆ ได้ที่ JobLocal Pathum Thani`
    };

    return sendLineMessage(userId, message);
  } catch (e) {
    Logger.log("sendJobSeekerConfirmation error: " + e.toString());
    return false;
  }
}

/**
 * ส่งข้อความยืนยันให้นายจ้างหลังส่งฟอร์มสำเร็จ
 */
function sendEmployerConfirmation(userId, data) {
  try {
    const wageText = data.wage_type === 'เหมาจ้าง'
      ? `${data.wage_type} ${data.lump_sum_days} วัน ${data.wage_amount} บาท`
      : `${data.wage_type} ${data.wage_amount} บาท`;

    const message = {
      type: "text",
      text: `✅ ประกาศงานสำเร็จ!\n\n` +
            `🏢 ${data.company_or_org}\n` +
            `ตำแหน่ง: ${data.job_title}\n` +
            `สถานที่: ${data.location_area}\n` +
            `พื้นที่: ${data.district}\n` +
            `จำนวน: ${data.headcount} คน\n` +
            `ค่าจ้าง: ${wageText}\n\n` +
            `📌 เราจะแนะนำผู้สมัครที่เหมาะสมให้คุณเร็วๆ นี้!\n\n` +
            `ติดต่อ: ${data.contact_phone}`
    };

    return sendLineMessage(userId, message);
  } catch (e) {
    Logger.log("sendEmployerConfirmation error: " + e.toString());
    return false;
  }
}

/**
 * แจ้งเตือนงานที่เหมาะสมให้ผู้หางาน
 */
function notifyMatchingJobs(userId, candidateData) {
  try {
    // ค้นหางานที่ตรงกับผู้สมัคร
    const matchingJobs = findMatchingJobs(candidateData);

    if (matchingJobs.length === 0) {
      Logger.log("No matching jobs found for candidate");
      return false;
    }

    // ส่งแค่ 3 งานแรกที่เหมาะสมที่สุด
    const topJobs = matchingJobs.slice(0, 3);

    let messageText = `🎯 พบงานที่เหมาะกับคุณ ${topJobs.length} ตำแหน่ง!\n\n`;

    topJobs.forEach((job, index) => {
      messageText += `${index + 1}. ${job['ตำแหน่งงาน']}\n`;
      messageText += `   🏢 ${job['ชื่อบริษัท/บุคคล']}\n`;
      messageText += `   📍 ${job['สถานที่ทำงาน']}, ${job['อำเภอ']}\n`;
      messageText += `   💰 ${job['รูปแบบค่าจ้าง']} ${job['จำนวนค่าจ้าง (บาท)']} บาท\n`;
      messageText += `   📞 ${job['เบอร์โทรศัพท์']}\n\n`;
    });

    messageText += `📌 สนใจสมัคร? ติดต่อนายจ้างตามเบอร์ด้านบนได้เลย!`;

    const message = {
      type: "text",
      text: messageText
    };

    return sendLineMessage(userId, message);
  } catch (e) {
    Logger.log("notifyMatchingJobs error: " + e.toString());
    return false;
  }
}

/**
 * แจ้งเตือนผู้สมัครที่เหมาะสมให้นายจ้าง
 */
function notifyMatchingCandidates(userId, jobData) {
  try {
    // ค้นหาผู้สมัครที่ตรงกับงาน
    const matchingCandidates = findMatchingCandidates(jobData);

    if (matchingCandidates.length === 0) {
      Logger.log("No matching candidates found for job");
      return false;
    }

    // ส่งแค่ 3 คนแรกที่เหมาะสมที่สุด
    const topCandidates = matchingCandidates.slice(0, 3);

    let messageText = `👥 พบผู้สมัครที่เหมาะกับตำแหน่ง "${jobData.job_title}" ${topCandidates.length} คน!\n\n`;

    topCandidates.forEach((candidate, index) => {
      messageText += `${index + 1}. ${candidate['ชื่อ-นามสกุล']}\n`;
      messageText += `   อายุ: ${candidate['อายุ']} ปี\n`;
      messageText += `   การศึกษา: ${candidate['ระดับการศึกษา']}\n`;
      messageText += `   ประสบการณ์: ${candidate['ประสบการณ์ทำงาน']}\n`;
      messageText += `   ทักษะ: ${candidate['ทักษะที่คุณถนัด']}\n`;
      messageText += `   พื้นที่: ${candidate['อำเภอที่อยู่']}\n`;
      messageText += `   📞 ${candidate['เบอร์โทรศัพท์']}\n\n`;
    });

    messageText += `📌 สนใจติดต่อ? โทรหาผู้สมัครตามเบอร์ด้านบนได้เลย!`;

    const message = {
      type: "text",
      text: messageText
    };

    return sendLineMessage(userId, message);
  } catch (e) {
    Logger.log("notifyMatchingCandidates error: " + e.toString());
    return false;
  }
}

/**
 * ฟังก์ชันหลักในการส่ง LINE Message
 */
function sendLineMessage(userId, message) {
  try {
    if (!LINE_MESSAGING_API.CHANNEL_ACCESS_TOKEN ||
        LINE_MESSAGING_API.CHANNEL_ACCESS_TOKEN === "YOUR_CHANNEL_ACCESS_TOKEN_HERE") {
      Logger.log("⚠️ LINE Channel Access Token not configured");
      return false;
    }

    const payload = {
      to: userId,
      messages: [message]
    };

    const options = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LINE_MESSAGING_API.CHANNEL_ACCESS_TOKEN}`
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(LINE_MESSAGING_API.ENDPOINT, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      Logger.log("✅ LINE message sent successfully to: " + userId);
      return true;
    } else {
      Logger.log(`❌ LINE API error: ${responseCode} - ${response.getContentText()}`);
      return false;
    }

  } catch (e) {
    Logger.log("sendLineMessage error: " + e.toString());
    return false;
  }
}

/**
 * ค้นหางานที่ตรงกับผู้สมัคร
 */
function findMatchingJobs(candidateData) {
  try {
    const sheet = getEmployerSheet();
    if (!sheet || sheet.getLastRow() <= 1) return [];

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const matches = [];

    // หา index ของคอลัมน์ที่ต้องการ
    const districtIdx = headers.indexOf("อำเภอ");
    const jobCategoryIdx = headers.indexOf("ประเภทงาน");
    const statusIdx = headers.indexOf("สถานะ");

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // เช็คว่างานยังเปิดรับสมัครอยู่
      if (row[statusIdx] !== STATUS.PENDING && row[statusIdx] !== "เปิดรับสมัคร") {
        continue;
      }

      // Match โดยอำเภอ และประเภทงาน
      const sameDistrict = row[districtIdx] === candidateData['อำเภอที่อยู่'];
      const sameCategory = row[jobCategoryIdx] === candidateData['งานที่คุณอยากทำ'];

      if (sameDistrict && sameCategory) {
        const job = {};
        headers.forEach((header, idx) => {
          job[header] = row[idx];
        });
        matches.push(job);
      }
    }

    return matches;

  } catch (e) {
    Logger.log("findMatchingJobs error: " + e.toString());
    return [];
  }
}

/**
 * ค้นหาผู้สมัครที่ตรงกับงาน
 */
function findMatchingCandidates(jobData) {
  try {
    const sheet = getJobSeekerSheet();
    if (!sheet || sheet.getLastRow() <= 1) return [];

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const matches = [];

    // หา index ของคอลัมน์ที่ต้องการ
    const districtIdx = headers.indexOf("อำเภอที่อยู่");
    const desiredJobIdx = headers.indexOf("งานที่คุณอยากทำ");
    const statusIdx = headers.indexOf("สถานะ");

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // เช็คว่าผู้สมัครยังหางานอยู่
      if (row[statusIdx] === STATUS.MATCHED) {
        continue;
      }

      // Match โดยอำเภอ และประเภทงาน
      const sameDistrict = row[districtIdx] === jobData.district;
      const sameCategory = row[desiredJobIdx] === jobData.job_category;

      if (sameDistrict && sameCategory) {
        const candidate = {};
        headers.forEach((header, idx) => {
          candidate[header] = row[idx];
        });
        matches.push(candidate);
      }
    }

    return matches;

  } catch (e) {
    Logger.log("findMatchingCandidates error: " + e.toString());
    return [];
  }
}

/**
 * ฟังก์ชันทดสอบการส่ง notification
 */
function testNotification() {
  // ทดสอบส่งข้อความธรรมดา
  const testUserId = "YOUR_LINE_USER_ID_FOR_TEST"; // ⚠️ ใส่ LINE User ID ของคุณเพื่อทดสอบ

  const testMessage = {
    type: "text",
    text: "🎉 ทดสอบระบบ Notification\n\nหากคุณได้รับข้อความนี้ แสดงว่าระบบทำงานปกติ!"
  };

  const result = sendLineMessage(testUserId, testMessage);

  if (result) {
    Logger.log("✅ Test notification sent successfully");
  } else {
    Logger.log("❌ Test notification failed");
  }
}
