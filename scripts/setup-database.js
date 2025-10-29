const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Migration script to convert db.json to SQLite database
console.log('🚀 Starting database migration from JSON to SQLite...');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const jsonPath = path.join(__dirname, '..', 'db.json');

// Check if JSON file exists
if (!fs.existsSync(jsonPath)) {
    console.log('❌ db.json not found, starting with empty database');
    createDatabaseStructure();
    return;
}

// Read existing JSON data
let jsonData;
try {
    jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('✅ Successfully read db.json');
} catch (error) {
    console.error('❌ Error reading db.json:', error.message);
    createDatabaseStructure();
    return;
}

// Create SQLite database
console.log('📦 Creating SQLite database...');
createDatabaseStructure();

// Migrate data
migrateGeminiApis(jsonData.geminiApis);
migrateGeminiUsage(jsonData.geminiUsage);
migrateAnalytics(jsonData.analytics);
migrateSettings();

console.log('✅ Database migration completed!');
console.log('📁 Database file: database.sqlite');

function createDatabaseStructure() {
    const db = new Database(dbPath);

    // Table for Gemini APIs
    db.exec(`
        CREATE TABLE IF NOT EXISTS gemini_apis (
            id INTEGER PRIMARY KEY,
            api_key TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_valid BOOLEAN DEFAULT 1,
            last_used DATETIME,
            usage_count INTEGER DEFAULT 0
        )
    `);

    // Table for Gemini usage stats
    db.exec(`
        CREATE TABLE IF NOT EXISTS gemini_usage (
            id INTEGER PRIMARY KEY,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            success BOOLEAN,
            error_message TEXT,
            response_time_ms INTEGER,
            model_name TEXT
        )
    `);

    // Table for uploads analytics
    db.exec(`
        CREATE TABLE IF NOT EXISTS uploads_analytics (
            id TEXT PRIMARY KEY,
            account_name TEXT,
            page_id TEXT,
            page_name TEXT,
            type TEXT,
            file_name TEXT,
            file_size INTEGER,
            duration INTEGER,
            caption TEXT,
            hashtags TEXT,
            status TEXT,
            upload_url TEXT,
            scheduled_time DATETIME,
            actual_upload_time DATETIME,
            completion_time DATETIME,
            processing_time INTEGER,
            retry_count INTEGER,
            error_message TEXT,
            category TEXT,
            priority TEXT,
            thumbnail_url TEXT,
            video_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Table for engagement analytics
    db.exec(`
        CREATE TABLE IF NOT EXISTS engagement_analytics (
            id INTEGER PRIMARY KEY,
            upload_id TEXT,
            account_name TEXT,
            page_name TEXT,
            type TEXT,
            metrics TEXT,
            tracked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(upload_id) REFERENCES uploads_analytics(id)
        )
    `);

    // Table for queue items
    db.exec(`
        CREATE TABLE IF NOT EXISTS queue (
            id TEXT PRIMARY KEY,
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
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Table for app settings (replacing electron-store)
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `);

    // Insert default settings
    const insertSetting = db.prepare(`
        INSERT OR REPLACE INTO settings (key, value)
        VALUES (?, ?)
    `);

    insertSetting.run('uploadDelay', '30000');
    insertSetting.run('maxRetries', '3');
    insertSetting.run('autoStartQueue', 'false');
    insertSetting.run('showNotifications', 'true');
    insertSetting.run('showBrowser', 'false');

    db.close();
}

function migrateGeminiApis(apis) {
    if (!apis || !Array.isArray(apis)) {
        console.log('⏭️  No Gemini APIs to migrate');
        return;
    }

    console.log(`📋 Migrating ${apis.length} Gemini APIs...`);
    const db = new Database(dbPath);

    const insertApi = db.prepare(`
        INSERT OR REPLACE INTO gemini_apis (id, api_key, name, created_at, is_valid, last_used, usage_count)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const api of apis) {
        insertApi.run(
            api.id || Date.now(),
            api.apiKey,
            api.name,
            api.createdAt ? new Date(api.createdAt).toISOString() : new Date().toISOString(),
            api.isValid === false ? 0 : 1,
            api.lastUsed ? new Date(api.lastUsed).toISOString() : null,
            api.usageCount || 0
        );
    }

    db.close();
    console.log('✅ Gemini APIs migrated');
}

function migrateGeminiUsage(usage) {
    if (!usage || !Array.isArray(usage)) {
        console.log('⏭️  No Gemini usage to migrate');
        return;
    }

    console.log(`📊 Migrating ${usage.length} Gemini usage records...`);
    const db = new Database(dbPath);

    const insertUsage = db.prepare(`
        INSERT INTO gemini_usage (timestamp, success, error_message, response_time_ms, model_name)
        VALUES (?, ?, ?, ?, ?)
    `);

    for (const record of usage) {
        insertUsage.run(
            record.timestamp ? new Date(record.timestamp).toISOString() : new Date().toISOString(),
            record.success,
            record.error,
            record.responseTime,
            record.model
        );
    }

    db.close();
    console.log('✅ Gemini usage migrated');
}

function migrateAnalytics(analytics) {
    if (!analytics) {
        console.log('⏭️  No analytics to migrate');
        return;
    }

    // Migrate uploads
    if (analytics.uploads && Array.isArray(analytics.uploads)) {
        console.log(`📈 Migrating ${analytics.uploads.length} upload analytics...`);
        migrateUploadsAnalytics(analytics.uploads);
    }

    // Migrate engagement
    if (analytics.engagement && Array.isArray(analytics.engagement)) {
        console.log(`❤️  Migrating ${analytics.engagement.length} engagement records...`);
        migrateEngagementAnalytics(analytics.engagement);
    }
}

function migrateUploadsAnalytics(uploads) {
    const db = new Database(dbPath);

    const insertUpload = db.prepare(`
        INSERT OR REPLACE INTO uploads_analytics
        (id, account_name, page_id, page_name, type, file_name, file_size, duration, caption, hashtags, status, upload_url, scheduled_time, actual_upload_time, completion_time, processing_time, retry_count, error_message, category, priority, thumbnail_url, video_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const upload of uploads) {
        insertUpload.run(
            upload.id,
            upload.accountName,
            upload.pageId,
            upload.pageName,
            upload.type,
            upload.fileName,
            upload.fileSize || 0,
            upload.duration || 0,
            upload.caption,
            upload.hashtags ? JSON.stringify(upload.hashtags) : null,
            upload.status,
            upload.uploadUrl,
            upload.scheduledTime ? new Date(upload.scheduledTime).toISOString() : null,
            upload.actualUploadTime ? new Date(upload.actualUploadTime).toISOString() : null,
            upload.completionTime ? new Date(upload.completionTime).toISOString() : null,
            upload.processingTime || 0,
            upload.retryCount || 0,
            upload.errorMessage,
            upload.category || 'general',
            upload.priority || 'medium',
            upload.thumbnailUrl,
            upload.videoUrl
        );
    }

    db.close();
    console.log('✅ Upload analytics migrated');
}

function migrateEngagementAnalytics(engagements) {
    const db = new Database(dbPath);

    const insertEngagement = db.prepare(`
        INSERT INTO engagement_analytics
        (upload_id, account_name, page_name, type, metrics, tracked_at, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const engagement of engagements) {
        insertEngagement.run(
            engagement.uploadId,
            engagement.accountName,
            engagement.pageId || '',
            engagement.type,
            JSON.stringify(engagement.metrics),
            engagement.trackedAt ? new Date(engagement.trackedAt).toISOString() : new Date().toISOString(),
            engagement.lastUpdated ? new Date(engagement.lastUpdated).toISOString() : new Date().toISOString()
        );
    }

    db.close();
    console.log('✅ Engagement analytics migrated');
}

function migrateSettings() {
    console.log('⚙️ Settings will be handled by default values');
    // Settings migration is handled in createDatabaseStructure
}
