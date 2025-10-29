const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Account management
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  saveAccount: (accountData) => ipcRenderer.invoke('save-account', accountData),
  deleteAccount: (accountName) => ipcRenderer.invoke('delete-account', accountName),
  testAccount: (accountData) => ipcRenderer.invoke('test-account', accountData),

  // Queue management
  getQueue: () => ipcRenderer.invoke('get-queue'),
  addToQueue: (queueItem) => ipcRenderer.invoke('add-to-queue', queueItem),
  updateQueueItem: (itemId, updates) => ipcRenderer.invoke('update-queue-item', itemId, updates),
  removeFromQueue: (itemId) => ipcRenderer.invoke('remove-from-queue', itemId),
  startQueue: () => ipcRenderer.invoke('start-queue'),
  processQueueManually: () => ipcRenderer.invoke('process-queue-manually'),

  // File operations
  selectVideoFile: () => ipcRenderer.invoke('select-video-file'),

  // Settings
  getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
  saveAppSettings: (settings) => ipcRenderer.invoke('save-app-settings', settings),

  // Gemini AI Caption
  generateCaption: (fileName, language) => ipcRenderer.invoke('generate-caption', fileName, language),
  getGeminiApis: () => ipcRenderer.invoke('get-gemini-apis'),
  saveGeminiApi: (apiData) => ipcRenderer.invoke('save-gemini-api', apiData),
  deleteGeminiApi: (apiId) => ipcRenderer.invoke('delete-gemini-api', apiId),
  testGeminiApi: (apiKey) => ipcRenderer.invoke('test-gemini-api', apiKey),
  getGeminiStats: () => ipcRenderer.invoke('get-gemini-stats'),

  // Analytics
  getAnalyticsData: (timeRange) => ipcRenderer.invoke('get-analytics-data', timeRange),
  trackUpload: (uploadData) => ipcRenderer.invoke('track-upload', uploadData),
  updateEngagement: (uploadId, metrics) => ipcRenderer.invoke('update-engagement', uploadId, metrics),
  exportAnalytics: (format, timeRange) => ipcRenderer.invoke('export-analytics', format, timeRange),

  // Event listeners
  onQueueProcess: (callback) => ipcRenderer.on('process-queue', callback),
  onLogUpdate: (callback) => ipcRenderer.on('log-update', callback),
  onAccountValidated: (callback) => ipcRenderer.on('account-validated', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Platform info
  platform: process.platform,

  // Version info
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

// Handle security warnings
window.addEventListener('DOMContentLoaded', () => {
  // Disable drag and drop untuk keamanan
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Bisa ditambahkan logic untuk mengirim error ke main process jika perlu
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Bisa ditambahkan logic untuk mengirim error ke main process jika perlu
  });
});
