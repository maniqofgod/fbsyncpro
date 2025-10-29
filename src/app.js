// Application State
let appState = {
    accounts: [],
    currentAccount: null,
    uploadQueue: [],
    settings: {
        uploadDelay: 30000,
        maxRetries: 3,
        autoStartQueue: false,
        showNotifications: true,
        showBrowser: false
    },
    logs: [],
    geminiApis: []
};

// API Base URL
const API_BASE = window.location.origin;

// DOM Elements
let elements = {};

// Analytics state
let analyticsState = {
    currentTimeRange: '30d',
    dashboardData: null,
    isLoading: false
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    initializeElements();
    setupEventListeners();
    await loadAppData();
    setupNavigation();
    updateStatusBar();
});

// Initialize DOM elements
function initializeElements() {
    elements = {
        // Navigation
        navTabs: document.querySelectorAll('.nav-tab'),
        tabPanes: document.querySelectorAll('.tab-pane'),

        // Account Management
        accountsList: document.getElementById('accounts-list'),
        addAccountBtn: document.getElementById('add-account-btn'),
        accountModal: document.getElementById('account-modal'),
        accountForm: document.getElementById('account-form'),
        accountName: document.getElementById('account-name'),
        accountType: document.getElementById('account-type'),
        accountCookie: document.getElementById('account-cookie'),
        testCookieBtn: document.getElementById('test-cookie-btn'),
        saveAccountBtn: document.getElementById('save-account-btn'),
        cancelAccountBtn: document.getElementById('cancel-account-btn'),
        modalClose: document.getElementById('modal-close'),

        // Upload Form
        uploadForm: document.getElementById('upload-form'),
        accountSelect: document.getElementById('account-select'),
        pageSelect: document.getElementById('page-select'),
        uploadType: document.querySelectorAll('input[name="upload-type"]'),
        videoFile: document.getElementById('video-file'),
        selectFileBtn: document.getElementById('select-file-btn'),
        caption: document.getElementById('caption'),
        scheduleTime: document.getElementById('schedule-time'),
        addToQueueBtn: document.getElementById('add-to-queue-btn'),

        // Queue Management
        queueList: document.getElementById('queue-list'),
        refreshQueueBtn: document.getElementById('refresh-queue-btn'),
        pendingCount: document.getElementById('pending-count'),
        processingCount: document.getElementById('processing-count'),
        completedCount: document.getElementById('completed-count'),
        failedCount: document.getElementById('failed-count'),

        // Settings
        settingsForm: document.getElementById('settings-form'),
        uploadDelay: document.getElementById('upload-delay'),
        maxRetries: document.getElementById('max-retries'),
        autoStartQueue: document.getElementById('auto-start-queue'),
        showNotifications: document.getElementById('show-notifications'),
        showBrowser: document.getElementById('show-browser'),
        resetSettingsBtn: document.getElementById('reset-settings-btn'),

        // Logs
        logsContainer: document.getElementById('logs-container'),
        clearLogsBtn: document.getElementById('clear-logs-btn'),
        exportLogsBtn: document.getElementById('export-logs-btn'),

        // Status
        statusText: document.getElementById('status-text'),
        queueStatus: document.querySelector('#queue-status'),

        // Gemini AI Caption
        captionLanguage: document.getElementById('caption-language'),
        generateCaptionBtn: document.getElementById('generate-caption-btn'),
        geminiModal: document.getElementById('gemini-modal'),
        geminiForm: document.getElementById('gemini-form'),
        geminiApiName: document.getElementById('gemini-api-name'),
        geminiApiKey: document.getElementById('gemini-api-key'),
        testGeminiApiBtn: document.getElementById('test-gemini-api-btn'),
        saveGeminiBtn: document.getElementById('save-gemini-btn'),
        cancelGeminiBtn: document.getElementById('cancel-gemini-btn'),
        geminiModalClose: document.getElementById('gemini-modal-close'),
        geminiModalTitle: document.getElementById('gemini-modal-title'),
        addGeminiApiBtn: document.getElementById('add-gemini-api-btn'),
        geminiApisList: document.getElementById('gemini-apis-list'),
        geminiApisCount: document.getElementById('gemini-apis-count'),
        geminiUsageToday: document.getElementById('gemini-usage-today'),
        geminiTotalRequests: document.getElementById('gemini-total-requests'),
        geminiSuccessRate: document.getElementById('gemini-success-rate'),
        usageStats: document.getElementById('usage-stats')
    };
}

// Setup event listeners
function setupEventListeners() {
    // Navigation tabs
    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Account Management
    elements.addAccountBtn.addEventListener('click', () => openAccountModal());
    elements.saveAccountBtn.addEventListener('click', saveAccount);
    elements.cancelAccountBtn.addEventListener('click', closeAccountModal);
    elements.modalClose.addEventListener('click', closeAccountModal);
    elements.testCookieBtn.addEventListener('click', testCookie);

    // Upload Form - will be modified for web browser file upload
    elements.selectFileBtn.addEventListener('click', selectVideoFile);
    elements.accountSelect.addEventListener('change', () => {
        updatePageSelect();
        updateSendButtonState();
    });
    elements.pageSelect.addEventListener('change', updateSendButtonState);
    elements.videoFile.addEventListener('input', updateSendButtonState);
    elements.uploadForm.addEventListener('submit', addToQueue);
    elements.addToQueueBtn.addEventListener('click', addToQueue);

    // Queue Management
    elements.refreshQueueBtn.addEventListener('click', refreshQueue);

    // Settings
    elements.settingsForm.addEventListener('submit', saveSettings);
    elements.resetSettingsBtn.addEventListener('click', resetSettings);

    // Logs
    elements.clearLogsBtn.addEventListener('click', clearLogs);
    elements.exportLogsBtn.addEventListener('click', exportLogs);

    // Gemini AI Caption
    elements.generateCaptionBtn.addEventListener('click', generateCaption);
    elements.addGeminiApiBtn.addEventListener('click', () => openGeminiModal());
    elements.saveGeminiBtn.addEventListener('click', saveGeminiApi);
    elements.cancelGeminiBtn.addEventListener('click', closeGeminiModal);
    elements.geminiModalClose.addEventListener('click', closeGeminiModal);
    elements.testGeminiApiBtn.addEventListener('click', testGeminiApi);
}

