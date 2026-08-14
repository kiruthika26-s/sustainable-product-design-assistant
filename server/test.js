const { MongoClient } = require("mongodb");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

async function test() {
  console.log("URI:", process.env.MONGO_URI);

  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    console.log("✅ Connected successfully!");
  } catch (err) {
    console.error("FULL ERROR:");
    console.error(err);
  } finally {
    await client.close();
  }
}

test();