import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const DB_NAME = 'iqlab_quran_v14.db';
let db = null;

export const databaseService = {
  async init() {
    if (db) return db;
    
    try {
      await this.loadDatabaseAsset();
      
      db = await SQLite.openDatabaseSync(DB_NAME);
      // Mode WAL untuk performa baca yang cepat
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA busy_timeout = 30000;
      `);
      
      console.log(`✅ DATABASE READY (Using Pre-populated Asset ${DB_NAME})`);
      return db;
    } catch (error) {
      console.error('Database Init Error:', error);
      throw error;
    }
  },

  async loadDatabaseAsset() {
    const dbDir = `${FileSystem.documentDirectory}SQLite`;
    const dbPath = `${dbDir}/${DB_NAME}`;
    
    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    
    // Hanya copy jika file belum ada di folder dokumen aplikasi
    if (!fileInfo.exists) {
      console.log(`📦 First run: Copying database ${DB_NAME} from assets...`);
      
      if (!(await FileSystem.getInfoAsync(dbDir)).exists) {
        await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      }
      
      const asset = Asset.fromModule(require('../../assets/database/iqlab_quran_v14.db'));
      await asset.downloadAsync();
      
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: dbPath
      });
      console.log(`✅ Database asset ${DB_NAME} copied!`);
    }
  },

  // Fungsi pengecekan status (agar tidak error jika dipanggil dari App.js)
  async isBootstrapped() {
    return true; 
  },

  async bootstrap() {
    return await this.init();
  },

  async getVerses(surahId, mushafType = 'uthmani') {
    const database = await this.init();
    const column = mushafType === 'indopak' ? 'teks_indopak' : 'teks_uthmani';
    return await database.getAllAsync(
      `SELECT ayat_number as ayat, ${column} as teks_arab, terjemahan FROM quran WHERE surah_id = ? ORDER BY ayat_number ASC`,
      [surahId]
    );
  },

  async getSingleAyah(surahId, ayahNumber, mushafType = 'uthmani') {
    const database = await this.init();
    const column = mushafType === 'indopak' ? 'teks_indopak' : 'teks_uthmani';
    return await database.getFirstAsync(
      `SELECT ayat_number as ayat, ${column} as teks_arab, terjemahan FROM quran WHERE surah_id = ? AND ayat_number = ?`,
      [surahId, ayahNumber]
    );
  },

  async getRandomAyah(mushafType = 'uthmani') {
    const database = await this.init();
    const column = mushafType === 'indopak' ? 'teks_indopak' : 'teks_uthmani';
    return await database.getFirstAsync(
      `SELECT surah_id, ayat_number as ayat, ${column} as teks_arab, terjemahan FROM quran ORDER BY RANDOM() LIMIT 1`
    );
  },

  async searchByTranslation(keyword, mushafType = 'uthmani') {
    const database = await this.init();
    const column = mushafType === 'indopak' ? 'teks_indopak' : 'teks_uthmani';
    // Use LIKE for searching in Indonesian translation
    return await database.getAllAsync(
      `SELECT surah_id, ayat_number as ayat, ${column} as teks_arab, terjemahan 
       FROM quran 
       WHERE terjemahan LIKE ? 
       LIMIT 50`,
      [`%${keyword}%`]
    );
  }
};
