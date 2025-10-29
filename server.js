const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Database = require('better-sqlite3');
const cron = require('node-cron');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Middleware
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Static file serving
app.use(express.static(path.join(__dirname, 'src')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// File upload configuration
const upload = multer({
    storage: multer.diskStorage({
        destination: path.join(__dirname, 'uploads/'),
        filename: (req, file, cb) => {
            // Generate unique filename but preserve extension
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path.extname(file.originalname);
            cb(null, uniqueSuffix + extension);
        }
    }),
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed'));
        }
    }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Import existing modules (keep unchanged as requested)
const AccountManager = require('./src/modules/account-manager');
const AnalyticsManager = require('./src/modules/analytics-manager');
const QueueProcessor = require('./src/modules/queue-processor');
const geminiService = require('./geminiService');
const geminiStore = require('./geminiStore');

// Initialize global instances
let globalQueueProcessor = null;
let globalAnalyticsManager = null;

// Initialize modules
async function initializeModules() {
    try {
        console.log('🔄 Initializing modules...');

        // Get settings untuk menginisialisasi dengan opsi yang benar
        const settings = getSettings();

        // Initialize queue processor with current settings
        globalQueueProcessor = new QueueProcessor({
            showBrowser: settings.showBrowser
        });

        // Initialize analytics manager
        globalAnalyticsManager = new AnalyticsManager();

        console.log('✅ Modules initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing modules:', error);
    }
}

// Database helper functions
function getSettings() {
    try {
        const settings = {};
        const rows = db.prepare('SELECT key, value FROM settings').all();
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        return {
            uploadDelay: parseInt(settings.uploadDelay) || 30000,
            maxRetries: parseInt(settings.maxRetries) || 3,
            autoStartQueue: settings.autoStartQueue === 'true',
            showNotifications: settings.showNotifications === 'true',
            showBrowser: settings.showBrowser === 'true'
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

function updateSetting(key, value) {
    try {
        db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value.toString());
        return true;
    } catch (error) {
        console.error('Error updating setting:', error);
        return false;
    }
}

function getQueueItems() {
    try {
        return db.prepare('SELECT * FROM queue ORDER BY created_at DESC').all();
    } catch (error) {
        console.error('Error getting queue items:', error);
        return [];
    }
}

function addQueueItem(item) {
    try {
        const stmt = db.prepare(`
            INSERT INTO queue (
                id, account_name, page_id, page_name, type, file_path, file_name,
                caption, status, scheduled_time, actual_upload_time, completion_time,
                processing_time, retry_count, error_message, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            item.id,
            item.account,
            item.page,
            item.pageName || '',
            item.type,
            item.file,
            item.fileName || '',
            item.caption,
            item.status || 'pending',
            item.schedule,
            null,
            null,
            0,
            0,
            null,
            new Date().toISOString(),
            new Date().toISOString()
        );

        return true;
    } catch (error) {
        console.error('Error adding queue item:', error);
        return false;
    }
}

function updateQueueItem(itemId, updates) {
    try {
        const setParts = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (key === 'updated_at') continue; // Auto-update
            setParts.push(`${key} = ?`);
            values.push(value);
        }

        setParts.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(itemId);

        const stmt = db.prepare(`UPDATE queue SET ${setParts.join(', ')} WHERE id = ?`);
        stmt.run(...values);
        return true;
    } catch (error) {
        console.error('Error updating queue item:', error);
        return false;
    }
}

function deleteQueueItem(itemId) {
    try {
        db.prepare('DELETE FROM queue WHERE id = ?').run(itemId);
        return true;
    } catch (error) {
        console.error('Error deleting queue item:', error);
        return false;
    }
}

// API Routes

// Serve main HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Account Management Routes
app.get('/api/accounts', async (req, res) => {
    try {
        const accountManager = new AccountManager();
        const accounts = accountManager.getAllAccounts();

        // Remove cookies from response for security
        const safeAccounts = accounts.map(account => {
            const { cookie, ...accountWithoutCookie } = account;
            return {
                ...accountWithoutCookie,
                hasCookie: !!cookie
            };
        });

        res.json(safeAccounts);
    } catch (error) {
        console.error('Error in get accounts:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/accounts', async (req, res) => {
    try {
        const { name, type, cookie } = req.body;
        const accountManager = new AccountManager();

        const result = await accountManager.saveAccount({ name, type, cookie });

        if (result.success) {
            res.json({
                success: true,
                account: name,
                validation: result.validation,
                isEdit: result.isEdit,
                pagesCount: result.validation?.pages?.length || 0
            });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error saving account:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/accounts/:accountName', async (req, res) => {
    try {
        const { accountName } = req.params;
        const { cookie } = req.body;
        const accountManager = new AccountManager();

        const result = await accountManager.saveAccount({
            name: accountName,
            type: 'personal',
            cookie: cookie
        });

        if (result.success) {
            res.json({
                success: true,
                account: accountName,
                validation: result.validation,
                isEdit: result.isEdit,
                pagesCount: result.validation?.pages?.length || 0
            });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error updating account:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/accounts/:accountName', async (req, res) => {
    try {
        const { accountName } = req.params;
        const accountManager = new AccountManager();

        const result = await accountManager.deleteAccount(accountName);

        if (result.success) {
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/accounts/test', async (req, res) => {
    try {
        const { name, type, cookie } = req.body;
        const accountManager = new AccountManager();

        const result = await accountManager.testAccount({ name: name || 'Test Account', type, cookie });

        res.json({
            success: result.success,
            pages: result.pages || [],
            pagesCount: result.pages?.length || 0,
            message: result.message || result.error,
            error: result.error
        });
    } catch (error) {
        console.error('Error testing account:', error);
        res.status(500).json({
            success: false,
            pages: [],
            pagesCount: 0,
            error: error.message
        });
    }
});

// Queue Management Routes
app.get('/api/queue', (req, res) => {
    try {
        // Use globalQueueProcessor for proper data transformation
        let queue = [];
        if (globalQueueProcessor) {
            queue = globalQueueProcessor.getQueue();
        } else {
            // Fallback to raw database query with transformation
            const rawQueue = getQueueItems();
            queue = rawQueue.map(item => ({
                id: item.id,
                account: item.account_name,
                page: item.page_id,
                pageName: item.page_name,
                type: item.type,
                file: item.file_path,
                fileName: item.file_name,
                caption: item.caption,
                status: item.status,
                schedule: item.scheduled_time,
                actualUploadTime: item.actual_upload_time,
                completionTime: item.completion_time,
                processingTime: item.processing_time,
                attempts: item.retry_count,
                errorMessage: item.error_message,
                createdAt: item.created_at,
                updatedAt: item.updated_at
            }));
        }
        res.json(queue);
    } catch (error) {
        console.error('Error getting queue:', error);
        res.status(500).json([]);
    }
});

app.post('/api/queue', (req, res) => {
    try {
        const formData = req.body;
        const queueItem = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            account: formData.account,
            page: formData.page,
            pageName: formData.pageName,
            type: formData.type,
            file: formData.file, // Always use the file path (uploaded path for processing)
            fileName: formData.fileName || formData.file, // Original filename for AI display
            caption: formData.caption,
            status: 'pending',
            schedule: formData.schedule,
            created_at: new Date().toISOString()
        };

        if (addQueueItem(queueItem)) {
            res.json({ success: true, id: queueItem.id });
        } else {
            res.status(500).json({ success: false, error: 'Failed to add to queue' });
        }
    } catch (error) {
        console.error('Error adding to queue:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/queue/:itemId', (req, res) => {
    try {
        const { itemId } = req.params;
        const updates = req.body;

        if (updateQueueItem(itemId, updates)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, error: 'Failed to update queue item' });
        }
    } catch (error) {
        console.error('Error updating queue item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/queue/:itemId', (req, res) => {
    try {
        const { itemId } = req.params;

        if (deleteQueueItem(itemId)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, error: 'Failed to delete queue item' });
        }
    } catch (error) {
        console.error('Error deleting from queue:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Queue Control Routes
app.post('/api/queue/start', async (req, res) => {
    try {
        console.log('🚀 Starting queue processing...');

        if (!globalQueueProcessor) {
            return res.status(500).json({ success: false, error: 'Queue processor not initialized' });
        }

        // Update settings before starting
        const settings = getSettings();
        console.log(`⚙️ Current settings:`, settings);

        globalQueueProcessor.updateOptions({
            showBrowser: settings.showBrowser
        });

        // Check current queue status
        const currentQueue = getQueueItems();
        console.log(`📊 Current queue status: ${currentQueue.length} items`);

        // Start queue processing
        const result = await globalQueueProcessor.startQueue();

        if (result.success) {
            console.log('✅ Queue processing started successfully');
            console.log(`📝 Message: ${result.message}`);
            res.json({ success: true, message: result.message });
        } else {
            console.log('❌ Queue processing failed:', result.error);
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('❌ Error in start-queue:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/queue/process-manually', async (req, res) => {
    try {
        console.log('🔄 Manual queue processing triggered...');

        if (!globalQueueProcessor) {
            return res.status(500).json({ success: false, error: 'Queue processor not available' });
        }

        // Process immediate uploads manually
        await globalQueueProcessor.processImmediateUploads();

        // Get updated queue status
        const queue = getQueueItems();
        const stats = globalQueueProcessor.getQueueStats();

        console.log(`📊 Manual processing completed. Queue stats:`, stats);

        res.json({
            success: true,
            stats: stats,
            message: `Processed ${stats.total} items, ${stats.completed} completed, ${stats.failed} failed`
        });
    } catch (error) {
        console.error('❌ Error in manual queue processing:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// File Upload Route
app.post('/api/upload', upload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const fileData = {
            success: true,
            filePath: req.file.path,
            fileName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        };

        console.log('📁 File uploaded:', req.file.originalname);
        res.json(fileData);
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Settings Routes
app.get('/api/settings', (req, res) => {
    try {
        const settings = getSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/settings', (req, res) => {
    try {
        const { uploadDelay, maxRetries, autoStartQueue, showNotifications, showBrowser } = req.body;

        updateSetting('uploadDelay', uploadDelay);
        updateSetting('maxRetries', maxRetries);
        updateSetting('autoStartQueue', autoStartQueue);
        updateSetting('showNotifications', showNotifications);
        updateSetting('showBrowser', showBrowser);

        // Immediately sync settings with globalQueueProcessor if initialized
        if (globalQueueProcessor) {
            console.log('🔄 Syncing updated settings with QueueProcessor...');
            globalQueueProcessor.updateOptions({
                showBrowser: showBrowser
            });
            console.log('✅ QueueProcessor settings updated');
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug endpoint to test browser visibility
app.post('/api/debug/browser-visibility', async (req, res) => {
    try {
        console.log('🧪 Testing browser visibility from API...');

        if (!globalQueueProcessor) {
            return res.status(500).json({ success: false, error: 'QueueProcessor not initialized' });
        }

        // Get current settings
        const settings = getSettings();

        console.log('Current settings:', settings);
        console.log('QueueProcessor exists:', !!globalQueueProcessor);

        // Test FacebookAutomation directly if needed
        if (globalQueueProcessor.facebookAutomation) {
            console.log('FacebookAutomation exists, options:', globalQueueProcessor.facebookAutomation.options);

            // Try to initialize if not initialized
            if (!globalQueueProcessor.facebookAutomation.isInitialized) {
                await globalQueueProcessor.facebookAutomation.initialize();
            }

            // Create a test page
            const testPage = await globalQueueProcessor.facebookAutomation.browser.newPage();
            await testPage.goto('https://www.google.com', { waitUntil: 'networkidle2' });

            // Take screenshot as proof
            const screenshotPath = path.join(__dirname, 'debug-api-test.png');
            await testPage.screenshot({ path: screenshotPath, fullPage: true });

            await testPage.close();

            res.json({
                success: true,
                message: 'Browser visibility test completed',
                settings: settings,
                headlessMode: globalQueueProcessor.facebookAutomation.options.headless,
                screenshotSaved: screenshotPath
            });
        } else {
            // Initialize FacebookAutomation for testing
            const FacebookAutomation = require('./src/modules/facebook-automation');
            const testAutomation = new FacebookAutomation({ showBrowser: settings.showBrowser });

            await testAutomation.initialize();
            const testPage = await testAutomation.browser.newPage();
            await testPage.goto('https://www.google.com', { waitUntil: 'networkidle2' });

            const screenshotPath = path.join(__dirname, 'debug-api-test.png');
            await testPage.screenshot({ path: screenshotPath, fullPage: true });

            await testPage.close();
            await testAutomation.close();

            res.json({
                success: true,
                message: 'Browser test completed with temp instance',
                settings: settings,
                headlessMode: testAutomation.options.headless,
                screenshotSaved: screenshotPath
            });
        }
    } catch (error) {
        console.error('❌ Browser visibility test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Gemini AI Routes
app.get('/api/gemini/apis', async (req, res) => {
    try {
        const apis = await geminiStore.getAllApis();
        res.json(apis);
    } catch (error) {
        console.error('Error getting Gemini APIs:', error);
        res.status(500).json([]);
    }
});

app.post('/api/gemini/apis', (req, res) => {
    try {
        const { name, apiKey } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'API name is required' });
        }

        // For new API, key is required
        if (!apiKey || !apiKey.trim()) {
            return res.status(400).json({ success: false, error: 'API key is required' });
        }

        // Validate API key first
        geminiService.validateApiKey(apiKey).then(isValid => {
            if (!isValid) {
                return res.status(400).json({ success: false, error: 'Invalid API key' });
            }

            const result = geminiStore.addApi(apiKey, name);
            res.json({ success: true, api: result });
        }).catch(error => {
            console.error('Error validating API key:', error);
            res.status(500).json({ success: false, error: error.message });
        });
    } catch (error) {
        console.error('Error saving Gemini API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/gemini/apis/:apiId', (req, res) => {
    try {
        const { apiId } = req.params;
        const result = geminiStore.deleteApi(apiId);

        if (result) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, error: 'API not found' });
        }
    } catch (error) {
        console.error('Error deleting Gemini API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/gemini/test-key', (req, res) => {
    try {
        const { apiKey } = req.body;

        if (!apiKey || !apiKey.trim()) {
            return res.status(400).json({ success: false, error: 'API key is required' });
        }

        geminiService.validateApiKey(apiKey).then(isValid => {
            if (isValid) {
                res.json({ success: true });
            } else {
                res.json({ success: false, error: 'Invalid API key' });
            }
        }).catch(error => {
            console.error('Error testing API key:', error);
            res.status(500).json({ success: false, error: error.message });
        });
    } catch (error) {
        console.error('Error in test API key:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/gemini/generate-caption', async (req, res) => {
    try {
        const { fileName, language } = req.body;

        console.log(`🤖 Generating caption for: ${fileName} in ${language}`);

        const result = await geminiService.generateContent(fileName, null, { language });

        if (result.generated) {
            console.log('✅ Caption generated successfully');
            res.json({
                success: true,
                title: result.title,
                description: result.description,
                tags: result.tags,
                model: result.model,
                modelInfo: result.modelInfo
            });
        } else {
            console.log('❌ Caption generation failed:', result.error);
            res.status(500).json({
                success: false,
                error: result.error || 'Failed to generate caption'
            });
        }
    } catch (error) {
        console.error('❌ Error in generate-caption:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/gemini/stats', async (req, res) => {
    try {
        const stats = await geminiStore.getUsageStats();
        res.json(stats || {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            successRate: '0%',
            recentRequests: 0,
            recentSuccessRate: '0%',
            averageResponseTime: 0
        });
    } catch (error) {
        console.error('Error getting Gemini stats:', error);
        res.status(500).json({
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            successRate: '0%',
            recentRequests: 0,
            recentSuccessRate: '0%',
            averageResponseTime: 0
        });
    }
});

// Analytics Routes
app.get('/api/analytics', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '30d';

        console.log(`📊 Getting analytics data for time range: ${timeRange}`);

        if (!globalAnalyticsManager) {
            globalAnalyticsManager = new AnalyticsManager();
        }

        const dashboardData = await globalAnalyticsManager.getDashboardData(timeRange);

        if (dashboardData) {
            console.log('✅ Analytics data retrieved successfully');
            res.json({
                success: true,
                data: dashboardData,
                timeRange: timeRange
            });
        } else {
            console.log('❌ Failed to retrieve analytics data');
            res.status(404).json({
                success: false,
                error: 'Failed to retrieve analytics data',
                data: null
            });
        }
    } catch (error) {
        console.error('❌ Error in get-analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            data: null
        });
    }
});

app.post('/api/analytics/track-upload', async (req, res) => {
    try {
        const uploadData = req.body;

        if (!globalAnalyticsManager) {
            globalAnalyticsManager = new AnalyticsManager();
        }

        const result = await globalAnalyticsManager.trackUpload(uploadData);

        if (result.success) {
            console.log(`✅ Upload tracked successfully: ${result.uploadId}`);
            res.json(result);
        } else {
            console.log(`❌ Upload tracking failed: ${result.error}`);
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('❌ Error in track-upload:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/analytics/update-engagement', async (req, res) => {
    try {
        const { uploadId, metrics } = req.body;

        if (!globalAnalyticsManager) {
            globalAnalyticsManager = new AnalyticsManager();
        }

        const result = await globalAnalyticsManager.updateEngagement(uploadId, metrics);

        if (result.success) {
            console.log(`✅ Engagement updated successfully: ${uploadId}`);
            res.json(result);
        } else {
            console.log(`❌ Engagement update failed: ${result.error}`);
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('❌ Error in update-engagement:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/analytics/export', async (req, res) => {
    try {
        const { format, timeRange } = req.body;

        console.log(`📤 Exporting analytics data in ${format} format for ${timeRange}`);

        if (!globalAnalyticsManager) {
            globalAnalyticsManager = new AnalyticsManager();
        }

        const result = await globalAnalyticsManager.exportData(format || 'json', timeRange || '30d');

        if (result.success) {
            console.log(`✅ Analytics data exported successfully in ${format} format`);
            res.json(result);
        } else {
            console.log(`❌ Analytics export failed: ${result.error}`);
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('❌ Error in export-analytics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Background processing scheduler (similar to Electron cron)
cron.schedule('*/30 * * * * *', async () => {
    if (!globalQueueProcessor) return;

    try {
        console.log('🔄 Running scheduled queue processing...');

        // Process scheduled uploads
        await globalQueueProcessor.processScheduledUploads();

        // Process immediate uploads
        await globalQueueProcessor.processImmediateUploads();

        console.log('✅ Scheduled queue processing completed');
    } catch (error) {
        console.error('❌ Error in scheduled queue processing:', error);
    }
});

// Cleanup on exit
process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received, cleaning up...');
    if (globalQueueProcessor) {
        globalQueueProcessor.cleanup();
        globalQueueProcessor = null;
    }
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received, cleaning up...');
    if (globalQueueProcessor) {
        globalQueueProcessor.cleanup();
        globalQueueProcessor = null;
    }
    db.close();
    process.exit(0);
});

// Start server
async function startServer() {
    try {
        await initializeModules();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 ReelSync Pro web server running on http://0.0.0.0:${PORT}`);
            console.log('💡 Open your browser and go to the URL above');
        });
    } catch (error) {
        console.error('❌ Error starting server:', error);
        process.exit(1);
    }
}

startServer();
