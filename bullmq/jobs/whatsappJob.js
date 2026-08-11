import { sendAudioMessage, sendTextMessage, sendImageMessage, getSessions } from '../../services/openwaService.js';

import { getTargetChatId } from '../../lib/whatsappUtils.js';

export async function processWhatsappJob(job) {
  let { type, sessionId, chatId, resId, url, text, isAnswered, caption } = job.data;

  if (resId && !chatId) {
    chatId = await getTargetChatId(resId);
  }

  if (sessionId === 'default') {
    const sessions = await getSessions();
    if (sessions && sessions.length > 0) {
      sessionId = sessions[0].id;
      console.log(`[Job:${job.id}] Replaced legacy 'default' session with active session ID: ${sessionId}`);
    }
  }

  console.log(`[Job:${job.id}] Processing WhatsApp ${type} message for ${chatId}...`);

  try {
    if (type === 'call-log') {
      if (!text) throw new Error("Text content is required for call-log messages");
      if (isAnswered) {
        if (!url) throw new Error("Audio URL is required for answered call-log messages");
        await sendAudioMessage(sessionId, chatId, url);
        console.log(`[Job:${job.id}] Audio recording sent successfully`);
      }
      const result = await sendTextMessage(sessionId, chatId, text);
      console.log(`[Job:${job.id}] Text message sent successfully`);
      return result;
      
    } else if (type === 'audio') {
      if (!url) throw new Error("Audio URL is required for audio messages");

      const result = await sendAudioMessage(sessionId, chatId, url);
      console.log(`[Job:${job.id}] Audio message sent successfully`);
      return result;

    } else if (type === 'text') {
      if (!text) throw new Error("Text content is required for text messages");

      const result = await sendTextMessage(sessionId, chatId, text);
      console.log(`[Job:${job.id}] Text message sent successfully`);
      return result;
      
    } else if (type === 'image') {
      if (!url) throw new Error("Image URL is required for image messages");

      const result = await sendImageMessage(sessionId, chatId, url, caption);
      console.log(`[Job:${job.id}] Image message sent successfully`);
      return result;

    } else {
      throw new Error(`Unsupported WhatsApp message type: ${type}`);
    }
  } catch (error) {
    console.error(`[Job:${job.id}] Failed to send WhatsApp message:`, error.message);
    throw error; // Let BullMQ handle retries if configured
  }
}
