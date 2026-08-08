import axios from "axios";

export async function initiateManualCall(destination_number) {
  const { data } = await axios.post("/api/tata/call/click-to-call", {
    destination_number: destination_number
  });

  if (!data.success) {
    throw new Error(data.message || "Failed to initiate call");
  }

  return data.data;
}
