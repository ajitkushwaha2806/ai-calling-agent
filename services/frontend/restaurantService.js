import axios from "axios";

export async function fetchRestaurants() {
  const { data } = await axios.get("/api/restaurants");

  if (!data.success) {
    throw new Error(data.message || "Failed to fetch restaurants");
  }

  return data.data;
}

export async function syncRestaurants(accountKey) {
  if (!accountKey) {
    throw new Error("accountKey is required to sync restaurants");
  }

  const { data } = await axios.get("/api/zomato/get-all-restaurants", {
    params: { accountKey }
  });

  if (!data.success) {
    throw new Error(data.message || "Failed to sync with Zomato");
  }

  return data;
}

export async function updateRestaurantWhatsappConfig(id, whatsappChatId) {
  if (!id) throw new Error("Restaurant ID is required to update config");

  const { data } = await axios.post("/api/restaurants", {
    id,
    whatsappChatId,
  });

  if (!data.success) {
    throw new Error(data.message || "Failed to update configuration");
  }

  return data.data;
}
