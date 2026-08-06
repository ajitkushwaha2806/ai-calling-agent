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
    const tokenString = `Bearer ${data.access_token}`;

    await TataTeleConfig.findOneAndUpdate(
      { key: "SMARTFLO_TOKEN" },
      { key: "SMARTFLO_TOKEN", tokenString },
      { upsert: true, new: true }
    );
  }

  return data;
}

export async function refreshSmartfloToken() {
  const endpoint = process.env.SMART_FLOW_ENDPOINT;
  if (!endpoint) {
    throw new Error("SMART_FLOW_ENDPOINT not configured in .env");
  }

  await dbConnect();

  const config = await TataTeleConfig.findOne({ key: "SMARTFLO_TOKEN" });
  if (!config || !config.token) {
    throw new Error("No existing Smartflo token found in database to refresh. Please login first.");
  }

  const response = await axios.post(
    `${endpoint}/v1/auth/refresh`,
    {},
    {
      headers: {
        "Accept": "application/json",
        "Authorization": config.token,
      },
    }
  );

  const data = response.data;
  if (data && data.access_token) {
    const tokenString = `Bearer ${data.access_token}`;

    await TataTeleConfig.findOneAndUpdate(
      { key: "SMARTFLO_TOKEN" },
      { key: "SMARTFLO_TOKEN", tokenString },
      { upsert: true, new: true }
    );
  }

  return data;
}

export async function hangupCall(payload) {
  const endpoint = process.env.SMART_FLOW_ENDPOINT;
  if (!endpoint) {
    throw new Error("SMART_FLOW_ENDPOINT not configured in .env");
  }

  await dbConnect();

  const config = await TataTeleConfig.findOne({ key: "SMARTFLO_TOKEN" });
  if (!config || !config.token) {
    throw new Error("No existing Smartflo token found in database. Please login first.");
  }

  const response = await axios.post(
    `${endpoint}/v1/call/hangup`,
    payload,
    {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": config.token,
      },
    }
  );

  return response.data;
}

export async function getCallRecords(queryParams) {
  const endpoint = process.env.SMART_FLOW_ENDPOINT;
  if (!endpoint) {
    throw new Error("SMART_FLOW_ENDPOINT not configured in .env");
  }

  await dbConnect();

  const config = await TataTeleConfig.findOne({ key: "SMARTFLO_TOKEN" });
  if (!config || !config.token) {
    throw new Error("No existing Smartflo token found in database. Please login first.");
  }

  const response = await axios.get(`${endpoint}/v1/call/records`, {
    params: queryParams,
    headers: {
      "Accept": "application/json",
      "Authorization": config.token,
    },
  });

  return response.data;
}

export async function initiateClickToCall(payload) {
  const endpoint = process.env.SMART_FLOW_ENDPOINT;
  if (!endpoint) {
    throw new Error("SMART_FLOW_ENDPOINT not configured in .env");
  }
  await dbConnect();

  const config = await TataTeleConfig.findOne({ key: "SMARTFLO_TOKEN" });
  if (!config || !config.token) {
    throw new Error("No existing Smartflo token found in database. Please login first.");
  }

  const requestPayload = {
    ...payload,
    agent_number: payload.agent_number || process.env.TATA_SMARTFLO_AGENT_NUMBER,
    caller_id: payload.caller_id || process.env.TATA_SMARTFLO_CALLER_ID,
    async: payload.async !== undefined ? payload.async : 1,
  };

  const response = await axios.post(
    `${endpoint}/v1/click_to_call`,
    requestPayload,
    {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": config.token,
      },
    }
  );

  return response.data;
}

export async function getLiveCalls(queryParams) {
  const endpoint = process.env.SMART_FLOW_ENDPOINT;
  if (!endpoint) {
    throw new Error("SMART_FLOW_ENDPOINT not configured in .env");
  }

  await dbConnect();

  const config = await TataTeleConfig.findOne({ key: "SMARTFLO_TOKEN" });
  if (!config || !config.token) {
    throw new Error("No existing Smartflo token found in database. Please login first.");
  }

  const response = await axios.get(`${endpoint}/v1/live_calls`, {
    params: queryParams,
    headers: {
      "Accept": "application/json",
      "Authorization": config.token,
    },
  });

  return response.data;
}
