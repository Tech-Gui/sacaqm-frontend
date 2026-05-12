const chat = require('@botpress/chat');
const axios = require('axios');

const fetchBotpress = async () => {
  try {
    const webhookId = "4ee1556f-2081-4faa-b373-f9bf8fec0f05";
    const client = await chat.Client.connect({ webhookId });
    const { conversation } = await client.createConversation({});
    console.log("Conversation created:", conversation.id);

    // Hit the webhook with conversation ID
    await axios.post(
      'https://webhook.botpress.cloud/22941724-d6f1-4ad7-95fb-75ae120090c6',
      {
        conversationId: conversation.id,
        event: "dashboard_update",
        context: "Test context from dashboard"
      },
      { headers: { 'x-bp-secret': 'edmond-air-quality-bot' } }
    );
    console.log("Sent webhook push...");

    // Also send a message in the chat
    await client.createMessage({
      conversationId: conversation.id,
      payload: { type: 'text', text: "Generate Report:\nTest context from dashboard" }
    });
    console.log("Sent message payload...");

    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const { messages } = await client.listMessages({ conversationId: conversation.id });
        const botMsgs = messages.filter(m => m.payload.text && !m.payload.text.includes("Generate Report:"));
        if (botMsgs.length > 0) {
            return "Bot replied: " + botMsgs.map(m => m.payload.text).join('\n');
        }
    }
    return "Timeout.";
  } catch (err) {
    return "Error: " + err.message;
  }
};

fetchBotpress().then(console.log);
