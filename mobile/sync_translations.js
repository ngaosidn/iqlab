const fs = require('fs');
const path = require('path');

async function sync() {
  console.log('Fetching translations from API...');
  try {
    const response = await fetch('https://api.quran.com/api/v4/quran/translations/33');
    const result = await response.json();
    const apiTranslations = result.translations; // Array of { resource_id, text, verse_key }

    // Map by verse_key for easy lookup "1:1", "1:2", etc.
    const translationMap = {};
    apiTranslations.forEach(t => {
      const cleanText = t.text.replace(/<[^>]*>?/gm, '').trim(); // Clean any HTML tags
      translationMap[t.verse_key] = cleanText;
    });

    const files = [
      path.join(__dirname, 'assets/data/verse.json'),
      path.join(__dirname, 'assets/data/indopak.json')
    ];

    files.forEach(filePath => {
      if (!fs.existsSync(filePath)) return;
      
      console.log(`Syncing ${path.basename(filePath)}...`);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      let count = 0;
      for (const surahId in data) {
        data[surahId].ayat.forEach(verse => {
          const key = `${surahId}:${verse.ayat}`;
          if (translationMap[key]) {
            verse.terjemahan = translationMap[key];
            count++;
          }
        });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`✅ ${path.basename(filePath)} updated! (${count} verses)`);
    });

    console.log('\n--- ALL DONE ---');
    console.log('Semua terjemahan sekarang sudah sinkron dengan Quran.com');
  } catch (error) {
    console.error('Error syncing:', error);
  }
}

sync();
