async function detect() {
  const r = await fetch('https://api.quran.com/api/v4/quran/translations/33');
  const d = await r.json();
  const list = d.translations.slice(0, 500);
  list.forEach(t => {
    const matches = t.text.match(/\d+/g);
    if (matches && matches.length > 0) {
       console.log(`Key ${t.resource_id} matches: ${matches.join(', ')} | Text: ${t.text.substring(0, 100)}...`);
    }
  });
}
detect();
