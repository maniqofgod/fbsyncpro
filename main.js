const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const cron = require('node-cron');

// Inisialisasi electron-store untuk penyimpanan lokal
const store = new Store();

// Konfigurasi aplikasi
let mainWindow;
let isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // Buat browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    minWidth: 1200,
    minHeight: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'ReelSync Pro - Facebook Video Upload Automation',
    show: false // Jangan tampilkan sampai ready-to-show
  });

  // Load aplikasi
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'src/index.html')}`;

  mainWindow.loadFile(path.join(__dirname, 'src/index.html'));

  // Tampilkan window ketika ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Buka DevTools di development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// IPC handlers untuk komunikasi dengan renderer process
ipcMain.handle('get-accounts', () => {
  try {
    // Import dan gunakan AccountManager untuk get accounts
    const AccountManager = require('./src/modules/account-manager');
    const accountManager = new AccountManager();

    const accounts = accountManager.getAllAccounts();

    // Remove cookies from response untuk security (frontend tidak perlu melihat cookies)
    const safeAccounts = accounts.map(account => {
      const { cookie, ...accountWithoutCookie } = account;
      return {
        ...accountWithoutCookie,
        hasCookie: !!cookie // Only indicate if cookie exists
      };
    });

    return safeAccounts;
  } catch (error) {
    console.error('Error in get-accounts handler:', error);
    return [];
  }
});

ipcMain.handle('save-account', async (event, accountData) => {
  try {
    console.log(`Saving account: ${accountData.name}`);

    // Import dan gunakan AccountManager untuk validasi proper
    const AccountManager = require('./src/modules/account-manager');
    const accountManager = new AccountManager();

    const result = await accountManager.saveAccount(accountData);

    if (result.success) {
      const pagesCount = result.validation?.pages?.length || 0;
      const validationType = result.validation?.fromCache ? 'cached' : 'fresh';

      console.log(`Account ${accountData.name} saved successfully`);
      console.log(`Validation: ${validationType}, Pages: ${pagesCount}`);

      // Return enhanced result for frontend
      return {
        success: true,
        account: accountData.name,
        validation: result.validation,
        isEdit: result.isEdit,
        pagesCount: pagesCount
      };
    } else {
      console.log(`Account save failed: ${result.error}`);
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('Error in save-account handler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-account', async (event, accountData) => {
  try {
    console.log(`Testing account: ${accountData.name}`);

    // Import dan gunakan AccountManager untuk test
    const AccountManager = require('./src/modules/account-manager');
    const accountManager = new AccountManager();

    const result = await accountManager.testAccount(accountData);

    const pagesCount = result.pages?.length || 0;
    console.log(`Test result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Found ${pagesCount} pages`);

    // Return enhanced result
    return {
      success: result.success,
      pages: result.pages || [],
      pagesCount: pagesCount,
      message: result.message || result.error,
      error: result.error
    };
  } catch (error) {
    console.error('Error in test-account handler:', error);
    return {
      success: false,
      pages: [],
      pagesCount: 0,
      error: error.message
    };
  }
});

ipcMain.handle('delete-account', async (event, accountName) => {
  try {
    console.log(`Deleting account: ${accountName}`);

    // Import dan gunakan AccountManager untuk delete
    const AccountManager = require('./src/modules/account-manager');
    const accountManager = new AccountManager();

    const result = await accountManager.deleteAccount(accountName);

    if (result.success) {
      console.log(`Account ${accountName} deleted successfully`);
    } else {
      console.log(`Delete account failed: ${result.error}`);
    }

    return result;
  } catch (error) {
    console.error('Error in delete-account handler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-queue', () => {
  return store.get('uploadQueue', []);
});

ipcMain.handle('add-to-queue', (event, queueItem) => {
  try {
    console.log('📥 Adding item to queue:', queueItem);

    const queue = store.get('uploadQueue', []);
    queueItem.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    queueItem.status = 'pending';
    queueItem.createdAt = new Date().toISOString();
    queueItem.attempts = 0;

    console.log(`✅ Generated queue item ID: ${queueItem.id}`);
    queue.push(queueItem);
    store.set('uploadQueue', queue);

    console.log(`📊 Queue now has ${queue.length} items`);
    return { success: true, id: queueItem.id };
  } catch (error) {
    console.error('❌ Error adding to queue:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-queue-item', (event, itemId, updates) => {
  try {
    const queue = store.get('uploadQueue', []);
    const itemIndex = queue.findIndex(item => item.id === itemId);

    if (itemIndex >= 0) {
      queue[itemIndex] = { ...queue[itemIndex], ...updates };
      store.set('uploadQueue', queue);
      return { success: true };
    }

    return { success: false, error: 'Item not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-from-queue', (event, itemId) => {
  try {
    const queue = store.get('uploadQueue', []);
    const filteredQueue = queue.filter(item => item.id !== itemId);
    store.set('uploadQueue', filteredQueue);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-video-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      {
        name: 'Video Files',
        extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm']
      }
    ]
  });

  if (!result.canceled) {
    return { success: true, filePath: result.filePaths[0] };
  }

  return { success: false, error: 'No file selected' };
});

ipcMain.handle('get-app-settings', () => {
  return store.get('settings', {
    uploadDelay: 30000, // 30 detik delay default
    maxRetries: 3,
    autoStartQueue: false,
    showNotifications: true,
    showBrowser: false
  });
});

ipcMain.handle('save-app-settings', (event, settings) => {
  try {
    store.set('settings', settings);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Gemini AI Caption handlers
ipcMain.handle('generate-caption', async (event, fileName, language) => {
  try {
    console.log(`🤖 Generating caption for: ${fileName} in ${language}`);

    // Import GeminiService
    const geminiService = require('./geminiService');

    const result = await geminiService.generateContent(fileName, null, { language });

    if (result.generated) {
      console.log('✅ Caption generated successfully');
      return {
        success: true,
        title: result.title,
        description: result.description,
        tags: result.tags,
        model: result.model,
        modelInfo: result.modelInfo
      };
    } else {
      console.log('❌ Caption generation failed:', result.error);
      return {
        success: false,
        error: result.error || 'Failed to generate caption'
      };
    }
  } catch (error) {
    console.error('❌ Error in generate-caption handler:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('get-gemini-apis', async () => {
  try {
    const geminiStore = require('./geminiStore');

    const apis = await geminiStore.getAllApis();
    console.log(`📋 Retrieved ${apis.length} Gemini APIs`);

    return apis;
  } catch (error) {
    console.error('❌ Error in get-gemini-apis handler:', error);
    return [];
  }
});

ipcMain.handle('save-gemini-api', async (event, apiData) => {
  try {
    console.log(`💾 Saving Gemini API: ${apiData.name}`);

    const geminiStore = require('./geminiStore');
    const geminiService = require('./geminiService');

    let result;

    if (apiData.id) {
      // Update existing API
      console.log(`🔄 Updating existing API with ID: ${apiData.id}`);
      // For security, don't update API key if not provided
      if (apiData.apiKey && apiData.apiKey !== 'existing') {
        // Validate new key first
        const isValid = await geminiService.validateApiKey(apiData.apiKey);
        if (!isValid) {
          return { success: false, error: 'Invalid API key' };
        }
      }

      // Update in store
      result = await geminiStore.addApi(apiData.apiKey, apiData.name, apiData.id);
    } else {
      // Add new API
      console.log('➕ Adding new API');

      // Validate API key first
      const isValid = await geminiService.validateApiKey(apiData.apiKey);
      if (!isValid) {
        return { success: false, error: 'Invalid API key' };
      }

      result = await geminiStore.addApi(apiData.apiKey, apiData.name);
    }

    console.log('✅ Gemini API saved successfully');
    return { success: true, api: result };
  } catch (error) {
    console.error('❌ Error in save-gemini-api handler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-gemini-api', async (event, apiId) => {
  try {
    console.log(`🗑️ Deleting Gemini API: ${apiId}`);

    const geminiStore = require('./geminiStore');

    const result = await geminiStore.deleteApi(apiId);

    if (result) {
      console.log('✅ Gemini API deleted successfully');
      return { success: true };
    } else {
      console.log('❌ API not found or delete failed');
      return { success: false, error: 'API not found' };
    }
  } catch (error) {
    console.error('❌ Error in delete-gemini-api handler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-gemini-api', async (event, apiKey) => {
  try {
    console.log('🧪 Testing Gemini API key');

    const geminiService = require('./geminiService');

    const isValid = await geminiService.validateApiKey(apiKey);

    if (isValid) {
      console.log('✅ API key is valid');
      return { success: true };
    } else {
      console.log('❌ API key is invalid');
      return { success: false, error: 'Invalid API key' };
    }
  } catch (error) {
    console.error('❌ Error in test-gemini-api handler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-gemini-stats', async () => {
  try {
    console.log('📊 Getting Gemini usage stats');

    const geminiStore = require('./geminiStore');

    const stats = await geminiStore.getUsageStats();

    if (stats) {
      console.log('✅ Stats retrieved successfully');
      return stats;
    } else {
      console.log('❌ Failed to retrieve stats');
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        successRate: '0%',
        recentRequests: 0,
        recentSuccessRate: '0%',
        averageResponseTime: 0
      };
    }
  } catch (error) {
    console.error('❌ Error in get-gemini-stats handler:', error);
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      successRate: '0%',
      recentRequests: 0,
      recentSuccessRate: '0%',
      averageResponseTime: 0
    };
  }
});

ipcMain.handle('start-queue', async (event) => {
  try {
    console.log('🚀 Starting queue processing...');

    // Use global queue processor if available
    if (globalQueueProcessor) {
      // Update settings before starting
      const settings = store.get('settings', {
        uploadDelay: 30000,
        maxRetries: 3,
        autoStartQueue: false,
        showNotifications: true,
        showBrowser: false
      });

      console.log(`⚙️ Current settings:`, settings);

      globalQueueProcessor.updateOptions({
        headless: !settings.showBrowser,
        showBrowser: settings.showBrowser
      });

      // Check current queue status
      const currentQueue = globalQueueProcessor.getQueue();
      console.log(`📊 Current queue status: ${currentQueue.length} items`);
      console.log(`📋 Queue items:`, currentQueue.map(item => ({
        id: item.id,
        type: item.type,
        status: item.status,
        account: item.account,
        page: item.page
      })));

      // Start queue processing
      const result = await globalQueueProcessor.startQueue();

      if (result.success) {
        console.log('✅ Queue processing started successfully');
        console.log(`📝 Message: ${result.message}`);

        // Also start immediate processing if there are pending items
        const pendingItems = currentQueue.filter(item =>
          item.status === 'pending' &&
          (!item.schedule || new Date(item.schedule) <= new Date())
        );

        if (pendingItems.length > 0) {
          console.log(`🎬 Starting immediate processing for ${pendingItems.length} items...`);
          globalQueueProcessor.processImmediateUploads().catch(error => {
            console.error('❌ Error in immediate processing:', error);
          });
        }

        return { success: true, message: result.message };
      } else {
        console.log('❌ Queue processing failed:', result.error);
        return { success: false, error: result.error };
      }
    } else {
      console.log('❌ Queue processor not initialized');
      return { success: false, error: 'Queue processor not initialized' };
    }
  } catch (error) {
    console.error('❌ Error in start-queue handler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('process-queue-manually', async (event) => {
  try {
    console.log('🔄 Manual queue processing triggered...');

    if (globalQueueProcessor) {
      // Process immediate uploads manually
      await globalQueueProcessor.processImmediateUploads();

      // Get updated queue status
      const queue = globalQueueProcessor.getQueue();
      const stats = globalQueueProcessor.getQueueStats();

      console.log(`📊 Manual processing completed. Queue stats:`, stats);

      return {
        success: true,
        stats: stats,
        message: `Processed ${stats.total} items, ${stats.completed} completed, ${stats.failed} failed`
      };
    } else {
      return { success: false, error: 'Queue processor not available' };
    }
  } catch (error) {
    console.error('❌ Error in manual queue processing:', error);
    return { success: false, error: error.message };
  }
});

// Analytics handlers
ipcMain.handle('get-analytics-data', async (event, timeRange = '30d') => {
  try {
    console.log(`📊 Getting analytics data for time range: ${timeRange}`);

    if (!globalAnalyticsManager) {
      // Initialize analytics manager if not exists
      const AnalyticsManager = require('./src/modules/analytics-manager');
      globalAnalyticsManager = new AnalyticsManager();
    }

    const dashboardData = await globalAnalyticsManager.getDashboardData(timeRange);

    if (dashboardData) {
      console.log('✅ Analytics data retrieved successfully');
      return {
        success: true,
        data: dashboardData,
        timeRange: timeRange
      };
    } else {
      console.log('❌ Failed to retrieve analytics data');
      return {
        success: false,
        error: 'Failed to retrieve analytics data',
        data: null
      };
    }
  } catch (error) {
    console.error('❌ Error in get-analytics-data handler:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
});

ipcMain.handle('track-upload', async (event, uploadData) => {
  try {
    console.log(`📊 Tracking upload: ${uploadData.fileName} for ${uploadData.accountName}`);

    if (!globalAnalyticsManager) {
      // Initialize analytics manager if not exists
      const AnalyticsManager = require('./src/modules/analytics-manager');
      globalAnalyticsManager = new AnalyticsManager();
    }

    const result = await globalAnalyticsManager.trackUpload(uploadData);

    if (result.success) {
      console.log(`✅ Upload tracked successfully: ${result.uploadId}`);
      return result;
    } else {
      console.log(`❌ Upload tracking failed: ${result.error}`);
      return result;
    }
  } catch (error) {
    console.error('❌ Error in track-upload handler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-engagement', async (event, uploadId, metrics) => {
  try {
    console.log(`📈 Updating engagement for upload: ${uploadId}`);

    if (!globalAnalyticsManager) {
      // Initialize analytics manager if not exists
      const AnalyticsManager = require('./src/modules/analytics-manager');
      globalAnalyticsManager = new AnalyticsManager();
    }

    const result = await globalAnalyticsManager.updateEngagement(uploadId, metrics);

    if (result.success) {
      console.log(`✅ Engagement updated successfully: ${uploadId}`);
      return result;
    } else {
      console.log(`❌ Engagement update failed: ${result.error}`);
      return result;
    }
  } catch (error) {
    console.error('❌ Error in update-engagement handler:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-analytics', async (event, format = 'json', timeRange = '30d') => {
  try {
    console.log(`📤 Exporting analytics data in ${format} format for ${timeRange}`);

    if (!globalAnalyticsManager) {
      // Initialize analytics manager if not exists
      const AnalyticsManager = require('./src/modules/analytics-manager');
      globalAnalyticsManager = new AnalyticsManager();
    }

    const result = await globalAnalyticsManager.exportData(format, timeRange);

    if (result.success) {
      console.log(`✅ Analytics data exported successfully in ${format} format`);
      return result;
    } else {
      console.log(`❌ Analytics export failed: ${result.error}`);
      return result;
    }
  } catch (error) {
    console.error('❌ Error in export-analytics handler:', error);
    return { success: false, error: error.message };
  }
});

// Global queue processor instance
let globalQueueProcessor = null;

// Global analytics manager instance
let globalAnalyticsManager = null;

// Cleanup function
function cleanup() {
  console.log('🧹 Application cleanup initiated...');

  if (globalQueueProcessor) {
    globalQueueProcessor.cleanup();
    globalQueueProcessor = null;
  }

  console.log('✅ Cleanup completed');
}

// App event listeners
app.whenReady().then(() => {
  createWindow();

  // Initialize global queue processor
  const QueueProcessor = require('./src/modules/queue-processor');
  globalQueueProcessor = new QueueProcessor({
    headless: true, // Default to headless
    showBrowser: false
  });

  // Update queue processor settings when settings change
  const updateQueueProcessorSettings = () => {
    const settings = store.get('settings', {
      uploadDelay: 30000,
      maxRetries: 3,
      autoStartQueue: false,
      showNotifications: true,
      showBrowser: false
    });

    globalQueueProcessor.updateOptions({
      headless: !settings.showBrowser,
      showBrowser: settings.showBrowser
    });
  };

  // Watch for settings changes
  store.onDidChange('settings', updateQueueProcessorSettings);

  // Initial settings update
  updateQueueProcessorSettings();

  // Schedule queue processing (setiap 30 detik untuk immediate uploads)
  cron.schedule('*/30 * * * * *', async () => {
    if (mainWindow && globalQueueProcessor) {
      try {
        console.log('🔄 Running scheduled queue processing...');

        // Process scheduled uploads
        await globalQueueProcessor.processScheduledUploads();

        // Process immediate uploads
        await globalQueueProcessor.processImmediateUploads();

        // Send update to renderer
        mainWindow.webContents.send('process-queue');
        console.log('✅ Scheduled queue processing completed');
      } catch (error) {
        console.error('❌ Error in scheduled queue processing:', error);
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Handle process signals for proper cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, cleaning up...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, cleaning up...');
  cleanup();
  process.exit(0);
});

process.on('beforeExit', () => {
  console.log('🛑 Process beforeExit, cleaning up...');
  cleanup();
});

app.on('window-all-closed', () => {
  console.log('🛑 Window-all-closed event, cleaning up...');
  cleanup();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app quit event
app.on('before-quit', () => {
  console.log('🛑 App before-quit event, cleaning up...');
  cleanup();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});
