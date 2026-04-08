const fs = require('fs');
const path = require('path');

async function sync() {
  console.log('Fetching translations from API...');
  try {
    const response = await fetch('https://api.quran.com/api/v4/quran/translations/33');
    const result = await response.json();
    const apiTranslations = result.translations; 

    console.log('Contoh data API:', JSON.stringify(apiTranslations[0], null, 2));

    const files = [
      path.join(__dirname, 'assets/data/verse.json'),
      path.join(__dirname, 'assets/data/indopak.json')
    ];

    files.forEach(filePath => {
      if (!fs.existsSync(filePath)) {
        console.log(`File tidak ditemukan: ${filePath}`);
        return;
      }
      
      console.log(`Checking ${path.basename(filePath)}...`);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Karena API mengembalikan list berurutan (6236 ayat), 
      // kita bisa gunakan counter global untuk memetakan
      let apiIdx = 0;
      let count = 0;

      for (let s = 1; s <= 114; s++) {
        const surahKey = s.toString();
        if (!data[surahKey]) continue;

        data[surahKey].ayat.forEach(verse => {
          if (apiTranslations[apiIdx]) {
            const cleanText = apiTranslations[apiIdx].text.replace(/<[^>]*>?/gm, '').trim();
            verse.terjemahan = cleanText;
            apiIdx++;
            count++;
          }
        });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`✅ ${path.basename(filePath)} updated! (${count} verses)`);
    });

  } catch (error) {
    console.error('Error syncing:', error);
  }
}

sync();
