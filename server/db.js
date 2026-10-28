import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function getResolvedDbConfig() {
  let host = process.env.DB_HOST || '127.0.0.1';
  let port = parseInt(process.env.DB_PORT || '3306', 10);
  let user = process.env.DB_USER || 'root';
  let password = process.env.DB_PASSWORD || '';
  let database = process.env.DB_NAME || 'ctr_nirmal_kumar';
  let useSsl = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';

  if (process.env.DATABASE_URL) {
    try {
      const parsedUrl = new URL(process.env.DATABASE_URL);
      if (parsedUrl.hostname) host = parsedUrl.hostname;
      if (parsedUrl.port) port = parseInt(parsedUrl.port, 10);
      if (parsedUrl.username) user = decodeURIComponent(parsedUrl.username);
      if (parsedUrl.password) password = decodeURIComponent(parsedUrl.password);
      if (parsedUrl.pathname && parsedUrl.pathname !== '/') {
        database = decodeURIComponent(parsedUrl.pathname.replace(/^\//, ''));
      }
      if (parsedUrl.searchParams.get('ssl-mode') || parsedUrl.searchParams.get('ssl')) {
        useSsl = true;
      }
    } catch (urlErr) {
      console.warn('[Database] Could not parse DATABASE_URL, falling back to individual DB_* vars:', urlErr.message);
    }
  }

  // Auto-enable SSL for cloud databases (e.g. Aiven, RDS, DigitalOcean, PlanetScale)
  if (!useSsl && host && !['127.0.0.1', 'localhost'].includes(host.toLowerCase())) {
    useSsl = true;
  }

  const config = {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
  };

  if (useSsl) {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

let dbConfig = getResolvedDbConfig();
let pool = null;
let isConnected = false;
let lastDbError = null;

export async function initDatabase() {
  try {
    dbConfig = getResolvedDbConfig();

    // For local MySQL, ensure database exists; for cloud MySQL, connect directly
    const isLocalhost = ['127.0.0.1', 'localhost'].includes(dbConfig.host.toLowerCase());
    if (isLocalhost) {
      try {
        const rootConn = await mysql.createConnection({
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.user,
          password: dbConfig.password
        });
        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await rootConn.end();
      } catch {
        // Fall through if user lacks global CREATE privilege or DB already exists
      }
    }

    // Initialize connection pool targeting our database
    pool = mysql.createPool(dbConfig);
    const testConn = await pool.getConnection();
    await testConn.ping();
    testConn.release();

    // Create or verify required tables
    await createTables();

    isConnected = true;
    lastDbError = null;
    console.log(`[Database] Connected successfully to MySQL database "${dbConfig.database}" at ${dbConfig.host}:${dbConfig.port}${dbConfig.ssl ? ' (SSL enabled)' : ''}`);
    return true;
  } catch (error) {
    isConnected = false;
    lastDbError = error.message;
    console.error(`[Database Error] Failed to connect to MySQL: ${error.message}`);
    return false;
  }
}

async function createTables() {
  const conn = await pool.getConnection();
  try {
    // Table 1: petitioners
    await conn.query(`
      CREATE TABLE IF NOT EXISTS petitioners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NULL,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(150) NULL,
        address TEXT NULL,
        constituency VARCHAR(100) DEFAULT 'Thiruparankundram',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_petitioners_phone (phone),
        INDEX idx_petitioners_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Table 2: petitions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS petitions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reference_no VARCHAR(32) NOT NULL UNIQUE,
        petitioner_id INT NOT NULL,
        phone VARCHAR(20) NULL,
        email VARCHAR(150) NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) DEFAULT 'Public Welfare',
        status ENUM('Received', 'Under Review', 'In Progress', 'Resolved', 'Rejected') DEFAULT 'Received',
        admin_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_petitions_ref (reference_no),
        INDEX idx_petitions_phone (phone),
        INDEX idx_petitions_email (email),
        INDEX idx_petitions_status (status),
        CONSTRAINT fk_petitions_petitioner FOREIGN KEY (petitioner_id)
          REFERENCES petitioners(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Table 3: petition_status_history
    await conn.query(`
      CREATE TABLE IF NOT EXISTS petition_status_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        petition_id INT NOT NULL,
        status VARCHAR(50) NOT NULL,
        comments TEXT NULL,
        updated_by VARCHAR(120) DEFAULT 'Office of CTR Nirmal Kumar',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_history_petition (petition_id),
        CONSTRAINT fk_history_petition FOREIGN KEY (petition_id)
          REFERENCES petitions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Table 4: otp_verifications (supports email and phone verification)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(191) NULL,
        phone VARCHAR(20) NULL,
        otp_hash VARCHAR(128) NOT NULL,
        purpose VARCHAR(50) NOT NULL,
        reference_no VARCHAR(32) NULL,
        attempts INT DEFAULT 0,
        max_attempts INT DEFAULT 5,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(128) NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_otp_email_purpose (email, purpose),
        INDEX idx_otp_phone_purpose (phone, purpose),
        INDEX idx_otp_token (verification_token),
        INDEX idx_otp_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Safe, non-destructive migrations for existing databases:
    try {
      const [otpCols] = await conn.query(`SHOW COLUMNS FROM otp_verifications LIKE 'email'`);
      if (otpCols.length === 0) {
        await conn.query(`ALTER TABLE otp_verifications ADD COLUMN email VARCHAR(191) NULL AFTER id, ADD INDEX idx_otp_email_purpose (email, purpose)`);
      }
      await conn.query(`ALTER TABLE otp_verifications MODIFY COLUMN phone VARCHAR(20) NULL`);
      await conn.query(`ALTER TABLE otp_verifications MODIFY COLUMN purpose VARCHAR(50) NOT NULL`);
    } catch (migErr) {
      console.warn('[Database Migration Notice]: otp_verifications schema check:', migErr.message);
    }

    try {
      const [petCols] = await conn.query(`SHOW COLUMNS FROM petitions LIKE 'email'`);
      if (petCols.length === 0) {
        await conn.query(`ALTER TABLE petitions ADD COLUMN email VARCHAR(150) NULL AFTER phone, ADD INDEX idx_petitions_email (email)`);
      }
      await conn.query(`ALTER TABLE petitions MODIFY COLUMN phone VARCHAR(20) NULL`);
    } catch (migErr) {
      console.warn('[Database Migration Notice]: petitions schema check:', migErr.message);
    }

    try {
      const [usrCols] = await conn.query(`SHOW COLUMNS FROM petitioners LIKE 'email'`);
      if (usrCols.length === 0) {
        await conn.query(`ALTER TABLE petitioners ADD COLUMN email VARCHAR(150) NULL AFTER name, ADD INDEX idx_petitioners_email (email)`);
      }
      await conn.query(`ALTER TABLE petitioners MODIFY COLUMN phone VARCHAR(20) NULL`);
    } catch (migErr) {
      console.warn('[Database Migration Notice]: petitioners schema check:', migErr.message);
    }

    console.log('[Database] Verified and initialized all MySQL tables with Email OTP support.');
  } finally {
    conn.release();
  }
}

export async function getPool() {
  if (!pool || !isConnected) {
    dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
    const connected = await initDatabase();
    if (!connected || !pool) {
      throw new Error(`Database connection failed: ${lastDbError || 'Cannot connect to MySQL server at ' + dbConfig.host + ':' + dbConfig.port + '. Please verify database configuration in .env'}`);
    }
  }
  return pool;
}

export function getDbStatus() {
  return {
    connected: isConnected,
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    ssl: !!dbConfig.ssl,
    error: lastDbError
  };
}

