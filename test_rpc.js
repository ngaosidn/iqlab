const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, 'mobile/.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.EXPO_PUBLIC_SUPABASE_URL, envConfig.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function testRpc() {
  const { data, error } = await supabase.rpc('get_all_staff');
  console.log("RPC Error:", error);
  console.log("RPC Data:", JSON.stringify(data, null, 2));
}

testRpc();
