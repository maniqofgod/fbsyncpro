const Database = require('better-sqlite3');
const path = require('path');

// Migration script to add user_id column to queue table
console.log('🚀 Starting queue table migration to add user_id column...');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

// Check if user_id column already exists
const tableInfo = db.prepare("PRAGMA table_info(queue)").all();
const hasUserIdColumn = tableInfo.some(column => column.name === 'user_id');

if (hasUserIdColumn) {
    console.log('✅ user_id column already exists in queue table');
    db.close();
    return;
}

console.log('📋 user_id column not found, adding it...');

// First, get the admin user ID to use as default for existing queue items
const adminUser = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();

if (!adminUser) {
    console.error('❌ No admin user found! Cannot proceed with migration.');
    db.close();
    process.exit(1);
}

console.log(`👤 Using admin user ID: ${adminUser.id}`);

// Add user_id column with default value for existing rows
db.exec(`ALTER TABLE queue ADD COLUMN user_id TEXT DEFAULT '${adminUser.id}'`);

// Update all existing queue items to use the admin user_id
const updateResult = db.prepare('UPDATE queue SET user_id = ? WHERE user_id IS NULL').run(adminUser.id);
console.log(`✅ Updated ${updateResult.changes} existing queue items with admin user_id`);

// Now make the column NOT NULL for future inserts
// SQLite doesn't support MODIFY COLUMN directly, so we need to recreate the table
console.log('🔄 Recreating table with user_id as NOT NULL...');

// Rename current table
db.exec('ALTER TABLE queue RENAME TO queue_old');

// Create new table with NOT NULL constraint
db.exec(`
    CREATE TABLE queue (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        account_name TEXT,
        page_id TEXT,
        page_name TEXT,
        type TEXT,
        file_path TEXT,
        file_name TEXT,
        caption TEXT,
        status TEXT DEFAULT 'pending',
        scheduled_time DATETIME,
        started_at TEXT,
        actual_upload_time DATETIME,
        completion_time DATETIME,
        processing_time INTEGER,
        retry_count INTEGER DEFAULT 0,
        next_retry DATETIME,
        error_message TEXT,
        upload_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
`);

// Copy data from old table to new table
db.exec(`
    INSERT INTO queue (
        id, user_id, account_name, page_id, page_name, type, file_path, file_name,
        caption, status, scheduled_time, started_at, actual_upload_time, completion_time,
        processing_time, retry_count, next_retry, error_message, upload_url,
        created_at, updated_at
    )
    SELECT
        id, user_id, account_name, page_id, page_name, type, file_path, file_name,
        caption, status, scheduled_time, started_at, actual_upload_time, completion_time,
        processing_time, retry_count, next_retry, error_message, upload_url,
        created_at, updated_at
    FROM queue_old
`);

// Drop old table
db.exec('DROP TABLE queue_old');

console.log('✅ Migration completed successfully!');

// Verify the migration
const queueCount = db.prepare('SELECT COUNT(*) as count FROM queue').get();
const sampleItem = db.prepare('SELECT id, user_id FROM queue LIMIT 1').get();

console.log(`📊 Queue table now has ${queueCount.count} items`);
if (sampleItem) {
    console.log(`🔍 Sample item user_id: ${sampleItem.user_id}`);
}

db.close();
console.log('🎉 Migration script finished!');
