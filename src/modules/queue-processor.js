const Database = require('better-sqlite3');
const cron = require('node-cron');
const path = require('path');

/**
 * Queue Processor Module
 * Menangani sistem antrian upload dan penjadwalan
 */
class QueueProcessor {
    constructor(options = {}, dbPath = null) {
        this.dbPath = dbPath || path.join(__dirname, '..', '..', 'database.sqlite');
        this.db = null;
        this.isProcessing = false;
        this.processingInterval = null;
        this.scheduledJobs = new Map();
        this.facebookAutomation = null;
        this.options = {
            headless: true,
            showBrowser: false,
            ...options
        };

        // Initialize database connection
        this.initializeDatabase();

        // Setup cron job untuk pengecekan periodik
        this.setupPeriodicCheck();
    }

    /**
     * Initialize database connection and tables
     */
    initializeDatabase() {
        try {
            this.db = new Database(this.dbPath);

                // Ensure queue table exists with all columns
            this.db.exec(`
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
                    processing_logs TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
            `);

            console.log('📊 QueueProcessor database initialized');
        } catch (error) {
            console.error('❌ Error initializing QueueProcessor database:', error);
        }
    }

    /**
     * Setup pengecekan antrian periodik
     */
    setupPeriodicCheck() {
        // Cek antrian setiap 1 menit
        cron.schedule('* * * * *', () => {
            this.processScheduledUploads();
        });

        // Cek antrian setiap 30 detik untuk upload langsung
        this.processingInterval = setInterval(() => {
            if (!this.isProcessing) {
                this.processImmediateUploads();
            }
        }, 30000);
    }

