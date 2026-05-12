const axios = require('axios');

async function test() {
  try {
    const res = await axios.post(
      'https://webhook.botpress.cloud/22941724-d6f1-4ad7-95fb-75ae120090c6',
      { text: "Test message" },
      { headers: { 'x-bp-secret': 'edmond-air-quality-bot' } }
    );
    console.log("Status:", res.status);
    console.log("Data:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

test();
