import * as SQLite from 'expo-sqlite';
import verseUthmani from '../../assets/data/verse.json';
import verseIndopak from '../../assets/data/indopak.json';

const DB_NAME = 'iqlab_quran_v12.db'; // Versi baru yang bersih tanpa Kemenag
let db = null;
let migrationRunning = false;

export const databaseService = {
  async init() {
    if (db) return db;
    try {
      db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA busy_timeout = 5000;
        CREATE TABLE IF NOT EXISTS verses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          surah_id INTEGER,
          ayah_number INTEGER,
          teks_arab TEXT,
          terjemahan TEXT,
          mushaf_type TEXT,
          UNIQUE(surah_id, ayah_number, mushaf_type)
        );
        CREATE INDEX IF NOT EXISTS idx_surah_ayah_type ON verses(surah_id, ayah_number, mushaf_type);
      `);
      return db;
    } catch (error) {
      console.error('SQLite Init Error:', error);
      throw error;
    }
  },

  async getCounts() {
    try {
        const database = await this.init();
        const rows = await database.getAllAsync('SELECT mushaf_type, COUNT(*) as count FROM verses GROUP BY mushaf_type');
        const counts = { uthmani: 0, indopak: 0 };
        rows.forEach(r => { counts[r.mushaf_type] = r.count; });
        return counts;
    } catch (e) {
        return { uthmani: 0, indopak: 0 };
    }
  },

  async isBootstrapped() {
    const counts = await this.getCounts();
    return counts.uthmani >= 6236 && counts.indopak >= 6236;
  },

  async bootstrap() {
    if (migrationRunning) return;
    migrationRunning = true;

    try {
        const database = await this.init();
        const counts = await this.getCounts();

        if (counts.uthmani >= 6236 && counts.indopak >= 6236) {
            console.log('✅ DATABASE V12 SIAP (Offline Only).');
            migrationRunning = false;
            return;
        }

        console.log('🚀 PROSES MIGRASI V12 (Uthmani & Indopak Only)...');
        const startTime = Date.now();
        
        const offlineTypes = [
            { name: 'uthmani', source: verseUthmani },
            { name: 'indopak', source: verseIndopak }
        ];

        for (const type of offlineTypes) {
            if (counts[type.name] >= 6236) continue;
            console.log(`📦 Mengisi Mushaf: ${type.name}...`);
            const surahIds = Object.keys(type.source);
            
            for (const surahId of surahIds) {
                const ayahs = type.source[surahId].ayat;
                await database.withTransactionAsync(async () => {
                    for (const ayah of ayahs) {
                        await database.runAsync(
                            'INSERT OR REPLACE INTO verses (surah_id, ayah_number, teks_arab, terjemahan, mushaf_type) VALUES (?, ?, ?, ?, ?)',
                            [parseInt(surahId), ayah.ayat, ayah.teks_arab, ayah.terjemahan, type.name]
                        );
                    }
                });
            }
        }
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ DATABASE V12 SELESAI! (${duration} detik)`);
    } catch (error) {
        console.error('❌ Bootstrap V12 Error:', error.message);
    } finally {
        migrationRunning = false;
    }
  },

  async getVerses(surahId, mushafType = 'uthmani') {
    const database = await this.init();
    return await database.getAllAsync(
      'SELECT ayah_number as ayat, teks_arab, terjemahan FROM verses WHERE surah_id = ? AND mushaf_type = ? ORDER BY ayah_number ASC',
      [surahId, mushafType]
    );
  }
};
