const Store = require('electron-store');
const CryptoJS = require('crypto-js');

// Inisialisasi electron-store
const store = new Store();

// Encryption key untuk secure storage
const ENCRYPTION_KEY = 'reelsync-pro-encryption-key-2024';

/**
 * Account Manager Module
 * Menangani semua operasi terkait manajemen akun Facebook
 */
class AccountManager {
    constructor() {
        this.store = store;
        this.encryptionKey = ENCRYPTION_KEY;
    }

    /**
     * Encrypt data menggunakan AES
     */
    encrypt(data) {
        return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
    }

    /**
     * Decrypt data menggunakan AES
     */
    decrypt(encryptedData) {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }

    /**
     * Simpan akun baru atau update akun existing
     */
    async saveAccount(accountData) {
        try {
            const accounts = this.getAllAccounts();

            // Cek apakah akun sudah ada
            const existingIndex = accounts.findIndex(acc => acc.name === accountData.name);

            let accountToSave;

            if (existingIndex >= 0) {
                // Update existing account
                const existingAccount = accounts[existingIndex];
                accountToSave = {
                    ...existingAccount,
                    ...accountData,
                    updatedAt: new Date().toISOString()
                };

                // Only encrypt and update cookie if new cookie provided
                if (accountData.cookie && accountData.cookie.trim()) {
                    accountToSave.cookie = this.encrypt(accountData.cookie);
                    accountToSave.valid = false; // Need re-validation
                    accountToSave.pages = [];
                }
                // If no new cookie, keep existing cookie and validation status

                accounts[existingIndex] = accountToSave;
            } else {
                // New account - cookie required
                if (!accountData.cookie || !accountData.cookie.trim()) {
                    return {
                        success: false,
                        error: 'Cookie diperlukan untuk akun baru'
                    };
                }

                // Encrypt cookie untuk akun baru
                accountToSave = {
                    ...accountData,
                    cookie: this.encrypt(accountData.cookie),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    valid: false,
                    pages: []
                };

                accounts.push(accountToSave);
            }

            this.store.set('accounts', accounts);

            // Validasi cookie dan ambil data halaman
            const validationResult = await this.validateAccount(accountData.name);

            return {
                success: true,
                account: accountData.name,
                validation: validationResult,
                isEdit: existingIndex >= 0
            };
        } catch (error) {
            console.error('Error saving account:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Hapus akun
     */
    async deleteAccount(accountName) {
        try {
            const accounts = this.getAllAccounts();
            const filteredAccounts = accounts.filter(acc => acc.name !== accountName);
            this.store.set('accounts', filteredAccounts);

            return {
                success: true,
                message: `Akun ${accountName} berhasil dihapus`
            };
        } catch (error) {
            console.error('Error deleting account:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
      * Ambil semua akun
      */
    getAllAccounts() {
        try {
            const accounts = this.store.get('accounts', []);

            // Decrypt cookies untuk setiap akun dan ensure type exists
            return accounts.map(account => ({
                ...account,
                cookie: this.decrypt(account.cookie),
                type: account.type || 'personal' // Default to personal for legacy accounts
            }));
        } catch (error) {
            console.error('Error getting accounts:', error);
            return [];
        }
    }

    /**
      * Ambil akun berdasarkan nama
      */
    getAccount(accountName) {
        try {
            const accounts = this.getAllAccounts();
            const account = accounts.find(acc => acc.name === accountName);
            if (account) {
                // Ensure account has type (default to personal for legacy accounts)
                if (!account.type) {
                    account.type = 'personal';
                }
                return account;
            }
            return null;
        } catch (error) {
            console.error('Error getting account:', error);
            return null;
        }
    }

    /**
     * Validasi cookie dan ambil data halaman Facebook
     */
    async validateAccount(accountName) {
        try {
            const account = this.getAccount(accountName);

            if (!account) {
                return {
                    success: false,
                    error: 'Akun tidak ditemukan'
                };
            }

            // Check if account is already valid and recently validated (within 24 hours)
            if (account.valid && account.lastValidated) {
                const lastValidated = new Date(account.lastValidated);
                const now = new Date();
                const hoursSinceValidation = (now - lastValidated) / (1000 * 60 * 60);

                if (hoursSinceValidation < 24 && account.pages && account.pages.length > 0) {
                    console.log(`Account ${accountName} already valid (validated ${hoursSinceValidation.toFixed(1)} hours ago)`);
                    return {
                        success: true,
                        pages: account.pages,
                        message: `Akun ${accountName} sudah valid`,
                        fromCache: true
                    };
                }
            }

            if (!account.cookie) {
                return {
                    success: false,
                    error: 'Cookie tidak ditemukan'
                };
            }

            console.log(`Validating account: ${accountName} (Type: ${account.type})`);

            // Gunakan FacebookAutomation untuk validasi nyata
            const FacebookAutomation = require('./facebook-automation');
            const facebookAutomation = new FacebookAutomation();

            const validationResult = await facebookAutomation.validateCookieAndGetPages(account.cookie, account.type);

            if (validationResult.success) {
                // Update status akun
                const accounts = this.store.get('accounts', []);
                const accountIndex = accounts.findIndex(acc => acc.name === accountName);

                if (accountIndex >= 0) {
                    accounts[accountIndex].valid = true;
                    accounts[accountIndex].pages = validationResult.pages;
                    accounts[accountIndex].lastValidated = new Date().toISOString();
                    this.store.set('accounts', accounts);
                }

                console.log(`Account ${accountName} validated successfully with ${validationResult.pages.length} pages`);

                return {
                    success: true,
                    pages: validationResult.pages,
                    message: `Akun ${accountName} berhasil divalidasi`,
                    fromCache: false
                };
            } else {
                // Update status akun sebagai tidak valid
                const accounts = this.store.get('accounts', []);
                const accountIndex = accounts.findIndex(acc => acc.name === accountName);

                if (accountIndex >= 0) {
                    accounts[accountIndex].valid = false;
                    accounts[accountIndex].lastValidated = new Date().toISOString();
                    accounts[accountIndex].error = validationResult.error;
                    this.store.set('accounts', accounts);
                }

                console.log(`Account ${accountName} validation failed: ${validationResult.error}`);

                return {
                    success: false,
                    error: validationResult.error
                };
            }
        } catch (error) {
            console.error('Error validating account:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }


    /**
     * Test koneksi akun (tanpa menyimpan)
     */
    async testAccount(accountData) {
        try {
            console.log(`Testing account connection for: ${accountData.name} (Type: ${accountData.type})`);

            // Gunakan FacebookAutomation untuk test nyata
            const FacebookAutomation = require('./facebook-automation');
            const facebookAutomation = new FacebookAutomation();

            const validationResult = await facebookAutomation.validateCookieAndGetPages(accountData.cookie, accountData.type);

            console.log(`Test result: ${validationResult.success ? 'SUCCESS' : 'FAILED'}`);

            return {
                success: validationResult.success,
                pages: validationResult.pages || [],
                message: validationResult.message || validationResult.error
            };
        } catch (error) {
            console.error('Error testing account:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update status validasi akun
     */
    updateAccountValidation(accountName, isValid, pages = []) {
        try {
            const accounts = this.store.get('accounts', []);
            const accountIndex = accounts.findIndex(acc => acc.name === accountName);

            if (accountIndex >= 0) {
                accounts[accountIndex].valid = isValid;
                accounts[accountIndex].pages = pages;
                accounts[accountIndex].lastValidated = new Date().toISOString();

                if (!isValid) {
                    accounts[accountIndex].error = 'Validasi gagal';
                }

                this.store.set('accounts', accounts);
                return { success: true };
            }

            return { success: false, error: 'Akun tidak ditemukan' };
        } catch (error) {
            console.error('Error updating account validation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cek apakah ada akun yang valid
     */
    hasValidAccounts() {
        const accounts = this.getAllAccounts();
        return accounts.some(acc => acc.valid);
    }

    /**
     * Ambil akun yang valid saja
     */
    getValidAccounts() {
        const accounts = this.getAllAccounts();
        return accounts.filter(acc => acc.valid);
    }

    /**
     * Bersihkan semua data akun
     */
    clearAllAccounts() {
        try {
            this.store.set('accounts', []);
            return { success: true, message: 'Semua akun berhasil dihapus' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Export data akun (untuk backup)
     */
    exportAccounts() {
        try {
            const accounts = this.getAllAccounts();
            // Remove sensitive data untuk export
            const exportData = accounts.map(acc => ({
                name: acc.name,
                createdAt: acc.createdAt,
                updatedAt: acc.updatedAt,
                valid: acc.valid,
                pages: acc.pages,
                lastValidated: acc.lastValidated
            }));

            return {
                success: true,
                data: exportData,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Import data akun (dari backup)
     */
    importAccounts(importData) {
        try {
            if (!Array.isArray(importData)) {
                return { success: false, error: 'Format data tidak valid' };
            }

            const existingAccounts = this.getAllAccounts();
            const mergedAccounts = [...existingAccounts];

            importData.forEach(importAccount => {
                const existingIndex = mergedAccounts.findIndex(acc => acc.name === importAccount.name);

                if (existingIndex >= 0) {
                    // Update existing account
                    mergedAccounts[existingIndex] = {
                        ...mergedAccounts[existingIndex],
                        ...importAccount,
                        updatedAt: new Date().toISOString()
                    };
                } else {
                    // Add new account
                    mergedAccounts.push({
                        ...importAccount,
                        cookie: '', // Cookie harus dimasukkan manual untuk keamanan
                        updatedAt: new Date().toISOString()
                    });
                }
            });

            this.store.set('accounts', mergedAccounts);

            return {
                success: true,
                message: `${importData.length} akun berhasil diimpor`,
                imported: importData.length,
                skipped: 0
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get account statistics
     */
    getAccountStats() {
        const accounts = this.getAllAccounts();
        const validAccounts = accounts.filter(acc => acc.valid);
        const totalPages = accounts.reduce((total, acc) => total + (acc.pages ? acc.pages.length : 0), 0);

        return {
            total: accounts.length,
            valid: validAccounts.length,
            invalid: accounts.length - validAccounts.length,
            totalPages: totalPages
        };
    }
}

module.exports = AccountManager;