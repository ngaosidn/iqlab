require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function testRpc() {
  const { data, error } = await supabase.rpc('get_all_staff');
  console.log("RPC Error:", error);
  console.log("RPC Data:", JSON.stringify(data, null, 2));
}

testRpc();
