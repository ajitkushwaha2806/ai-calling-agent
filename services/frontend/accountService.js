import axios from "axios";

export async function fetchAccounts() {
  const { data } = await axios.get("/api/accounts");
  
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch accounts");
  }

  return data.data;
}

export async function addAccount({ name, cookie }) {
  const { data } = await axios.post("/api/accounts", { name, cookie });
  
  if (!data.success) {
    throw new Error(data.message || "Failed to add account");
  }

  return data.data;
}

export async function activateAccount(name) {
  const { data } = await axios.post("/api/accounts/active", { name });
  
  if (!data.success) {
    throw new Error(data.message || "Failed to activate account");
  }

  return data;
}

export async function checkActiveAccount() {
  const { data } = await axios.get("/api/accounts/active");
  return data.isActive;
}
