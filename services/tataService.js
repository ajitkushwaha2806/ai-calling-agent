import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import TataTeleConfig from "@/models/TataTeleConfig";

export async function loginToSmartflo(email, password) {
  const endpoint = process.env.SMART_FLOW_ENDPOINT;
  if (!endpoint) {
    throw new Error("SMART_FLOW_ENDPOINT not configured in .env");
  }

  const response = await axios.post(
    `${endpoint}/v1/auth/login`,
    {
      email,
      password,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    }
  );

  const data = response.data;

  if (data && data.access_token) {
    await dbConnect();
    const token = `Bearer ${data.access_token}`;

    await TataTeleConfig.findOneAndUpdate(
      { key: "SMARTFLO_TOKEN" },
      { key: "SMARTFLO_TOKEN", token },
      { upsert: true, new: true }
    );
  }

  return data;
}

export async function getValidSmartfloToken() {
  await dbConnect();
  
  let config = await TataTeleConfig.findOne({ key: "SMARTFLO_TOKEN" });
  
  if (!config || !config.token) {
    const email = process.env.SMARTFLO_URERNAME; 
    const password = process.env.SMARTFLO_PASSWORD;
    if (!email || !password) {
      throw new Error("No existing Smartflo token found in database, and no credentials in .env");
    }
    const data = await loginToSmartflo(email, password);
    return `Bearer ${data.access_token}`;
  }
  
  return config.token;
}

async function withAutoRefresh(requestFn) {
  try {
    const token = await getValidSmartfloToken();
    return await requestFn(token);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log("Smartflo token expired, auto-logging in...");
      const email = process.env.SMARTFLO_URERNAME;
      const password = process.env.SMARTFLO_PASSWORD;
      if (!email || !password) {
        throw new Error("Smartflo token expired and no credentials to auto-login");
      }
      const data = await loginToSmartflo(email, password);
      const newToken = `Bearer ${data.access_token}`;
      return await requestFn(newToken);
    }
    throw error;
  }
}

export async function refreshSmartfloToken() {
  const email = process.env.SMARTFLO_URERNAME;
  const password = process.env.SMARTFLO_PASSWORD;
  if (!email || !password) {
    throw new Error("Smartflo credentials missing in .env");
  }
  return await loginToSmartflo(email, password);
}

export async function hangupCall(payload) {
  const endpoint = process.env.SMART_FLOW_ENDPOINT;
  if (!endpoint) throw new Error("SMART_FLOW_ENDPOINT not configured in .env");

  return await withAutoRefresh(async (token) => {
    const response = await axios.post(
      `${endpoint}/v1/call/hangup`,
      payload,
      {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": token,
        },
      }
    );
    return response.data;
  });
}

export async function getCallRecords(queryParams) {
  const endpoint = process.env.SMART_FLOW_ENDPOINT;
  if (!endpoint) throw new Error("SMART_FLOW_ENDPOINT not configured in .env");

  return await withAutoRefresh(async (token) => {
    const response = await axios.get(`${endpoint}/v1/call/records`, {
      params: queryParams,
      headers: {
        "Accept": "application/json",
        "Authorization": token,
      },
    });
    return response.data;
  });
}

export async function initiateClickToCall(payload) {
  const endpoint = process.env.SMART_FLOW_ENDPOINT;
  if (!endpoint) throw new Error("SMART_FLOW_ENDPOINT not configured in .env");

  const requestPayload = {
    ...payload,
    agent_number: payload.agent_number || process.env.TATA_SMARTFLO_AGENT_NUMBER,
    caller_id: payload.caller_id || process.env.TATA_SMARTFLO_CALLER_ID,
    async: payload.async !== undefined ? payload.async : 1,
  };

  return await withAutoRefresh(async (token) => {
    const response = await axios.post(
      `${endpoint}/v1/click_to_call`,
      requestPayload,
      {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": token,
        },
      }
    );
    return response.data;
  });
}

export async function getLiveCalls(queryParams) {
  const endpoint = process.env.SMART_FLOW_ENDPOINT;
  if (!endpoint) throw new Error("SMART_FLOW_ENDPOINT not configured in .env");

  return await withAutoRefresh(async (token) => {
    const response = await axios.get(`${endpoint}/v1/live_calls`, {
      params: queryParams,
      headers: {
        "Accept": "application/json",
        "Authorization": token,
      },
    });
    return response.data;
  });
}

