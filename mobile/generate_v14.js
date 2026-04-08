const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_NAME = 'iqlab_quran_v14.db';
const DB_PATH = path.join(__dirname, 'assets/database', DB_NAME);

// Ensure directory exists
if (!fs.existsSync(path.join(__dirname, 'assets/database'))) {
  fs.mkdirSync(path.join(__dirname, 'assets/database'), { recursive: true });
}

// Remove old DB if exists
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
}

const db = new sqlite3.Database(DB_PATH);

const verseData = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets/data/verse.json'), 'utf8'));
const indopakData = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets/data/indopak.json'), 'utf8'));

db.serialize(() => {
  db.run(`CREATE TABLE quran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    surah_id INTEGER,
    ayat_number INTEGER,
    teks_uthmani TEXT,
    teks_indopak TEXT,
    terjemahan TEXT
  )`);

  const stmt = db.prepare(`INSERT INTO quran (surah_id, ayat_number, teks_uthmani, teks_indopak, terjemahan) VALUES (?, ?, ?, ?, ?)`);

  for (let s = 1; s <= 114; s++) {
    const surahKey = s.toString();
    const uthmaniVerses = verseData[surahKey].ayat;
    const indopakVerses = indopakData[surahKey].ayat;

    uthmaniVerses.forEach((v, idx) => {
      stmt.run(
        s,
        v.ayat,
        v.teks_arab,
        indopakVerses[idx].teks_arab,
        v.terjemahan
      );
    });
  }

  stmt.finalize();
  console.log(`✅ ${DB_NAME} created successfully!`);
});

db.close();
