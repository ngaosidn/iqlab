const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ctshuzhwchvyjyysfzhr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0c2h1emh3Y2h2eWp5eXNmemhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDcxNjQsImV4cCI6MjA5MDYyMzE2NH0.OhSbjlY4D9NHYh-OvfNpgU9EHK8Ke6miXm8CQfrGJbE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('announcements').select('*');
  console.log('Anon Query Result:', { data, error });
}

test();
