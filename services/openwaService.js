import axios from "axios";

function getOpenWAClient() {
  const baseURL = process.env.OPENWA_BASE_URL;
  const apiKey = process.env.OPENWA_API_KEY;

  if (!baseURL || !apiKey) {
    throw new Error("OpenWA configuration missing in environment variables.");
  }

  return axios.create({
    baseURL,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    timeout: 10000,
  });
}

export async function getSessions() {
  try {
    const client = getOpenWAClient();
    const response = await client.get("/api/sessions");
    return response.data;
  } catch (error) {
    console.error("OpenWA getSessions error:", error.response?.data || error.message);
    throw new Error("Failed to fetch OpenWA sessions");
  }
}

export async function startSession(sessionId) {
  try {
    const client = getOpenWAClient();
    const response = await client.post(`/api/sessions/${sessionId}/start`);
    return response.data;
  } catch (error) {
    console.error(`OpenWA startSession error for ${sessionId}:`, error.response?.data || error.message);
    throw new Error(`Failed to start OpenWA session ${sessionId}`);
  }
}

async function withAutoStart(sessionId, requestFn) {
  try {
    return await requestFn();
  } catch (error) {
    const responseData = error.response?.data || {};
    const errorMsg = responseData.message || error.message || "";
    
    // Check if the error is about an inactive session
    if (typeof errorMsg === 'string' && errorMsg.includes("is not active")) {
      console.log(`[OpenWA] Session '${sessionId}' is not active. Attempting to start...`);
      await startSession(sessionId);
      
      console.log(`[OpenWA] Session '${sessionId}' start initiated. Waiting a moment before retrying...`);
      // Wait a few seconds for the session to actually be ready
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log(`[OpenWA] Retrying request for session '${sessionId}'...`);
      return await requestFn();
    }
    throw error;
  }
}

export async function sendAudioMessage(sessionId, chatId, audioUrl) {
  if (!sessionId || !chatId || !audioUrl) {
    throw new Error("Missing required parameters to send audio message");
  }

  try {
    const client = getOpenWAClient();
    const payload = { chatId, url: audioUrl, ptt: false };

    const response = await withAutoStart(sessionId, () => 
      client.post(`/api/sessions/${sessionId}/messages/send-audio`, payload)
    );
    return response.data;
  } catch (error) {
    console.error("OpenWA sendAudioMessage error:", error.response?.data || error.message);
    throw new Error("Failed to send audio message via OpenWA");
  }
}

export async function sendTextMessage(sessionId, chatId, text) {
  if (!sessionId || !chatId || !text) {
    throw new Error("Missing required parameters to send text message");
  }

  try {
    const client = getOpenWAClient();
    const payload = { chatId, text };

    const response = await withAutoStart(sessionId, () => 
      client.post(`/api/sessions/${sessionId}/messages/send-text`, payload)
    );
    return response.data;
  } catch (error) {
    console.error("OpenWA sendTextMessage error:", error.response?.data || error.message);
    throw new Error("Failed to send text message via OpenWA");
  }
}

export async function sendImageMessage(sessionId, chatId, url, caption) {
  if (!sessionId || !chatId || !url) {
    throw new Error("Missing required parameters to send image message");
  }

  try {
    const client = getOpenWAClient();
    const payload = { chatId, url, caption: caption || "" };

    const response = await withAutoStart(sessionId, () => 
      client.post(`/api/sessions/${sessionId}/messages/send-image`, payload)
    );
    return response.data;
  } catch (error) {
    console.error("OpenWA sendImageMessage error:", error.response?.data || error.message);
    throw new Error("Failed to send image message via OpenWA");
  }
}