    /**
     * Tambahkan item ke antrian
     */
    async addToQueue(queueItem) {
        try {
            // Generate ID unik
            queueItem.id = this.generateId();
            queueItem.status = 'pending';
            queueItem.created_at = new Date().toISOString();
            queueItem.updated_at = new Date().toISOString();
            queueItem.retry_count = 0;

            // Jika ada schedule, set status menjadi scheduled
            if (queueItem.schedule) {
                const scheduleTime = new Date(queueItem.schedule);
                if (scheduleTime > new Date()) {
                    queueItem.status = 'scheduled';
                    this.scheduleUpload(queueItem);
                }
            }

            const stmt = this.db.prepare(`
                INSERT INTO queue (
                    id, account_name, page_id, page_name, type, file_path, file_name,
                    caption, status, scheduled_time, processing_logs, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                queueItem.id,
                queueItem.account,
                queueItem.page,
                queueItem.pageName || '',
                queueItem.type,
                queueItem.file,
                queueItem.fileName || '',
                queueItem.caption,
                queueItem.status,
                queueItem.schedule,
                '', // processing_logs (empty initially)
                queueItem.created_at,
                queueItem.updated_at
            );

            return {
                success: true,
                id: queueItem.id,
                message: 'Item berhasil ditambahkan ke antrian'
            };
        } catch (error) {
            console.error('Error adding to queue:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Hapus item dari antrian
     */
    async removeFromQueue(itemId) {
        try {
            // Cancel scheduled job jika ada
            if (this.scheduledJobs.has(itemId)) {
                this.scheduledJobs.get(itemId).destroy();
                this.scheduledJobs.delete(itemId);
            }

            const stmt = this.db.prepare('DELETE FROM queue WHERE id = ?');
            const result = stmt.run(itemId);

            if (result.changes > 0) {
                return {
                    success: true,
                    message: 'Item berhasil dihapus dari antrian'
                };
            }

            return {
                success: false,
                error: 'Item tidak ditemukan'
            };
        } catch (error) {
            console.error('Error removing from queue:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update status item di antrian
     */
    async updateQueueItem(itemId, updates) {
        try {
            // Check if item exists
            const existing = this.getQueueItem(itemId);
            if (!existing) {
                return {
                    success: false,
                    error: 'Item tidak ditemukan'
                };
            }

            // Handle schedule changes
            if (updates.schedule && updates.schedule !== existing.scheduled_time) {
                // Cancel old scheduled job
                if (this.scheduledJobs.has(itemId)) {
                    this.scheduledJobs.get(itemId).destroy();
                    this.scheduledJobs.delete(itemId);
                }

                // Schedule new job if it's a valid future time
                if (new Date(updates.schedule) > new Date()) {
                    updates.status = 'scheduled';
                    this.scheduleUpload({ id: itemId, ...updates });
                }
            }

            const setParts = [];
            const values = [];

            // Proper field mapping from camelCase to database columns
            const fieldMapping = {
                accountName: 'account_name',
                pageId: 'page_id',
                pageName: 'page_name',
                filePath: 'file_path',
                fileName: 'file_name',
                scheduledTime: 'scheduled_time',
                actualUploadTime: 'actual_upload_time',
                completionTime: 'completion_time',
                completedAt: 'completion_time', // Map completedAt to completion_time
                processingTime: 'processing_time',
                retryCount: 'retry_count',
                attempts: 'retry_count', // Also map attempts to retry_count
                errorMessage: 'error_message',
                lastError: 'error_message', // Map lastError to error_message
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                startedAt: 'started_at',
                uploadUrl: 'upload_url', // Explicit mapping for upload URL
                failedAt: 'completion_time', // Map failedAt to completion_time (when fail happens)
                nextRetry: 'next_retry', // Map nextRetry to next_retry
                processingLogs: 'processing_logs' // Map processingLogs to processing_logs
            };

            Object.entries(updates).forEach(([key, value]) => {
                const dbKey = fieldMapping[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase();
                setParts.push(`${dbKey} = ?`);
                values.push(value);
            });

            setParts.push('updated_at = ?');
            values.push(new Date().toISOString());
            values.push(itemId);

            const stmt = this.db.prepare(`UPDATE queue SET ${setParts.join(', ')} WHERE id = ?`);
            const result = stmt.run(...values);

            if (result.changes > 0) {
                return {
                    success: true,
                    message: 'Item berhasil diupdate'
                };
            }

            return {
                success: false,
                error: 'Gagal mengupdate item'
            };
        } catch (error) {
            console.error('Error updating queue item:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Ambil semua item di antrian
     */
    getQueue() {
        try {
            const stmt = this.db.prepare('SELECT * FROM queue ORDER BY created_at DESC');
            const rows = stmt.all();
            const now = new Date();
            const settings = this.getSettings();
            const cooldownMap = new Map();

            // Calculate last completion time for each account+page combination
            rows.forEach(row => {
                const key = `${row.account_name}-${row.page_id}`;
                const completionTime = row.completion_time || row.actual_upload_time || row.created_at;
                const lastUpload = new Date(completionTime);

                if (!cooldownMap.has(key) || lastUpload > cooldownMap.get(key)) {
                    cooldownMap.set(key, lastUpload);
                }
            });

            // Convert database column names to camelCase for compatibility
            return rows.map(row => {
                const key = `${row.account_name}-${row.page_id}`;
                const lastUpload = cooldownMap.get(key);
                const timeSinceLastUpload = now - lastUpload;
                const cooldownMs = settings.uploadDelay || 30000; // 30 seconds default

                let cooldownRemaining = 0;
                if (timeSinceLastUpload < cooldownMs && (row.status === 'pending' || row.status === 'scheduled')) {
                    cooldownRemaining = Math.ceil((cooldownMs - timeSinceLastUpload) / 1000); // seconds
                }

                return {
                    id: row.id,
                    account: row.account_name,
                    page: row.page_id,
                    pageName: row.page_name,
                    type: row.type,
                    file: row.file_path,
                    fileName: row.file_name,
                    caption: row.caption,
                    status: row.status,
                    schedule: row.scheduled_time,
                    actualUploadTime: row.actual_upload_time,
                    completionTime: row.completion_time,
                    processingTime: row.processing_time,
                    attempts: row.retry_count,
                    nextRetry: row.next_retry, // Add nextRetry field conversion
                    errorMessage: row.error_message,
                    processingLogs: row.processing_logs,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    cooldownRemaining: cooldownRemaining,
                    cooldownMinutes: Math.ceil(cooldownRemaining / 60),
                    canUpload: cooldownRemaining === 0
                };
            });
        } catch (error) {
            console.error('Error getting queue:', error);
            return [];
        }
    }

    /**
     * Ambil item berdasarkan ID
     */
    getQueueItem(itemId) {
        try {
            const stmt = this.db.prepare('SELECT * FROM queue WHERE id = ?');
            const row = stmt.get(itemId);

            if (!row) return null;

            // Convert database column names to camelCase for compatibility
            return {
                id: row.id,
                account: row.account_name,
                page: row.page_id,
                pageName: row.page_name,
                type: row.type,
                file: row.file_path,
                fileName: row.file_name,
                caption: row.caption,
                status: row.status,
                schedule: row.scheduled_time,
                actualUploadTime: row.actual_upload_time,
                completionTime: row.completion_time,
                processingTime: row.processing_time,
                attempts: row.retry_count,
                nextRetry: row.next_retry, // Add nextRetry field conversion
                errorMessage: row.error_message,
                processingLogs: row.processing_logs,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
        } catch (error) {
            console.error('Error getting queue item:', error);
            return null;
        }
    }

    /**
     * Proses upload langsung (tanpa schedule)
     */
    async processImmediateUploads() {
        if (this.isProcessing) {
            console.log('⚠️ Queue processing already running, skipping...');
            return;
        }

        try {
            this.isProcessing = true;
            console.log('🚀 Starting immediate queue processing...');

            const queue = this.getQueue();
            console.log(`📊 Total items in queue: ${queue.length}`);

            const pendingItems = queue.filter(item =>
                (item.status === 'pending' || item.status === 'retry') &&
                (!item.schedule || new Date(item.schedule) <= new Date()) &&
                (!item.nextRetry || new Date(item.nextRetry) <= new Date())
            );

            console.log(`⏳ Found ${pendingItems.length} pending/retry items to process`);

            if (pendingItems.length === 0) {
                console.log('ℹ️ No pending items found in queue');
                return;
            } else {
                console.log(`🔄 Running scheduled queue processing...`);
                console.log(`⚠️ Queue processing already running, skipping...`);
                console.log(`✅ Scheduled queue processing completed`);
            }

            for (const item of pendingItems) {
                console.log(`🎬 Processing item: ${item.id} - ${item.type} upload`);
                await this.processUpload(item);

                // Delay antar upload sesuai pengaturan
                const settings = this.getSettings();
                console.log(`⏰ Waiting ${settings.uploadDelay}ms before next upload...`);
                await this.delay(settings.uploadDelay);
            }

            console.log('✅ Immediate queue processing completed');
        } catch (error) {
            console.error('❌ Error processing immediate uploads:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Proses upload yang sudah dijadwalkan
     */
    async processScheduledUploads() {
        try {
            const queue = this.getQueue();
            const scheduledItems = queue.filter(item =>
                item.status === 'scheduled' &&
                item.schedule &&
                new Date(item.schedule) <= new Date()
            );

            for (const item of scheduledItems) {
                // Update status menjadi pending
                await this.updateQueueItem(item.id, { status: 'pending' });

                // Process the upload
                await this.processUpload(item);
            }
        } catch (error) {
            console.error('Error processing scheduled uploads:', error);
        }
    }

    /**
     * Proses upload individual item
     */
    async processUpload(queueItem) {
        const uploadStartTime = Date.now();

        try {
            console.log(`🔄 Starting upload process for item: ${queueItem.id}`);
            console.log(`📋 Upload type: ${queueItem.type}, Account: ${queueItem.account}, Page: ${queueItem.page}`);

            // Update status menjadi processing
            await this.updateQueueItem(queueItem.id, {
                status: 'processing',
                startedAt: new Date().toISOString()
            });

            // Track upload start di analytics
            await this.trackUploadStart(queueItem);

            // Get account data
            const AccountManager = require('./account-manager');
            const accountManager = new AccountManager();
            const account = accountManager.getAccount(queueItem.account);

            if (!account || !account.valid) {
                throw new Error(`Akun ${queueItem.account} tidak valid atau tidak ditemukan`);
            }

            console.log(`✅ Account found: ${account.name}, Valid: ${account.valid}`);
            console.log(`📄 Pages available: ${account.pages ? account.pages.length : 0}`);

            // Process upload berdasarkan tipe
            let uploadResult;
            if (queueItem.type === 'reel') {
                uploadResult = await this.uploadAsReel(queueItem, account);
            } else {
                uploadResult = await this.uploadAsPost(queueItem, account);
            }

            const uploadEndTime = Date.now();
            const processingTime = uploadEndTime - uploadStartTime;

            if (uploadResult.success) {
                // Track successful upload di analytics
                await this.trackUploadSuccess(queueItem, uploadResult, processingTime);

                await this.updateQueueItem(queueItem.id, {
                    status: 'completed',
                    completedAt: new Date().toISOString(),
                    uploadUrl: uploadResult.url
                });

                return {
                    success: true,
                    message: 'Upload berhasil',
                    url: uploadResult.url
                };
            } else {
                // Track failed upload di analytics
                await this.trackUploadFailure(queueItem, uploadResult.error, processingTime);

                throw new Error(uploadResult.error || 'Upload gagal');
            }
        } catch (error) {
            console.error('Error processing upload:', error);

            const processingTime = Date.now() - uploadStartTime;

            // Track failed upload di analytics
            await this.trackUploadFailure(queueItem, error.message, processingTime);

            // Update attempts
            const currentItem = this.getQueueItem(queueItem.id);
            const attempts = (currentItem.attempts || 0) + 1;
            const settings = this.getSettings();
            const maxRetries = settings.maxRetries || 3;

            if (attempts < maxRetries) {
                // Schedule for retry with explicit retry status
                const retryDelay = attempts * 60000; // Exponential backoff: 1min, 2min, 3min, etc.
                const nextRetryTime = new Date(Date.now() + retryDelay);

                await this.updateQueueItem(queueItem.id, {
                    status: 'retry',
                    attempts: attempts,
                    lastError: error.message,
                    nextRetry: nextRetryTime.toISOString()
                });

                return {
                    success: false,
                    error: `Retry ${attempts}/${maxRetries}: ${error.message}`,
                    willRetry: true,
                    nextRetry: nextRetryTime.toISOString()
                };
            } else {
                // Max retries reached
                await this.updateQueueItem(queueItem.id, {
                    status: 'failed',
                    attempts: attempts,
                    lastError: error.message,
                    failedAt: new Date().toISOString()
                });

                return {
                    success: false,
                    error: `Upload gagal setelah ${attempts} percobaan: ${error.message}`,
                    willRetry: false
                };
            }
        }
    }

    /**
     * Upload sebagai Facebook Reel
     */
    async uploadAsReel(queueItem, account) {
        try {
            // Initialize FacebookAutomation jika belum ada
            if (!this.facebookAutomation) {
                const FacebookAutomation = require('./facebook-automation');
                this.facebookAutomation = new FacebookAutomation(this.options);
            }

            // Prepare upload data untuk reel
            const uploadData = {
                pageId: queueItem.page,
                videoPath: queueItem.file,
                caption: queueItem.caption || '',
                cookie: account.cookie,
                type: 'reel',
                accountType: account.type || 'personal'
            };

            console.log(`Uploading reel untuk akun: ${account.name}, halaman: ${queueItem.page}`);
            console.log(`File: ${queueItem.file}`);
            console.log(`Caption: ${queueItem.caption || 'Tidak ada caption'}`);

            // Upload menggunakan FacebookAutomation
            const result = await this.facebookAutomation.uploadAsReel(uploadData);

            if (result.success) {
                
                return {
                    success: true,
                    url: result.url,
                    message: result.message || 'Reel berhasil diupload'
                };
            } else {
                console.error(`Reel upload gagal: ${result.error}`);
                return {
                    success: false,
                    error: result.error || 'Reel upload failed'
                };
            }
        } catch (error) {
            console.error('Error uploading reel:', error);
            return {
                success: false,
                error: `Reel upload failed: ${error.message}`
            };
        }
    }

    /**
     * Upload sebagai Video Post
     */
    async uploadAsPost(queueItem, account) {
        try {
            // Initialize FacebookAutomation jika belum ada
            if (!this.facebookAutomation) {
                const FacebookAutomation = require('./facebook-automation');
                this.facebookAutomation = new FacebookAutomation(this.options);
            }

            // Prepare upload data untuk post
            const uploadData = {
                pageId: queueItem.page,
                videoPath: queueItem.file,
                caption: queueItem.caption || '',
                cookie: account.cookie,
                type: 'post',
                accountType: account.type || 'personal'
            };

            console.log(`Uploading video post untuk akun: ${account.name}, halaman: ${queueItem.page}`);
            console.log(`File: ${queueItem.file}`);
            console.log(`Caption: ${queueItem.caption || 'Tidak ada caption'}`);

            // Upload menggunakan FacebookAutomation
            const result = await this.facebookAutomation.uploadAsPost(uploadData);

            if (result.success) {
                console.log(`Video post berhasil diupload: ${result.url}`);
                return {
                    success: true,
                    url: result.url,
                    message: result.message || 'Video post berhasil diupload'
                };
            } else {
                console.error(`Video post upload gagal: ${result.error}`);
                return {
                    success: false,
                    error: result.error || 'Video post upload failed'
                };
            }
        } catch (error) {
            console.error('Error uploading video post:', error);
            return {
                success: false,
                error: `Video post upload failed: ${error.message}`
            };
        }
    }

    /**
     * Schedule upload untuk waktu tertentu
     */
    scheduleUpload(queueItem) {
        const scheduleTime = new Date(queueItem.schedule);

        // Cancel existing job jika ada
        if (this.scheduledJobs.has(queueItem.id)) {
            this.scheduledJobs.get(queueItem.id).destroy();
        }

        // Create cron job untuk scheduled upload
        const cronExpression = `${scheduleTime.getMinutes()} ${scheduleTime.getHours()} ${scheduleTime.getDate()} ${scheduleTime.getMonth() + 1} *`;

        const job = cron.schedule(cronExpression, async () => {
            await this.processUpload(queueItem);
            this.scheduledJobs.delete(queueItem.id);
        });

        this.scheduledJobs.set(queueItem.id, job);
    }

    /**
     * Mulai pemrosesan antrian
     */
    async startQueue() {
        try {
            if (this.isProcessing) {
                return { success: false, error: 'Antrian sedang berjalan' };
            }

            this.isProcessing = true;

            // Process all pending items
            await this.processImmediateUploads();

            return {
                success: true,
                message: 'Antrian dimulai'
            };
        } catch (error) {
            this.isProcessing = false;
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Pause pemrosesan antrian
     */
    pauseQueue() {
        this.isProcessing = false;
        return {
            success: true,
            message: 'Antrian dihentikan'
        };
    }

    /**
     * Bersihkan antrian
     */
    async clearQueue() {
        try {
            // Cancel all scheduled jobs
            for (const [itemId, job] of this.scheduledJobs) {
                job.destroy();
            }
            this.scheduledJobs.clear();

            // Clear queue from database
            const stmt = this.db.prepare('DELETE FROM queue');
            stmt.run();

            return {
                success: true,
                message: 'Antrian berhasil dibersihkan'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Ambil statistik antrian
     */
    getQueueStats() {
        try {
            const now = new Date();

            const statsStmt = this.db.prepare(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
                    SUM(CASE WHEN status = 'retry' THEN 1 ELSE 0 END) as retry,
                    SUM(CASE WHEN status = 'scheduled' AND scheduled_time > ? THEN 1 ELSE 0 END) as scheduled,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
                FROM queue
            `);

            const stats = statsStmt.get(now.toISOString());
            return stats;
        } catch (error) {
            console.error('Error getting queue stats:', error);
            return {
                total: 0,
                pending: 0,
                processing: 0,
                scheduled: 0,
                completed: 0,
                failed: 0,
                retry: 0
            };
        }
    }

