const axios = require('axios');

async function test() {
  try {
    const res = await axios.post(
      'https://webhook.botpress.cloud/22941724-d6f1-4ad7-95fb-75ae120090c6',
      {
        message: "Generate Report:\nTest Profile",
        context: "Dashboard Exceedance Profile:\n- Moderate Exceedances: 0\n"
      },
      { headers: { 'x-bp-secret': 'edmond-air-quality-bot', 'Content-Type': 'application/json' } }
    );
    console.log("Status:", res.status);
    console.log("Data:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

test();
