const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class GeminiPromptManager {
    static getPromptTemplates() {
        return {
            default: `Berdasarkan nama file video: "{fileName}", buat konten YouTube Shorts yang menarik dengan format JSON berikut:
{
    "title": "judul yang catchy dan menarik (max 100 karakter)",
    "description": "deskripsi menarik yang menggambarkan konten video (max 500 karakter)",
    "hashtags": "beberapa hashtag relevan dipisah dengan koma"
}

Pastikan:
- Judul catchy dan mengundang klik
- Deskripsi informatif tapi singkat
- Hashtag maksimal 10, relevan dengan konten
- Gunakan bahasa Indonesia yang natural
- Sesuaikan dengan konten dari nama file

Jika nama file dalam bahasa Inggris, tetap gunakan bahasa Indonesia untuk output.`,

            detailed: `Berdasarkan nama file video: "{fileName}", buat konten YouTube yang sangat detail dan engaging dengan format JSON berikut:
{
    "title": "judul yang sangat menarik dan SEO-friendly (max 100 karakter)",
    "description": "deskripsi lengkap dan menarik yang menggambarkan konten video dengan detail (max 5000 karakter)",
    "hashtags": "10-15 hashtag yang sangat relevan dan trending, dipisah dengan koma"
}

Persyaratan khusus:
- Judul harus mengandung kata kunci utama dari nama file
- Deskripsi harus mencakup: pengantar menarik, deskripsi konten, call-to-action, dan kata kunci terkait
- Hashtag harus mencakup: kata kunci utama, kata kunci terkait, trending topics, dan brand hashtags
- Gunakan bahasa Indonesia yang profesional dan engaging
- Optimasi untuk algoritma YouTube dan SEO

Jika nama file dalam bahasa Inggris, tetap gunakan bahasa Indonesia untuk output.`,

            short_form: `Berdasarkan nama file video: "{fileName}", buat konten YouTube Shorts/ TikTok yang super catchy dengan format JSON berikut:
{
    "title": "judul pendek yang sangat menarik dan viral (max 60 karakter)",
    "description": "deskripsi super singkat tapi bikin penasaran (max 200 karakter)",
    "hashtags": "5-8 hashtag yang sedang trending untuk Shorts/TikTok, dipisah dengan koma"
}

Fokus pada:
- Judul harus sangat catchy dan memancing klik
- Deskripsi harus membuat orang langsung ingin nonton
- Hashtag harus yang lagi trending di platform Shorts/TikTok
- Gunakan bahasa Indonesia gaul yang kekinian
- Buat konten yang relatable dan shareable

Jika nama file dalam bahasa Inggris, tetap gunakan bahasa Indonesia untuk output.`,

            educational: `Berdasarkan nama file video: "{fileName}", buat konten edukasi yang informatif dengan format JSON berikut:
{
    "title": "judul edukatif yang jelas dan menarik (max 100 karakter)",
    "description": "penjelasan detail tentang konten edukasi (max 1000 karakter)",
    "hashtags": "hashtag edukasi dan pembelajaran yang relevan, dipisah dengan koma"
}

Buat konten yang:
- Judul harus langsung menjelaskan manfaat yang didapat pemirsa
- Deskripsi harus mencakup: apa yang akan dipelajari, siapa target audience, dan manfaat praktis
- Sertakan call-to-action untuk like, comment, dan subscribe
- Gunakan bahasa Indonesia yang mudah dipahami semua kalangan
- Tambahkan nilai edukasi yang tinggi

Jika nama file dalam bahasa Inggris, tetap gunakan bahasa Indonesia untuk output.`
        };
    }

    static getPrompt(template = 'default', fileName) {
        const templates = this.getPromptTemplates();
        return templates[template]?.replace('{fileName}', fileName) || templates.default.replace('{fileName}', fileName);
    }
}

class GeminiModelManager {
    static getAvailableModels() {
        return {
            'gemini-1.5-flash': {
                name: 'Gemini 1.5 Flash',
                description: 'Model cepat dan efisien untuk response singkat',
                maxTokens: 8192
            },
            'gemini-1.5-pro': {
                name: 'Gemini 1.5 Pro',
                description: 'Model powerful untuk konten yang lebih kompleks',
                maxTokens: 32768
            }
        };
    }

