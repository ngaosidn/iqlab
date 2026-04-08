import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const DB_NAME = 'iqlab_quran_v13.db';
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
      
      console.log('✅ DATABASE READY (Using Pre-populated Asset V13)');
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
      console.log('📦 First run: Copying database V13 from assets...');
      
      if (!(await FileSystem.getInfoAsync(dbDir)).exists) {
        await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      }
      
      const asset = Asset.fromModule(require('../../assets/database/iqlab_quran_v13.db'));
      await asset.downloadAsync();
      
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: dbPath
      });
      console.log('✅ Database asset V13 copied!');
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
    // Kembalikan format yang sesuai dengan ekspektasi UI (ayat, teks_arab, terjemahan)
    return await database.getAllAsync(
      'SELECT ayah_number as ayat, teks_arab, terjemahan FROM verses WHERE surah_id = ? AND mushaf_type = ? ORDER BY ayah_number ASC',
      [surahId, mushafType]
    );
  }
};