// Setup navigation
function setupNavigation() {
    switchTab('accounts'); // Start with accounts tab
}

// Load application data
async function loadAppData() {
    try {
        // Load accounts
        const accountsResponse = await fetch(`${API_BASE}/api/accounts`);
        appState.accounts = await accountsResponse.json();

        // Load queue
        const queueResponse = await fetch(`${API_BASE}/api/queue`);
        appState.uploadQueue = await queueResponse.json();

        // Load settings
        const settingsResponse = await fetch(`${API_BASE}/api/settings`);
        appState.settings = await settingsResponse.json();

        // Update UI
        updateAccountsList();
        updateQueueDisplay();
        updateSettingsDisplay();

        // Load Gemini data in background
        await updateGeminiDisplay();

        // Force button state update after a short delay to ensure all elements are ready
        setTimeout(() => {
            updateSendButtonState();
        }, 100);

        addLog({
            level: 'info',
            message: 'Aplikasi berhasil dimuat',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error loading app data:', error);
        addLog({
            level: 'error',
            message: `Gagal memuat data aplikasi: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
}

// Tab switching
function switchTab(tabName) {
    // Update navigation
    elements.navTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });

    // Update content
    elements.tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === tabName) {
            pane.classList.add('active');
        }
    });

    // Update specific tab content
    updateTabContent(tabName);
}

// Update tab content based on active tab
function updateTabContent(tabName) {
    switch (tabName) {
        case 'accounts':
            updateAccountsList();
            break;
        case 'upload':
            updateSendButtonState(); // Update button state when switching to upload tab
            break;
        case 'queue':
            updateQueueDisplay();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'gemini':
            updateGeminiDisplay();
            break;
        case 'logs':
            updateLogsDisplay();
            break;
    }
}

// Account Management Functions
function openAccountModal(account = null) {
    if (account) {
        elements.accountName.value = account.name;
        elements.accountType.value = 'personal'; // Always personal
        elements.accountCookie.value = ''; // Don't show cookie for security reasons
        elements.accountCookie.placeholder = 'Cookie tersimpan (tidak ditampilkan untuk keamanan)';
        document.getElementById('modal-title').textContent = 'Edit Akun Facebook';
        document.getElementById('save-account-btn').innerHTML = '<i class="fas fa-save"></i> Update & Validasi';
    } else {
        elements.accountName.value = '';
        elements.accountType.value = 'personal'; // Always personal
        elements.accountCookie.value = '';
        elements.accountCookie.placeholder = 'Masukkan cookie Facebook Anda di sini...';
        document.getElementById('modal-title').textContent = 'Tambah Akun Facebook';
        document.getElementById('save-account-btn').innerHTML = '<i class="fas fa-save"></i> Simpan & Validasi';
    }

    elements.accountModal.classList.add('show');
}

function closeAccountModal() {
    elements.accountModal.classList.remove('show');
    elements.accountForm.reset();

    // Reset placeholder text
    elements.accountCookie.placeholder = 'Masukkan cookie Facebook Anda di sini...';
    elements.accountType.value = 'personal'; // Always personal
    document.getElementById('modal-title').textContent = 'Tambah Akun Facebook';
    document.getElementById('save-account-btn').innerHTML = '<i class="fas fa-save"></i> Simpan & Validasi';
}

async function saveAccount(e) {
    e.preventDefault();

    const accountName = elements.accountName.value.trim();
    const accountType = elements.accountType.value;
    const accountCookie = elements.accountCookie.value.trim();

    if (!accountName) {
        showToast('Nama akun harus diisi', 'error');
        return;
    }

    // Check if this is an edit operation (check if account already exists)
    const existingAccount = appState.accounts.find(acc => acc.name === accountName);
    const isEdit = !!existingAccount;

    if (isEdit && !accountCookie) {
        // For edit operation, if no new cookie provided, just update account info
        const accountData = {
            name: accountName,
            type: accountType,
            cookie: '' // Will be handled by AccountManager
        };

        try {
            elements.saveAccountBtn.disabled = true;
            elements.saveAccountBtn.innerHTML = '<div class="loading"></div> Updating...';

            const response = await fetch(`${API_BASE}/api/accounts/${accountName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cookie: accountData.cookie })
            });
            const result = await response.json();

            if (result.success) {
                await loadAppData(); // Reload accounts
                closeAccountModal();
                showToast('Akun berhasil diupdate', 'success');
            } else {
                showToast(`Gagal mengupdate akun: ${result.error}`, 'error');
            }
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            elements.saveAccountBtn.disabled = false;
            elements.saveAccountBtn.innerHTML = '<i class="fas fa-save"></i> Update & Validasi';
        }
    } else if (!isEdit && !accountCookie) {
        // For new account, cookie is required
        showToast('Cookie harus diisi untuk akun baru', 'error');
        return;
    } else {
        // New account or edit with new cookie
        const accountData = {
            name: accountName,
            type: accountType,
            cookie: accountCookie
        };

        try {
            elements.saveAccountBtn.disabled = true;
            elements.saveAccountBtn.innerHTML = '<div class="loading"></div> Memvalidasi...';

            const response = await fetch(`${API_BASE}/api/accounts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(accountData)
            });
            const result = await response.json();

            if (result.success) {
                await loadAppData(); // Reload accounts
                closeAccountModal();

                let message = '';
                if (isEdit) {
                    if (result.validation?.fromCache) {
                        message = 'Akun berhasil diupdate (menggunakan validasi sebelumnya)';
                    } else {
                        message = 'Akun berhasil diupdate dan divalidasi';
                    }
                } else {
                    message = 'Akun berhasil disimpan dan divalidasi';
                }

                showToast(message, 'success');

                if (result.pagesCount > 0) {
                    showToast(`Ditemukan ${result.pagesCount} halaman Facebook`, 'info');
                }

                if (result.validation?.error) {
                    showToast(`Catatan: ${result.validation.error}`, 'warning');
                }
            } else {
                showToast(`Gagal menyimpan akun: ${result.error}`, 'error');
            }
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            elements.saveAccountBtn.disabled = false;
            elements.saveAccountBtn.innerHTML = '<i class="fas fa-save"></i> Simpan & Validasi';
        }
    }
}

async function testCookie() {
    const cookie = elements.accountCookie.value.trim();
    const accountType = elements.accountType.value;

    if (!cookie) {
        showToast('Cookie harus diisi untuk test', 'warning');
        return;
    }

    try {
        elements.testCookieBtn.disabled = true;
        elements.testCookieBtn.innerHTML = '<div class="loading"></div> Testing...';

        const testData = {
            name: elements.accountName.value.trim() || 'Test Account',
            type: accountType,
            cookie: cookie
        };

        const response = await fetch(`${API_BASE}/api/accounts/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        const result = await response.json();

        if (result.success) {
            const pagesCount = result.pagesCount || result.pages.length;
            showToast(`Test berhasil! Ditemukan ${pagesCount} halaman`, 'success');

            if (result.pages && result.pages.length > 0) {
                console.log('Found pages:', result.pages);
                // Show first few pages in toast
                const pageNames = result.pages.slice(0, 3).map(p => p.name).join(', ');
                const moreText = result.pages.length > 3 ? ` +${result.pages.length - 3} lainnya` : '';
                showToast(`Halaman: ${pageNames}${moreText}`, 'info');
            }
        } else {
            showToast(`Test gagal: ${result.error || result.message}`, 'error');
        }
    } catch (error) {
        showToast(`Test failed: ${error.message}`, 'error');
    } finally {
        elements.testCookieBtn.disabled = false;
        elements.testCookieBtn.innerHTML = '<i class="fas fa-vial"></i> Test Cookie';
    }
}

function updateAccountsList() {
    if (appState.accounts.length === 0) {
        elements.accountsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>Belum ada akun</h3>
                <p>Klik tombol "Tambah Akun" untuk menambahkan akun Facebook pertama Anda.</p>
            </div>
        `;
        return;
    }

    elements.accountsList.innerHTML = appState.accounts.map(account => `
        <div class="account-card">
            <div class="account-info">
                <h4>${account.name}</h4>
                <p>Tipe: Personal | Halaman: ${account.pages ? account.pages.length : 0} tersimpan</p>
                <small>Status: ${account.valid ? 'Valid' : 'Tidak Valid'}</small>
            </div>
            <div class="account-actions">
                <button class="btn-secondary" onclick="editAccount('${account.name}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteAccount('${account.name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Update account select in upload form
    updateAccountSelect();
}

function updateAccountSelect() {
    elements.accountSelect.innerHTML = '<option value="">-- Pilih Akun --</option>' +
        appState.accounts.map(account => `<option value="${account.name}">${account.name}</option>`).join('');

    if (appState.accounts.length > 0) {
        elements.accountSelect.disabled = false;
    } else {
        elements.accountSelect.disabled = true;
    }
}

function updatePageSelect() {
    const selectedAccount = appState.accounts.find(acc => acc.name === elements.accountSelect.value);

    if (selectedAccount && selectedAccount.pages) {
        elements.pageSelect.innerHTML = '<option value="">-- Pilih Halaman --</option>' +
            selectedAccount.pages.map(page => `<option value="${page.id}">${page.name}</option>`).join('');
        elements.pageSelect.disabled = false;
    } else {
        elements.pageSelect.innerHTML = '<option value="">-- Pilih Halaman --</option>';
        elements.pageSelect.disabled = true;
    }
}

// Make functions globally available
window.editAccount = async function(accountName) {
    const account = appState.accounts.find(acc => acc.name === accountName);
    if (account) {
        openAccountModal(account);
    }
};

window.deleteAccount = async function(accountName) {
    if (confirm(`Apakah Anda yakin ingin menghapus akun "${accountName}"?`)) {
        try {
            const response = await fetch(`${API_BASE}/api/accounts/${accountName}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                await loadAppData();
                showToast('Akun berhasil dihapus', 'success');
            } else {
                showToast(`Gagal menghapus akun: ${result.error}`, 'error');
            }
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    }
};

// Upload Functions
async function selectVideoFile() {
    try {
        // Create a hidden file input for web browser file selection
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'video/*';
        fileInput.style.display = 'none';

        fileInput.onchange = async (event) => {
            const file = event.target.files[0];
            if (file) {
                showToast('Mengupload file...', 'info');

                // Upload file to server immediately
                const formData = new FormData();
                formData.append('video', file);

                try {
                    const uploadResponse = await fetch(`${API_BASE}/api/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    const uploadResult = await uploadResponse.json();

                    if (uploadResult.success) {
                        // Keep original filename for AI generation, store uploaded path separately
                        elements.videoFile.value = file.name; // Keep filename for AI
                        elements.videoFile._uploadedFilePath = uploadResult.filePath; // Store actual path for queue
                        elements.videoFile._selectedFile = file;
                        updateSendButtonState();
                        showToast(`File berhasil diupload: ${file.name}`, 'success');
                    } else {
                        showToast(`Upload gagal: ${uploadResult.error}`, 'error');
                    }
                } catch (uploadError) {
                    showToast(`Error upload: ${uploadError.message}`, 'error');
                }
            }
            // Remove the input element
            document.body.removeChild(fileInput);
        };

        // Add to DOM and trigger click
        document.body.appendChild(fileInput);
        fileInput.click();
    } catch (error) {
        showToast(`Error memilih file: ${error.message}`, 'error');
    }
}

async function addToQueue(e) {
    e.preventDefault();

    const formData = {
        account: elements.accountSelect.value,
        page: elements.pageSelect.value,
        type: document.querySelector('input[name="upload-type"]:checked').value,
        file: elements.videoFile._uploadedFilePath || elements.videoFile.value, // Use uploaded path for processing
        fileName: elements.videoFile.value, // Keep original filename for AI
        caption: elements.caption.value,
        schedule: elements.scheduleTime.value ? new Date(elements.scheduleTime.value).toISOString() : null
    };

    // No frontend validation - allow submission with any data
    try {
        // Update button state to loading
        updateSendButtonState(true);

        const result = await fetch(`${API_BASE}/api/queue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        const response = await result.json();

        if (response.success) {
            // Track upload di analytics
            await trackUploadToAnalytics(formData, response.id);

            elements.uploadForm.reset();
            updateSendButtonState(); // Reset button state
            await loadAppData();
            switchTab('queue');
            showToast('Video berhasil ditambahkan ke antrian', 'success');
        } else {
            updateSendButtonState(); // Reset button state
            showToast(`Gagal menambahkan ke antrian: ${response.error}`, 'error');
        }
    } catch (error) {
        updateSendButtonState(); // Reset button state
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Update send button state - always enabled
function updateSendButtonState(isLoading = false) {
    const buttonText = elements.addToQueueBtn.querySelector('.btn-text');
    const buttonIcon = elements.addToQueueBtn.querySelector('i');

    // Debug logging
    console.log('Button State Debug:', {
        accountSelect: elements.accountSelect.value,
        pageSelect: elements.pageSelect.value,
        videoFile: elements.videoFile.value,
        isLoading: isLoading
    });

    if (isLoading) {
        // Loading state - only when actually submitting
        elements.addToQueueBtn.disabled = true;
        buttonText.textContent = 'Mengirim...';
        buttonIcon.className = 'fas fa-paper-plane';
        return;
    }

    // Button is always enabled - no field validation
    elements.addToQueueBtn.disabled = false;
    buttonText.textContent = 'Kirim ke Facebook';
    buttonIcon.className = 'fas fa-paper-plane';
}

// Queue Management Functions
function updateQueueDisplay() {
    const stats = {
        pending: appState.uploadQueue.filter(item => item.status === 'pending').length,
        processing: appState.uploadQueue.filter(item => item.status === 'processing').length,
        completed: appState.uploadQueue.filter(item => item.status === 'completed').length,
        failed: appState.uploadQueue.filter(item => item.status === 'failed').length
    };

    elements.pendingCount.textContent = stats.pending;
    elements.processingCount.textContent = stats.processing;
    elements.completedCount.textContent = stats.completed;
    elements.failedCount.textContent = stats.failed;

    if (appState.uploadQueue.length === 0) {
        elements.queueList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <h3>Antrian kosong</h3>
                <p>Tambahkan video ke antrian untuk mulai upload.</p>
            </div>
        `;
        return;
    }

    elements.queueList.innerHTML = appState.uploadQueue.map(item => {
        // Get account and page information
        const account = appState.accounts.find(acc => acc.name === item.account);
        const page = account?.pages?.find(p => p.id === item.page);
        const accountName = item.account;
        const pageName = page?.name || item.pageName || item.page || 'Unknown';
        const pageId = item.page;

        // Get processing logs for processing items
        let processingLogsHtml = '';
        if (item.status === 'processing' && item.processingLogs) {
            const logs = item.processingLogs.split('\n').slice(-8); // Show last 8 logs
            processingLogsHtml = `
                <div class="processing-logs">
                    <h5>Processing Logs:</h5>
                    <div class="logs-content">
                        ${logs.map(log => `<div class="log-line">${log}</div>`).join('')}
                    </div>
                </div>
            `;
        }

        return `
            <div class="queue-item">
                <div class="queue-item-info">
                    <div class="queue-item-meta">Akun: ${accountName} | Halaman: ${pageName}-${pageId} | ${item.type === 'reel' ? 'Reels' : 'Video Post'}</div>
                    <div class="queue-item-title">${item.caption || 'Tanpa caption'}</div>
                    ${processingLogsHtml}
                </div>
                <div class="queue-item-status ${item.status}">
                    ${item.status}
                </div>
                <div class="queue-item-actions">
                    <button class="btn-danger" onclick="removeFromQueue('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    updateStatusBar();
}

// Make function globally available
window.removeFromQueue = async function(itemId) {
    if (confirm('Apakah Anda yakin ingin menghapus item ini dari antrian?')) {
        try {
            const response = await fetch(`${API_BASE}/api/queue/${itemId}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                await loadAppData();
                showToast('Item berhasil dihapus dari antrian', 'success');
            } else {
                showToast(`Gagal menghapus item: ${result.error}`, 'error');
            }
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    }
};

async function startQueue() {
    try {
        elements.startQueueBtn.disabled = true;
        elements.startQueueBtn.innerHTML = '<div class="loading"></div> Memulai...';

        // Start queue processing using API
        const result = await fetch(`${API_BASE}/api/queue/start`, {
            method: 'POST'
        });
        const response = await result.json();

        if (response.success) {
            showToast('Antrian dimulai', 'success');
            await loadAppData(); // Reload queue data
        } else {
            showToast(`Gagal memulai antrian: ${response.error}`, 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        elements.startQueueBtn.disabled = false;
        elements.startQueueBtn.innerHTML = '<i class="fas fa-play"></i> Mulai Proses';
    }
}

async function pauseQueue() {
    showToast('Fitur pause akan diimplementasikan', 'info');
}

async function clearQueue() {
    if (confirm('Apakah Anda yakin ingin membersihkan seluruh antrian?')) {
        try {
            // Remove all items from queue
            for (const item of appState.uploadQueue) {
                await fetch(`${API_BASE}/api/queue/${item.id}`, {
                    method: 'DELETE'
                });
            }
            await loadAppData();
            showToast('Antrian berhasil dibersihkan', 'success');
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    }
}

async function refreshQueue() {
    try {
        // Refresh queue data
        const queueResponse = await fetch(`${API_BASE}/api/queue`);
        const newQueue = await queueResponse.json();
        appState.uploadQueue = newQueue;
        updateQueueDisplay();
        showToast('Status antrian diperbaharui', 'success');
    } catch (error) {
        showToast(`Gagal memperbaharui status antrian: ${error.message}`, 'error');
    }
}

async function processQueue() {
    // This would be implemented with the actual queue processing logic
    addLog({
        level: 'info',
        message: 'Memproses antrian upload...',
        timestamp: new Date().toISOString()
    });
}

// Settings Functions
function updateSettingsDisplay() {
    elements.uploadDelay.value = appState.settings.uploadDelay / 1000; // Convert to seconds
    elements.maxRetries.value = appState.settings.maxRetries;
    elements.autoStartQueue.checked = appState.settings.autoStartQueue;
    elements.showNotifications.checked = appState.settings.showNotifications;
    elements.showBrowser.checked = appState.settings.showBrowser;
}

async function saveSettings(e) {
    e.preventDefault();

    const newSettings = {
        uploadDelay: elements.uploadDelay.value * 1000, // Convert to milliseconds
        maxRetries: parseInt(elements.maxRetries.value),
        autoStartQueue: elements.autoStartQueue.checked,
        showNotifications: elements.showNotifications.checked,
        showBrowser: elements.showBrowser.checked
    };

    try {
        const result = await fetch(`${API_BASE}/api/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newSettings)
        });
        const response = await result.json();

        if (response.success) {
            appState.settings = newSettings;
            showToast('Pengaturan berhasil disimpan', 'success');
        } else {
            showToast(`Gagal menyimpan pengaturan: ${response.error}`, 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}

function resetSettings() {
    if (confirm('Apakah Anda yakin ingin mengembalikan pengaturan ke default?')) {
        appState.settings = {
            uploadDelay: 30000,
            maxRetries: 3,
            autoStartQueue: false,
            showNotifications: true,
            showBrowser: false
        };
        updateSettingsDisplay();
        saveSettings(new Event('submit'));
    }
}

// Logs Functions
function addLog(logEntry) {
    appState.logs.unshift(logEntry);
    // Keep only last 1000 logs
    if (appState.logs.length > 1000) {
        appState.logs = appState.logs.slice(0, 1000);
    }
    updateLogsDisplay();
}

function updateLogsDisplay() {
    if (appState.logs.length === 0) {
        elements.logsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-terminal"></i>
                <h3>Belum ada aktivitas</h3>
                <p>Log aktivitas akan muncul di sini saat aplikasi berjalan.</p>
            </div>
        `;
        return;
    }

    elements.logsContainer.innerHTML = appState.logs.map(log => `
        <div class="log-entry">
            <span class="log-timestamp">${new Date(log.timestamp).toLocaleTimeString()}</span>
            <span class="log-level ${log.level}">${log.level.toUpperCase()}</span>
            <span class="log-message">${log.message}</span>
        </div>
    `).join('');

    // Scroll to top
    elements.logsContainer.scrollTop = 0;
}

function clearLogs() {
    if (confirm('Apakah Anda yakin ingin menghapus semua log?')) {
        appState.logs = [];
        updateLogsDisplay();
        showToast('Log berhasil dibersihkan', 'success');
    }
}

function exportLogs() {
    if (appState.logs.length === 0) {
        showToast('Tidak ada log untuk diekspor', 'warning');
        return;
    }

    const logContent = appState.logs.map(log =>
        `[${new Date(log.timestamp).toLocaleString()}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');

    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reelsync-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Log berhasil diekspor', 'success');
}

// Utility Functions
function updateStatusBar() {
    const pendingCount = appState.uploadQueue.filter(item => item.status === 'pending').length;
    elements.queueStatus.textContent = `Antrian: ${pendingCount} item`;

    if (pendingCount > 0) {
        elements.statusText.textContent = 'Antrian siap diproses';
    } else {
        elements.statusText.textContent = 'Siap digunakan';
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);

    // Also log the message
    addLog({
        level: type,
        message: message,
        timestamp: new Date().toISOString()
    });
}

function handleAccountValidation(result) {
    if (result.success) {
        showToast('Akun berhasil divalidasi', 'success');
    } else {
        showToast(`Validasi akun gagal: ${result.error}`, 'error');
    }
}

// Handle modal click outside
elements.accountModal?.addEventListener('click', (e) => {
    if (e.target === elements.accountModal) {
        closeAccountModal();
    }
});

// Gemini AI Caption Functions
async function generateCaption() {
    const filePath = elements.videoFile.value;
    const language = elements.captionLanguage.value;

    if (!filePath) {
        showToast('Pilih file video terlebih dahulu', 'warning');
        return;
    }

    // Extract filename from path
    const fileName = filePath.split(/[/\\]/).pop();

    if (!fileName) {
        showToast('Tidak dapat mengekstrak nama file', 'error');
        return;
    }

    try {
        elements.generateCaptionBtn.disabled = true;
        elements.generateCaptionBtn.innerHTML = '<div class="loading"></div> Generating...';

        // Call Gemini service through API
        const result = await fetch(`${API_BASE}/api/gemini/generate-caption`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fileName, language })
        });
        const response = await result.json();

        if (response.success) {
            elements.caption.value = response.description || '';
            showToast('Caption berhasil digenerate!', 'success');
        } else {
            showToast(`Gagal generate caption: ${response.error}`, 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        elements.generateCaptionBtn.disabled = false;
        elements.generateCaptionBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Caption';
    }
}

function openGeminiModal(api = null) {
    if (api) {
        elements.geminiApiName.value = api.name;
        elements.geminiApiKey.value = ''; // Don't show key for security
        elements.geminiApiKey.placeholder = 'API key tersimpan (tidak ditampilkan)';
        elements.geminiModalTitle.textContent = 'Edit API Key Gemini';
        elements.saveGeminiBtn.innerHTML = '<i class="fas fa-save"></i> Update API Key';
    } else {
        elements.geminiForm.reset();
        elements.geminiApiKey.placeholder = 'Masukkan API key Gemini Anda...';
        elements.geminiModalTitle.textContent = 'Tambah API Key Gemini';
        elements.saveGeminiBtn.innerHTML = '<i class="fas fa-save"></i> Simpan API Key';
    }

    elements.geminiModal.classList.add('show');
}

function closeGeminiModal() {
    elements.geminiModal.classList.remove('show');
    elements.geminiForm.reset();
    elements.geminiApiKey.placeholder = 'Masukkan API key Gemini Anda...';
    elements.geminiModalTitle.textContent = 'Tambah API Key Gemini';
    elements.saveGeminiBtn.innerHTML = '<i class="fas fa-save"></i> Simpan API Key';
}

async function saveGeminiApi(e) {
    e.preventDefault();

    const apiName = elements.geminiApiName.value.trim();
    const apiKey = elements.geminiApiKey.value.trim();

    if (!apiName) {
        showToast('Nama API key harus diisi', 'error');
        return;
    }

    // Check if editing (no new key provided)
    const existingApi = appState.geminiApis?.find(api => api.name === apiName);
    const isEdit = !!existingApi;

    if (isEdit && !apiKey) {
        // For edit, if no new key, just update name (this case may not happen in web app)
        showToast('Tidak dapat edit API tanpa key baru pada web app', 'warning');
        return;
    } else if (!isEdit && !apiKey) {
        showToast('API key harus diisi untuk yang baru', 'error');
        return;
    } else {
        // New API
        const apiData = {
            name: apiName,
            apiKey: apiKey
        };

        try {
            elements.saveGeminiBtn.disabled = true;
            elements.saveGeminiBtn.innerHTML = '<div class="loading"></div> Saving...';

            const result = await fetch(`${API_BASE}/api/gemini/apis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apiData)
            });
            const response = await result.json();

            if (response.success) {
                await updateGeminiDisplay();
                closeGeminiModal();
                showToast('API key berhasil disimpan', 'success');
            } else {
                showToast(`Gagal menyimpan API key: ${response.error}`, 'error');
            }
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            elements.saveGeminiBtn.disabled = false;
            elements.saveGeminiBtn.innerHTML = '<i class="fas fa-save"></i> Simpan API Key';
        }
    }
}

async function testGeminiApi() {
    const apiKey = elements.geminiApiKey.value.trim();

    if (!apiKey) {
        showToast('API key harus diisi untuk test', 'warning');
        return;
    }

    try {
        elements.testGeminiApiBtn.disabled = true;
        elements.testGeminiApiBtn.innerHTML = '<div class="loading"></div> Testing...';

        const result = await fetch(`${API_BASE}/api/gemini/test-key`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiKey })
        });
        const response = await result.json();

        if (response.success) {
            showToast('API key valid! Gemini siap digunakan', 'success');
        } else {
            showToast(`Test gagal: ${response.error || 'API key tidak valid'}`, 'error');
        }
    } catch (error) {
        showToast(`Test failed: ${error.message}`, 'error');
    } finally {
        elements.testGeminiApiBtn.disabled = false;
        elements.testGeminiApiBtn.innerHTML = '<i class="fas fa-vial"></i> Test API Key';
    }
}

