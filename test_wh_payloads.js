const axios = require('axios');

async function testWebhooks() {
  const url = 'https://webhook.botpress.cloud/22941724-d6f1-4ad7-95fb-75ae120090c6';
  const headers = { 'x-bp-secret': 'edmond-air-quality-bot', 'Content-Type': 'application/json' };
  
  const payloads = [
    { text: "Generate Report:\ntest data" },
    { message: "Generate Report:\ntest data" },
    { payload: "Generate Report:\ntest data" },
    { content: "Generate Report:\ntest data" },
    { action: "generate_report" }
  ];

  for (let payload of payloads) {
    try {
      console.log("Testing:", payload);
      const res = await axios.post(url, payload, { headers });
      console.log("Status:", res.status, "Length:", res.data ? JSON.stringify(res.data).length : 0);
      if (res.data && JSON.stringify(res.data).length > 2) {
          console.log("REPLY FOUND:", res.data);
      }
    } catch (e) {
      console.log("Failed:", e.message);
    }
  }
}

testWebhooks();