    static getModel(modelName = 'gemini-1.5-flash') {
        const models = this.getAvailableModels();
        return models[modelName] || models['gemini-1.5-flash'];
    }
}

// Export helper classes untuk digunakan di routes
class GeminiStore {
    constructor() {
        this.dbPath = path.join(__dirname, 'reelsync.db');
        this.db = null;
        this.initDatabase();
    }

    async initDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening GeminiStore database:', err.message);
                    reject(err);
                    return;
                }

                // Create tables
                const createTables = `
                    CREATE TABLE IF NOT EXISTS gemini_apis (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        api_key TEXT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        is_valid BOOLEAN DEFAULT 1,
                        last_used DATETIME,
                        usage_count INTEGER DEFAULT 0,
                        user_id INTEGER,
                        FOREIGN KEY (user_id) REFERENCES users(id)
                    );

                    CREATE TABLE IF NOT EXISTS gemini_usage (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        api_id INTEGER,
                        user_id INTEGER,
                        file_name TEXT,
                        success BOOLEAN,
                        error_message TEXT,
                        response_time INTEGER,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (api_id) REFERENCES gemini_apis(id),
                        FOREIGN KEY (user_id) REFERENCES users(id)
                    );
                `;

                this.db.exec(createTables, (err) => {
                    if (err) {
                        console.error('Error creating GeminiStore tables:', err.message);
                        reject(err);
                        return;
                    }
                    console.log('✅ GeminiStore database initialized');
                    resolve();
                });
            });
        });
    }

    async getAllApis(userId) {
        return new Promise((resolve, reject) => {
            const query = userId ? 'SELECT * FROM gemini_apis WHERE user_id = ?' : 'SELECT * FROM gemini_apis';
            const params = userId ? [userId] : [];

            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('Error reading Gemini APIs:', err);
                    resolve([]);
                    return;
                }

                const apis = rows.map(row => ({
                    id: row.id,
                    name: row.name,
                    apiKey: row.api_key,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    isValid: row.is_valid === 1,
                    lastUsed: row.last_used,
                    usageCount: row.usage_count,
                    userId: row.user_id
                }));

                resolve(apis);
            });
        });
    }

    async addApi(apiKey, name = null, userId = null, id = null) {
        return new Promise((resolve, reject) => {
            if (id) {
                // Update existing API
                const updateQuery = apiKey && apiKey !== 'existing'
                    ? 'UPDATE gemini_apis SET name = ?, api_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
                    : 'UPDATE gemini_apis SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?';

                const params = apiKey && apiKey !== 'existing'
                    ? [name, apiKey, id, userId]
                    : [name, id, userId];

                this.db.run(updateQuery, params, function(err) {
                    if (err) {
                        console.error('Error updating Gemini API:', err);
                        reject(err);
                        return;
                    }

                    if (this.changes > 0) {
                        // Return updated API data
                        const newApi = {
                            id: id,
                            name: name,
                            apiKey: apiKey && apiKey !== 'existing' ? apiKey : undefined,
                            updatedAt: new Date().toISOString(),
                            userId: userId
                        };
                        resolve(newApi);
                    } else {
                        reject(new Error('API not found'));
                    }
                });
            } else {
                // Add new API
                const insertQuery = 'INSERT INTO gemini_apis (name, api_key, user_id) VALUES (?, ?, ?)';
                const apiName = name || `API Key ${(new Date()).getTime()}`;

                this.db.run(insertQuery, [apiName, apiKey, userId], function(err) {
                    if (err) {
                        console.error('Error adding Gemini API:', err);
                        reject(err);
                        return;
                    }

                    const newApi = {
                        id: this.lastID,
                        name: apiName,
                        apiKey: apiKey,
                        createdAt: new Date().toISOString(),
                        isValid: true,
                        lastUsed: null,
                        usageCount: 0,
                        userId: userId
                    };

                    resolve(newApi);
                });
            }
        });
    }

    async deleteApi(id, userId) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM gemini_apis WHERE id = ? AND user_id = ?', [id, userId], function(err) {
                if (err) {
                    console.error('Error deleting Gemini API:', err);
                    reject(err);
                    return;
                }
                resolve(this.changes > 0);
            });
        });
    }

    async getApiById(id, userId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM gemini_apis WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
                if (err) {
                    console.error('Error getting Gemini API by ID:', err);
                    resolve(null);
                    return;
                }

                if (!row) {
                    resolve(null);
                    return;
                }

                resolve({
                    id: row.id,
                    name: row.name,
                    apiKey: row.api_key,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    isValid: row.is_valid === 1,
                    lastUsed: row.last_used,
                    usageCount: row.usage_count,
                    userId: row.user_id
                });
            });
        });
    }

    async getRandomApi(userId) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM gemini_apis WHERE user_id = ? AND is_valid = 1', [userId], (err, rows) => {
                if (err) {
                    console.error('Error getting Gemini APIs:', err);
                    resolve(null);
                    return;
                }

                if (rows.length === 0) {
                    resolve(null);
                    return;
                }

                const randomIndex = Math.floor(Math.random() * rows.length);
                const row = rows[randomIndex];

                resolve({
                    id: row.id,
                    name: row.name,
                    apiKey: row.api_key,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    isValid: row.is_valid === 1,
                    lastUsed: row.last_used,
                    usageCount: row.usage_count,
                    userId: row.user_id
                });
            });
        });
    }

    async logApiUsage(apiId, userId, fileName, success, errorMessage = null, responseTime = null) {
        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO gemini_usage (api_id, user_id, file_name, success, error_message, response_time) VALUES (?, ?, ?, ?, ?, ?)';
            this.db.run(query, [apiId, userId, fileName, success ? 1 : 0, errorMessage, responseTime], function(err) {
                if (err) {
                    console.error('Error logging Gemini API usage:', err);
                    // Don't reject here as logging failure shouldn't break the main flow
                    resolve();
                    return;
                }
                resolve();
            });
        });
    }

    async getUsageStats(userId) {
        return new Promise((resolve, reject) => {
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            const query = `
                SELECT
                    COUNT(*) as total_requests,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
                    SUM(CASE WHEN timestamp > ? THEN 1 ELSE 0 END) as recent_requests,
                    SUM(CASE WHEN success = 1 AND timestamp > ? THEN 1 ELSE 0 END) as recent_successful_requests,
                    AVG(CASE WHEN response_time IS NOT NULL THEN response_time ELSE NULL END) as avg_response_time
                FROM gemini_usage
                WHERE user_id = ?
            `;

            this.db.get(query, [yesterday.toISOString(), yesterday.toISOString(), userId], (err, row) => {
                if (err) {
                    console.error('Error getting usage stats:', err);
                    resolve(null);
                    return;
                }

                const totalRequests = row.total_requests || 0;
                const successfulRequests = row.successful_requests || 0;
                const failedRequests = totalRequests - successfulRequests;
                const successRate = totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(2) : 0;

                const recentRequests = row.recent_requests || 0;
                const recentSuccessfulRequests = row.recent_successful_requests || 0;
                const recentSuccessRate = recentRequests > 0 ? ((recentSuccessfulRequests / recentRequests) * 100).toFixed(2) : 0;

                resolve({
                    totalRequests,
                    successfulRequests,
                    failedRequests,
                    successRate: `${successRate}%`,
                    recentRequests,
                    recentSuccessRate: `${recentSuccessRate}%`,
                    averageResponseTime: row.avg_response_time ? Math.round(row.avg_response_time) : 0
                });
            });
        });
    }

    async updateApiUsageCount(apiId) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE gemini_apis SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP WHERE id = ?';
            this.db.run(query, [apiId], function(err) {
                if (err) {
                    console.error('Error updating API usage count:', err);
                    resolve();
                    return;
                }
                resolve();
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

// Export helper classes untuk digunakan di routes
module.exports.GeminiPromptManager = GeminiPromptManager;
module.exports.GeminiModelManager = GeminiModelManager;

module.exports = new GeminiStore();
