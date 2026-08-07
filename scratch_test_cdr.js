import 'dotenv/config';
import { getCallRecords } from './services/tataService.js';

async function test() {
  try {
    const res = await getCallRecords({ destination_number: "9311507651", limit: 5 });
    console.log("Filtered by destination_number:", res.results?.length);
    
    const res2 = await getCallRecords({ number: "9311507651", limit: 5 });
    console.log("Filtered by number:", res2.results?.length);
  } catch (err) {
    console.error(err);
  }
}
test();
