import 'dotenv/config';
import { getCallRecords } from './services/tataService.js';

async function test() {
  try {
    const res = await getCallRecords({ limit: 1 });
    const records = res.data?.results || res.results || res.data || [];
    if (records.length > 0) {
      const sampleCallId = records[0].call_id;
      const sampleUuid = records[0].uuid;
      console.log("Found sample call_id:", sampleCallId);
      console.log("Found sample uuid:", sampleUuid);
      
      const searchRes = await getCallRecords({ call_id: sampleCallId });
      console.log("Search by call_id count:", searchRes.results?.length || searchRes.data?.results?.length);
      
      const searchResUuid = await getCallRecords({ call_id: sampleUuid });
      console.log("Search by uuid as call_id count:", searchResUuid.results?.length || searchResUuid.data?.results?.length);
    }
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}
test();
