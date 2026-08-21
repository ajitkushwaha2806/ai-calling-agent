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
    const result = await requestFn(token);
    
    // Some Tata APIs return 200 OK with success: false and message: "Token has expired"
    if (result && result.success === false && result.message && result.message.toLowerCase().includes('token has expired')) {
      console.log("Smartflo token expired (detected in 200 OK payload), auto-logging in...");
      const email = process.env.SMARTFLO_URERNAME;
      const password = process.env.SMARTFLO_PASSWORD;
      if (!email || !password) {
        throw new Error("Smartflo token expired and no credentials to auto-login");
      }
      const data = await loginToSmartflo(email, password);
      const newToken = `Bearer ${data.access_token}`;
      return await requestFn(newToken);
    }
    
    return result;
  } catch (error) {
    if (error.response && (error.response.status === 401 || (error.response.data && error.response.data.message === 'Token has expired'))) {
      console.log("Smartflo token expired (detected via 401), auto-logging in...");
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

  let destinationNumber = payload.destination_number;
  if (Array.isArray(destinationNumber)) {
    destinationNumber = destinationNumber[0];
  }
  if (destinationNumber) {
    destinationNumber = String(destinationNumber).replace(/\D/g, "");
  }

  const requestPayload = {
    ...payload,
    destination_number: destinationNumber,
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

export async function initiateClickToCallSupport(payload) {
  const endpoint = process.env.SMART_FLOW_ENDPOINT;
  if (!endpoint) throw new Error("SMART_FLOW_ENDPOINT not configured in .env");

  let customerNumber = payload.customer_number;
  if (Array.isArray(customerNumber)) {
    customerNumber = customerNumber[0];
  }
  if (customerNumber) {
    customerNumber = String(customerNumber).replace(/\D/g, "");
  }

  const requestPayload = {
    async: payload.async !== undefined ? payload.async : 1,
    api_key: payload.api_key || process.env.TATA_SMARTFLO_API_KEY || "76544c18-843b-4778-bf96-579af4a9e921",
    customer_number: customerNumber,
  };

  try {
    const response = await axios.post(
      `${endpoint}/v1/click_to_call_support`,
      requestPayload,
      {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      console.error("Tata Click-to-Call Support API Error payload:", JSON.stringify(error.response.data));
      throw new Error(`Tata API validation failed: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

