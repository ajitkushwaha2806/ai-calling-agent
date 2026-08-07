import mongoose from 'mongoose';
import 'dotenv/config';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const order = await mongoose.connection.collection('zomatoorders').findOne();
  console.log(Object.keys(order));
  console.log("ID field:", order._id);
  mongoose.connection.close();
}
test();