async function updateGeminiDisplay() {
    try {
        // Load Gemini APIs
        const apisResponse = await fetch(`${API_BASE}/api/gemini/apis`);
        const apis = await apisResponse.json();
        appState.geminiApis = apis;

        // Update stats
        elements.geminiApisCount.textContent = apis.length;

        if (apis.length === 0) {
            elements.geminiApisList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-key"></i>
                    <h3>Belum ada API Key</h3>
                    <p>Tambahkan API key Gemini untuk mulai generate caption otomatis.</p>
                </div>
            `;
        } else {
            elements.geminiApisList.innerHTML = apis.map(api => `
                <div class="gemini-api-card">
                    <div class="api-info">
                        <h4>${api.name}</h4>
                        <p>Status: ${api.isValid ? 'Valid' : 'Tidak Valid'}</p>
                        <small>Created: ${new Date(api.createdAt).toLocaleDateString()}</small>
                    </div>
                    <div class="api-actions">
                        <button class="btn-secondary" onclick="editGeminiApi('${api.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-danger" onclick="deleteGeminiApi('${api.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Load usage stats
        const statsResponse = await fetch(`${API_BASE}/api/gemini/stats`);
        const stats = await statsResponse.json();
        if (stats) {
            elements.geminiUsageToday.textContent = stats.recentRequests || 0;
            elements.geminiSuccessRate.textContent = stats.recentSuccessRate || '0%';
            elements.geminiTotalRequests.textContent = stats.totalRequests || 0;
        }

    } catch (error) {
        console.error('Error updating Gemini display:', error);
        showToast(`Error loading Gemini data: ${error.message}`, 'error');
    }
}

// Make functions globally available
window.editGeminiApi = async function(apiId) {
    const api = appState.geminiApis.find(a => a.id === parseInt(apiId));
    if (api) {
        openGeminiModal(api);
    }
};

window.deleteGeminiApi = async function(apiId) {
    if (confirm('Apakah Anda yakin ingin menghapus API key ini?')) {
        try {
            const response = await fetch(`${API_BASE}/api/gemini/apis/${apiId}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                await updateGeminiDisplay();
                showToast('API key berhasil dihapus', 'success');
            } else {
                showToast(`Gagal menghapus API key: ${result.error || 'API key tidak ditemukan'}`, 'error');
            }
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    }
};

// Handle modal click outside
elements.geminiModal?.addEventListener('click', (e) => {
    if (e.target === elements.geminiModal) {
        closeGeminiModal();
    }
});

// Handle escape key for modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.accountModal.classList.contains('show')) {
        closeAccountModal();
    }
    if (e.key === 'Escape' && elements.geminiModal.classList.contains('show')) {
        closeGeminiModal();
    }
});

// Analytics Functions
async function loadAnalyticsData() {
    if (analyticsState.isLoading) {
        console.log('Analytics already loading, skipping...');
        return;
    }

    try {
        analyticsState.isLoading = true;
        console.log(`📊 Loading analytics data for ${analyticsState.currentTimeRange}`);

        // Show loading state
        showAnalyticsLoading();

        const result = await fetch(`${API_BASE}/api/analytics?timeRange=${analyticsState.currentTimeRange}`);
        const response = await result.json();

        if (response.success) {
            analyticsState.dashboardData = response.data;
            updateAnalyticsDisplay();
            console.log('✅ Analytics display updated');
        } else {
            console.error('❌ Failed to load analytics:', response.error);
            showAnalyticsEmpty();
        }
    } catch (error) {
        console.error('❌ Error loading analytics data:', error);
        showAnalyticsEmpty();
    } finally {
        analyticsState.isLoading = false;
        console.log('📊 Analytics loading completed');
    }
}

function showAnalyticsLoading() {
    const sections = [
        'overview-stats',
        'performance-by-type',
        'account-comparison',
        'best-posting-times',
        'category-performance',
        'trends-chart'
    ];

    sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.innerHTML = `
                <div class="analytics-loading">
                    <div class="loading"></div>
                    <span>Memuat data...</span>
                </div>
            `;
        }
    });
}

function showAnalyticsEmpty() {
    const sections = [
        'overview-stats',
        'performance-by-type',
        'account-comparison',
        'best-posting-times',
        'category-performance',
        'trends-chart'
    ];

    sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <h3>Belum ada data</h3>
                    <p>Data analytics akan muncul setelah upload pertama.</p>
                </div>
            `;
        }
    });
}

function updateAnalyticsDisplay() {
    const data = analyticsState.dashboardData || {};

    // Update overview stats
    updateOverviewStats(data.overview);

    // Update performance by type
    updatePerformanceByType(data.performance);

    // Update account comparison
    updateAccountComparison(data.accounts);

    // Update best posting times
    updateBestPostingTimes(data.bestTimes);

    // Update category performance
    updateCategoryPerformance(data.categories);

    // Update trends chart
    updateTrendsChart(data.trends);

    console.log('✅ Analytics display fully updated');
}

function updateOverviewStats(overview) {
    const statsMap = {
        'total-uploads': overview?.totalUploads || 0,
        'success-rate': overview?.successRate ? `${overview.successRate.toFixed(1)}%` : '0%',
        'total-views': overview?.totalViews || 0,
        'avg-engagement': overview?.averageEngagementRate ? `${overview.averageEngagementRate.toFixed(1)}%` : '0%'
    };

    Object.entries(statsMap).forEach(([elementId, value]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            // Also remove loading state if present
            const loadingParent = element.closest('.analytics-loading');
            if (loadingParent) {
                loadingParent.remove();
            }
        }
    });

    // If we have overview data but it's all zeros, this might still be empty state
    const hasData = overview && (overview.totalUploads > 0 || overview.totalViews > 0);
    if (!hasData) {
        const container = document.getElementById('overview-stats');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <h3>Belum ada overview</h3>
                    <p>Stats overview akan muncul setelah upload pertama.</p>
                </div>
            `;
        }
    }
}

function updatePerformanceByType(performance) {
    if (!performance) return;

    const container = document.getElementById('performance-by-type');
    if (!container) return;

    const reels = performance.byType?.reels || {};
    const posts = performance.byType?.posts || {};

    container.innerHTML = `
        <div class="performance-comparison">
            <div class="performance-card">
                <h4><i class="fas fa-video"></i> Facebook Reels</h4>
                <div class="stat-number">${reels.uploads || 0}</div>
                <div class="stat-label">Total Uploads</div>
                <div class="performance-details">
                    <div class="performance-detail">
                        <span class="detail-label">Views:</span>
                        <span class="detail-value">${reels.views || 0}</span>
                    </div>
                    <div class="performance-detail">
                        <span class="detail-label">Avg Engagement:</span>
                        <span class="detail-value">${reels.engagementRate?.toFixed(1) || 0}%</span>
                    </div>
                </div>
            </div>
            <div class="performance-card">
                <h4><i class="fas fa-film"></i> Video Posts</h4>
                <div class="stat-number">${posts.uploads || 0}</div>
                <div class="stat-label">Total Uploads</div>
                <div class="performance-details">
                    <div class="performance-detail">
                        <span class="detail-label">Views:</span>
                        <span class="detail-value">${posts.views || 0}</span>
                    </div>
                    <div class="performance-detail">
                        <span class="detail-label">Avg Engagement:</span>
                        <span class="detail-value">${posts.engagementRate?.toFixed(1) || 0}%</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="performance-summary">
            <div class="summary-item">
                <span class="summary-label">Avg Processing Time:</span>
                <span class="summary-value">${Math.round(performance.averageProcessingTime / 1000) || 0}s</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Avg Retry Count:</span>
                <span class="summary-value">${performance.averageRetryCount?.toFixed(1) || 0}</span>
            </div>
        </div>
    `;
}

function updateAccountComparison(accounts) {
    if (!accounts || accounts.length === 0) return;

    const container = document.getElementById('account-comparison');
    if (!container) return;

    container.innerHTML = `
        <div class="account-comparison">
            <table class="account-comparison-table">
                <thead>
                    <tr>
                        <th>Account</th>
                        <th>Uploads</th>
                        <th>Success Rate</th>
                        <th>Total Views</th>
                        <th>Avg Engagement</th>
                        <th>Processing Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${accounts.map(account => `
                        <tr>
                            <td>${account.accountName}</td>
                            <td>${account.totalUploads}</td>
                            <td>${account.successRate?.toFixed(1) || 0}%</td>
                            <td>${account.totalViews || 0}</td>
                            <td>${account.averageEngagementRate?.toFixed(1) || 0}%</td>
                            <td>${Math.round(account.averageProcessingTime / 1000) || 0}s</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function updateBestPostingTimes(bestTimes) {
    if (!bestTimes || bestTimes.length === 0) return;

    const container = document.getElementById('best-posting-times');
    if (!container) return;

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    container.innerHTML = `
        <div class="best-times">
            ${bestTimes.slice(0, 10).map(time => `
                <div class="time-slot">
                    <div class="time">
                        ${daysOfWeek[time.dayOfWeek]} ${time.hour.toString().padStart(2, '0')}:00
                    </div>
                    <div class="engagement">
                        ${time.averageEngagement?.toFixed(1) || 0}% engagement
                    </div>
                    <div class="details">
                        ${time.totalUploads} uploads • ${time.successRate?.toFixed(0) || 0}% success
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function updateCategoryPerformance(categories) {
    if (!categories || categories.length === 0) return;

    const container = document.getElementById('category-performance');
    if (!container) return;

    container.innerHTML = `
        <div class="category-performance">
            ${categories.map(category => `
                <div class="category-card">
                    <h4>${category.category.charAt(0).toUpperCase() + category.category.slice(1)}</h4>
                    <div class="category-stats">
                        <div>
                            <span class="category-stat-label">Uploads:</span>
                            <span class="category-stat-value">${category.totalUploads}</span>
                        </div>
                        <div>
                            <span class="category-stat-label">Avg Views:</span>
                            <span class="category-stat-value">${Math.round(category.averageViews || 0)}</span>
                        </div>
                    </div>
                    <div class="category-stats">
                        <div>
                            <span class="category-stat-label">Engagement:</span>
                            <span class="category-stat-value">${category.averageEngagementRate?.toFixed(1) || 0}%</span>
                        </div>
                    </div>
                    ${category.topHashtags && category.topHashtags.length > 0 ? `
                        <div class="category-hashtags">
                            ${category.topHashtags.slice(0, 5).map(tag => `
                                <span class="category-hashtag">#${tag}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function updateTrendsChart(trends) {
    if (!trends || !trends.dailyStats || trends.dailyStats.length === 0) return;

    const container = document.getElementById('trends-chart');
    if (!container) return;

    // Simple chart placeholder - in real implementation, you would use a charting library
    const recentDays = trends.dailyStats.slice(-7); // Last 7 days

    container.innerHTML = `
        <div class="trends-chart">
            <div class="chart-placeholder">
                <i class="fas fa-chart-line"></i>
                <h4>Upload Trends (Last 7 Days)</h4>
                <div class="trends-summary">
                    <div class="trend-item">
                        <span class="trend-label">Total Uploads:</span>
                        <span class="trend-value">${recentDays.reduce((sum, day) => sum + day.totalUploads, 0)}</span>
                    </div>
                    <div class="trend-item">
                        <span class="trend-label">Total Views:</span>
                        <span class="trend-value">${recentDays.reduce((sum, day) => sum + day.totalViews, 0)}</span>
                    </div>
                    <div class="trend-item">
                        <span class="trend-label">Total Engagement:</span>
                        <span class="trend-value">${recentDays.reduce((sum, day) => sum + day.totalEngagement, 0)}</span>
                    </div>
                </div>
                <p class="chart-note">Chart visualization akan diimplementasikan dengan library seperti Chart.js</p>
            </div>
        </div>
    `;
}

// Event listeners for analytics
function setupAnalyticsEventListeners() {
    // Time range selector
    const timeRangeSelect = document.getElementById('time-range-select');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', (e) => {
            analyticsState.currentTimeRange = e.target.value;
            loadAnalyticsData();
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-analytics-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadAnalyticsData();
        });
    }

    // Export button
    const exportBtn = document.getElementById('export-analytics-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            try {
                exportBtn.disabled = true;
                exportBtn.innerHTML = '<div class="loading"></div> Exporting...';

                const result = await fetch(`${API_BASE}/api/analytics/export`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        format: 'json',
                        timeRange: analyticsState.currentTimeRange
                    })
                });
                const response = await result.json();

                if (response.success) {
                    // Create download link
                    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `analytics-${analyticsState.currentTimeRange}-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    showToast('Analytics berhasil diekspor', 'success');
                } else {
                    showToast(`Export gagal: ${response.error}`, 'error');
                }
            } catch (error) {
                showToast(`Export error: ${error.message}`, 'error');
            } finally {
                exportBtn.disabled = false;
                exportBtn.innerHTML = '<i class="fas fa-download"></i> Export';
            }
        });
    }
}

// Initialize analytics event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Setup analytics event listeners after a short delay to ensure all elements are ready
    setTimeout(() => {
        setupAnalyticsEventListeners();
    }, 500);
});

// Analytics tracking functions
async function trackUploadToAnalytics(formData, queueId) {
    try {
        // Get account data untuk page info
        const selectedAccount = appState.accounts.find(acc => acc.name === formData.account);
        if (!selectedAccount) {
            console.log('Account not found for analytics tracking');
            return;
        }

        const pageInfo = selectedAccount.pages?.find(p => p.id === formData.page);

        const uploadData = {
            id: queueId,
            accountName: formData.account,
            pageId: formData.page,
            pageName: pageInfo?.name || formData.page,
            type: formData.type,
            fileName: formData.file ? formData.file.split(/[/\\]/).pop() : 'unknown',
            caption: formData.caption,
            hashtags: extractHashtags(formData.caption),
            status: 'pending',
            scheduledTime: formData.schedule,
            category: categorizeContent(formData),
            priority: 'medium'
        };

        const result = await fetch(`${API_BASE}/api/analytics/track-upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(uploadData)
        });
        const response = await result.json();

        if (response.success) {
            console.log(`📊 Upload tracked to analytics: ${queueId}`);
        } else {
            console.error('Error tracking upload to analytics:', response.error);
        }
    } catch (error) {
        console.error('Error tracking upload to analytics:', error);
    }
}

function extractHashtags(caption) {
    if (!caption) return [];

    const hashtagRegex = /#[\w]+/g;
    const matches = caption.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
}

function categorizeContent(formData) {
    const text = `${formData.caption || ''} ${formData.hashtags?.join(' ') || ''}`.toLowerCase();

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