    /**
     * Ambil pengaturan aplikasi
     */
    getSettings() {
        try {
            const stmt = this.db.prepare('SELECT key, value FROM settings');
            const rows = stmt.all();

            const settings = {};
            rows.forEach(row => {
                settings[row.key] = JSON.parse(row.value);
            });

            return {
                uploadDelay: settings.uploadDelay || 30000,
                maxRetries: settings.maxRetries || 3,
                autoStartQueue: settings.autoStartQueue || false,
                showNotifications: settings.showNotifications !== undefined ? settings.showNotifications : true,
                showBrowser: settings.showBrowser || false
            };
        } catch (error) {
            console.error('Error getting settings:', error);
            return {
                uploadDelay: 30000,
                maxRetries: 3,
                autoStartQueue: false,
                showNotifications: true,
                showBrowser: false
            };
        }
    }

    /**
     * Update pengaturan aplikasi
     */
    updateSettings(newSettings) {
        try {
            const insertStmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

            Object.entries(newSettings).forEach(([key, value]) => {
                insertStmt.run(key, JSON.stringify(value));
            });

            return {
                success: true,
                message: 'Pengaturan berhasil disimpan'
            };
        } catch (error) {
            console.error('Error updating settings:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate ID unik
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Update options
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        console.log('Queue processor options updated:', this.options);

        // Update FacebookAutomation options jika sudah diinisialisasi
        if (this.facebookAutomation) {
            this.facebookAutomation.updateOptions(this.options);
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        console.log('🧹 Starting cleanup process...');

        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }

        // Destroy all scheduled jobs
        for (const [itemId, job] of this.scheduledJobs) {
            try {
                job.destroy();
            } catch (error) {
                console.log(`Warning: Error destroying job ${itemId}:`, error.message);
            }
        }
        this.scheduledJobs.clear();

        // Close FacebookAutomation browser with force cleanup
        if (this.facebookAutomation) {
            this.facebookAutomation.close();
            this.facebookAutomation = null;
        }

        // Reset processing state
        this.isProcessing = false;

        console.log('✅ Cleanup completed');
    }

    /**
     * Export queue data
     */
    exportQueue() {
        try {
            const queue = this.getQueue();
            return {
                success: true,
                data: queue,
                timestamp: new Date().toISOString(),
                stats: this.getQueueStats()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Import queue data
     */
    importQueue(importData) {
        try {
            if (!Array.isArray(importData)) {
                return { success: false, error: 'Format data tidak valid' };
            }

            // Validate import data and convert to database format
            const validItems = importData.filter(item =>
                item.account && item.file && item.type
            ).map(item => ({
                id: item.id || this.generateId(),
                account_name: item.account || item.account_name,
                page_id: item.page || item.page_id,
                page_name: item.pageName || item.page_name || '',
                type: item.type,
                file_path: item.file || item.file_path,
                file_name: item.fileName || item.file_name || '',
                caption: item.caption,
                status: item.status || 'pending',
                scheduled_time: item.schedule || item.scheduled_time,
                actual_upload_time: item.actualUploadTime || item.actual_upload_time,
                completion_time: item.completionTime || item.completion_time,
                processing_time: item.processingTime || item.processing_time || 0,
                retry_count: item.attempts || item.retry_count || 0,
                error_message: item.errorMessage || item.error_message,
                created_at: item.createdAt || item.created_at || new Date().toISOString(),
                updated_at: item.updatedAt || item.updated_at || new Date().toISOString()
            }));

            // Insert items in transaction for better performance
            const insertStmt = this.db.prepare(`
                INSERT OR REPLACE INTO queue (
                    id, account_name, page_id, page_name, type, file_path, file_name,
                    caption, status, scheduled_time, actual_upload_time, completion_time,
                    processing_time, retry_count, error_message, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            // Use transaction for better performance
            const transaction = this.db.transaction(validItems => {
                for (const item of validItems) {
                    insertStmt.run(
                        item.id,
                        item.account_name,
                        item.page_id,
                        item.page_name,
                        item.type,
                        item.file_path,
                        item.file_name,
                        item.caption,
                        item.status,
                        item.scheduled_time,
                        item.actual_upload_time,
                        item.completion_time,
                        item.processing_time,
                        item.retry_count,
                        item.error_message,
                        item.created_at,
                        item.updated_at
                    );
                }
            });

            transaction(validItems);

            return {
                success: true,
                message: `${validItems.length} item berhasil diimpor`,
                imported: validItems.length,
                invalid: importData.length - validItems.length
            };
        } catch (error) {
            console.error('Error importing queue:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Track upload start di analytics
     */
    async trackUploadStart(queueItem) {
        try {
            const AnalyticsManager = require('./analytics-manager');
            const analyticsManager = new AnalyticsManager();

            // Get account data untuk page info
            const AccountManager = require('./account-manager');
            const accountManager = new AccountManager();
            const account = accountManager.getAccount(queueItem.account);

            const uploadData = {
                id: queueItem.id,
                accountName: queueItem.account,
                pageId: queueItem.page,
                pageName: account?.pages?.find(p => p.id === queueItem.page)?.name || queueItem.page,
                type: queueItem.type,
                fileName: queueItem.file ? queueItem.file.split(/[/\\]/).pop() : 'unknown',
                caption: queueItem.caption,
                hashtags: this.extractHashtags(queueItem.caption),
                status: 'processing',
                scheduledTime: queueItem.schedule,
                actualUploadTime: new Date().toISOString(),
                category: this.categorizeContent(queueItem),
                priority: queueItem.priority || 'medium'
            };

            await analyticsManager.trackUpload(uploadData);
            console.log(`📊 Upload start tracked: ${queueItem.id}`);
        } catch (error) {
            console.error('Error tracking upload start:', error);
        }
    }

    /**
     * Track successful upload di analytics
     */
    async trackUploadSuccess(queueItem, uploadResult, processingTime) {
        try {
            const AnalyticsManager = require('./analytics-manager');
            const analyticsManager = new AnalyticsManager();

            // Get account data untuk page info
            const AccountManager = require('./account-manager');
            const accountManager = new AccountManager();
            const account = accountManager.getAccount(queueItem.account);

            const uploadData = {
                id: queueItem.id,
                accountName: queueItem.account,
                pageId: queueItem.page,
                pageName: account?.pages?.find(p => p.id === queueItem.page)?.name || queueItem.page,
                type: queueItem.type,
                fileName: queueItem.file ? queueItem.file.split(/[/\\]/).pop() : 'unknown',
                caption: queueItem.caption,
                hashtags: this.extractHashtags(queueItem.caption),
                status: 'completed',
                uploadUrl: uploadResult.url,
                scheduledTime: queueItem.schedule,
                actualUploadTime: new Date().toISOString(),
                completionTime: new Date().toISOString(),
                processingTime: processingTime,
                retryCount: queueItem.attempts || 0,
                category: this.categorizeContent(queueItem),
                priority: queueItem.priority || 'medium'
            };

            await analyticsManager.trackUpload(uploadData);
            console.log(`✅ Upload success tracked: ${queueItem.id}`);
        } catch (error) {
            console.error('Error tracking upload success:', error);
        }
    }

    /**
     * Track failed upload di analytics
     */
    async trackUploadFailure(queueItem, errorMessage, processingTime) {
        try {
            const AnalyticsManager = require('./analytics-manager');
            const analyticsManager = new AnalyticsManager();

            // Get account data untuk page info
            const AccountManager = require('./account-manager');
            const accountManager = new AccountManager();
            const account = accountManager.getAccount(queueItem.account);

            const uploadData = {
                id: queueItem.id,
                accountName: queueItem.account,
                pageId: queueItem.page,
                pageName: account?.pages?.find(p => p.id === queueItem.page)?.name || queueItem.page,
                type: queueItem.type,
                fileName: queueItem.file ? queueItem.file.split(/[/\\]/).pop() : 'unknown',
                caption: queueItem.caption,
                hashtags: this.extractHashtags(queueItem.caption),
                status: 'failed',
                scheduledTime: queueItem.schedule,
                actualUploadTime: new Date().toISOString(),
                completionTime: new Date().toISOString(),
                processingTime: processingTime,
                retryCount: queueItem.attempts || 0,
                errorMessage: errorMessage,
                category: this.categorizeContent(queueItem),
                priority: queueItem.priority || 'medium'
            };

            await analyticsManager.trackUpload(uploadData);
            console.log(`❌ Upload failure tracked: ${queueItem.id}`);
        } catch (error) {
            console.error('Error tracking upload failure:', error);
        }
    }

    /**
     * Extract hashtags dari caption
     */
    extractHashtags(caption) {
        if (!caption) return [];

        const hashtagRegex = /#[\w]+/g;
        const matches = caption.match(hashtagRegex);
        return matches ? matches.map(tag => tag.substring(1)) : [];
    }

    /**
     * Categorize content berdasarkan caption dan hashtags
     */
    categorizeContent(queueItem) {
        const text = `${queueItem.caption || ''} ${queueItem.hashtags?.join(' ') || ''}`.toLowerCase();

        if (text.includes('tutorial') || text.includes('how to') || text.includes('learn') || text.includes('education')) {
            return 'education';
        } else if (text.includes('promo') || text.includes('discount') || text.includes('sale') || text.includes('product')) {
            return 'promotional';
        } else if (text.includes('funny') || text.includes('comedy') || text.includes('entertainment') || text.includes('viral')) {
            return 'entertainment';
        } else if (text.includes('news') || text.includes('update') || text.includes('information')) {
            return 'news';
        } else {
            return 'general';
        }
    }

    /**
     * Add log message to processing logs for a queue item
     */
    async addProcessingLog(itemId, message, type = 'info') {
        try {
            const existing = this.getQueueItem(itemId);
            if (!existing) return;

            const currentLogs = existing.processingLogs || '';
            const timestamp = new Date().toISOString().split('T')[1].substring(0, 8); // HH:MM:SS format
            const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '';
            const formattedLog = `${prefix} ${message}`;

            const updatedLogs = currentLogs
                ? `${currentLogs}\n${timestamp}: ${formattedLog}`
                : `${timestamp}: ${formattedLog}`;

            await this.updateQueueItem(itemId, { processingLogs: updatedLogs });
        } catch (error) {
            console.error('Error adding processing log:', error);
        }
    }
}

module.exports = QueueProcessor;
