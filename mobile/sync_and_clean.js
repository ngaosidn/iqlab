const fs = require('fs');
const path = require('path');

async function sync() {
  console.log('Fetching translations from API (Kemenag ID: 33)...');
  try {
    const response = await fetch('https://api.quran.com/api/v4/quran/translations/33');
    const result = await response.json();
    const apiTranslations = result.translations; 

    const files = [
      path.join(__dirname, 'assets/data/verse.json'),
      path.join(__dirname, 'assets/data/indopak.json')
    ];

    files.forEach(filePath => {
      if (!fs.existsSync(filePath)) return;
      
      console.log(`Syncing and cleaning ${path.basename(filePath)}...`);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      let apiIdx = 0;
      let count = 0;

      for (let s = 1; s <= 114; s++) {
        const surahKey = s.toString();
        if (!data[surahKey]) continue;

        data[surahKey].ayat.forEach(verse => {
          if (apiTranslations[apiIdx]) {
            let rawText = apiTranslations[apiIdx].text;
            
            // 1. Hapus tag <sup> beserta isinya (ini biasanya berisi angka catatan kaki)
            let cleanText = rawText.replace(/<sup[^>]*>.*?<\/sup>/gi, '');
            
            // 2. Hapus sisa tag HTML lainnya jika masih ada
            cleanText = cleanText.replace(/<[^>]*>?/gm, '');

            // 3. Hapus pola [angka]>[angka] (seperti 185>5)
            cleanText = cleanText.replace(/\d+>\d+/g, '');

            // 4. Hapus angka yang menempel di belakang kata (seperti halilintar51)
            cleanText = cleanText.replace(/([a-zA-Z])\d+/g, '$1');

            // 5. Terakhir, bersihkan spasi ganda dan trim
            cleanText = cleanText.replace(/\s+/g, ' ').trim();

            verse.terjemahan = cleanText;
            apiIdx++;
            count++;
          }
        });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`✅ ${path.basename(filePath)} updated and cleaned! (${count} verses)`);
    });

    console.log('\n--- DATA CLEANING COMPLETE ---');
  } catch (error) {
    console.error('Error syncing:', error);
  }
}

sync();
