import axios from "axios";

export async function processClickToCallJob(job) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:1000';
    const response = await axios.post(`${baseUrl}/api/tata/call/process-call`, {
      ...job.data,
      jobId: job.id
    }, {
      timeout: 120000 // 2 minutes timeout to safely wait for the 90s process-call block
    });

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to process internal call");
    }

    return response.data;
  } catch (error) {
    console.error(`[Job:${job.id}] API Request failed:`, error.message);
    throw error;
  }
}
