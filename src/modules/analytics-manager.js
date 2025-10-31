const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database path
const DB_PATH = path.join(__dirname, '..', '..', 'reelsync.db');

/**
 * Analytics Manager Module
 * Menangani semua operasi terkait analytics dan performance tracking
 */
class AnalyticsManager {
    constructor() {
        this.db = null;
        this.initDatabase();
    }

    async initDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('Error opening AnalyticsManager database:', err.message);
                    reject(err);
                    return;
                }

                // Create analytics tables if they don't exist
                const createTables = `
                    CREATE TABLE IF NOT EXISTS analytics_uploads (
                        id TEXT PRIMARY KEY,
                        account_name TEXT,
                        page_id TEXT,
                        page_name TEXT,
                        type TEXT,
                        file_name TEXT,
                        file_size INTEGER,
                        duration REAL,
                        caption TEXT,
                        hashtags TEXT,
                        status TEXT,
                        upload_url TEXT,
                        scheduled_time DATETIME,
                        actual_upload_time DATETIME,
                        completion_time DATETIME,
                        processing_time INTEGER,
                        retry_count INTEGER DEFAULT 0,
                        error_message TEXT,
                        category TEXT,
                        priority TEXT,
                        thumbnail_url TEXT,
                        video_url TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        user_id TEXT,
                        FOREIGN KEY (user_id) REFERENCES users(id)
                    );

                    CREATE TABLE IF NOT EXISTS analytics_engagement (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        upload_id TEXT,
                        account_name TEXT,
                        page_id TEXT,
                        type TEXT,
                        views INTEGER DEFAULT 0,
                        likes INTEGER DEFAULT 0,
                        comments INTEGER DEFAULT 0,
                        shares INTEGER DEFAULT 0,
                        reactions TEXT,
                        reach INTEGER DEFAULT 0,
                        impressions INTEGER DEFAULT 0,
                        engagement_rate REAL DEFAULT 0,
                        click_through_rate REAL DEFAULT 0,
                        watch_time INTEGER DEFAULT 0,
                        average_watch_time INTEGER DEFAULT 0,
                        tracked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                        user_id TEXT,
                        FOREIGN KEY (upload_id) REFERENCES analytics_uploads(id),
                        FOREIGN KEY (user_id) REFERENCES users(id)
                    );
                `;

                this.db.exec(createTables, (err) => {
                    if (err) {
                        console.error('Error creating AnalyticsManager tables:', err.message);
                        reject(err);
                        return;
                    }
                    console.log('✅ AnalyticsManager database initialized');
                    resolve();
                });
            });
        });
    }

    /**
     * Track upload data untuk analytics
     */
    async trackUpload(uploadData, userId) {
        return new Promise((resolve, reject) => {
            const uploadId = uploadData.id || this.generateId();

            const insertQuery = `
                INSERT OR REPLACE INTO analytics_uploads (
                    id, account_name, page_id, page_name, type, file_name, file_size, duration,
                    caption, hashtags, status, upload_url, scheduled_time, actual_upload_time,
                    completion_time, processing_time, retry_count, error_message, category,
                    priority, thumbnail_url, video_url, user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const hashtagsJson = JSON.stringify(uploadData.hashtags || []);
            const category = uploadData.category || this.categorizeContent(uploadData);

            const params = [
                uploadId,
                uploadData.accountName,
                uploadData.pageId,
                uploadData.pageName,
                uploadData.type,
                uploadData.fileName,
                uploadData.fileSize,
                uploadData.duration,
                uploadData.caption,
                hashtagsJson,
                uploadData.status || 'pending',
                uploadData.uploadUrl,
                uploadData.scheduledTime,
                uploadData.actualUploadTime,
                uploadData.completionTime,
                uploadData.processingTime,
                uploadData.retryCount || 0,
                uploadData.errorMessage,
                category,
                uploadData.priority || 'medium',
                uploadData.thumbnailUrl,
                uploadData.videoUrl,
                userId
            ];

            this.db.run(insertQuery, params, function(err) {
                if (err) {
                    console.error('Error tracking upload:', err);
                    reject({ success: false, error: err.message });
                    return;
                }

                console.log(`📊 Upload tracked: ${uploadId} - ${uploadData.type}`);
                resolve({ success: true, uploadId });
            });
        });
    }

    /**
     * Update engagement metrics untuk upload tertentu
     */
    async updateEngagement(uploadId, metrics, userId) {
        return new Promise((resolve, reject) => {
            const insertQuery = `
                INSERT OR REPLACE INTO analytics_engagement (
                    upload_id, account_name, page_id, type, views, likes, comments, shares,
                    reactions, reach, impressions, engagement_rate, click_through_rate,
                    watch_time, average_watch_time, user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const reactionsJson = JSON.stringify(metrics.reactions || {});
            const engagementRate = this.calculateEngagementRate(metrics);

            const params = [
                uploadId,
                metrics.accountName,
                metrics.pageId,
                metrics.type,
                metrics.views || 0,
                metrics.likes || 0,
                metrics.comments || 0,
                metrics.shares || 0,
                reactionsJson,
                metrics.reach || 0,
                metrics.impressions || 0,
                engagementRate,
                metrics.clickThroughRate || 0,
                metrics.watchTime || 0,
                metrics.averageWatchTime || 0,
                userId
            ];

            this.db.run(insertQuery, params, function(err) {
                if (err) {
                    console.error('Error updating engagement:', err);
                    reject({ success: false, error: err.message });
                    return;
                }

                console.log(`📈 Engagement updated: ${uploadId} - ${metrics.views || 0} views`);
                resolve({ success: true });
            });
        });
    }

    /**
     * Calculate engagement rate
     */
    calculateEngagementRate(metrics) {
        if (!metrics.views || metrics.views === 0) return 0;

        const totalEngagement = (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
        return ((totalEngagement / metrics.views) * 100);
    }

    /**
     * Auto-categorize content berdasarkan caption dan hashtags
     */
    categorizeContent(uploadData) {
        const text = `${uploadData.caption || ''} ${uploadData.hashtags?.join(' ') || ''}`.toLowerCase();

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
     * Get analytics dashboard data
     */
    async getDashboardData(timeRange = '30d', userId) {
        return new Promise((resolve, reject) => {
            const endDate = new Date();
            const startDate = new Date();

            switch (timeRange) {
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(endDate.getDate() - 90);
                    break;
                default:
                    startDate.setDate(endDate.getDate() - 30);
            }

            const queryPromises = [
                this.getUploadsData(startDate, endDate, userId),
                this.getEngagementData(startDate, endDate, userId),
                this.getTrendsDataFromDB(startDate, endDate, userId),
                this.getAccountComparisonFromDB(startDate, endDate, userId),
                this.getCategoryStatsFromDB(userId),
            ];

            Promise.all(queryPromises).then(([uploads, engagement, trendsData, accounts, categories]) => {
                try {
                    const overview = this.getOverviewStats(uploads, engagement);
                    const performance = this.getPerformanceStats(uploads, engagement);

                    resolve({
                        overview,
                        performance,
                        trends: trendsData,
                        accounts,
                        categories,
                        bestTimes: this.getBestPostingTimes(uploads, engagement)
                    });
                } catch (error) {
                    console.error('Error processing dashboard data:', error);
                    resolve(null);
                }
            }).catch(error => {
                console.error('Error in dashboard data queries:', error);
                resolve(null);
            });
        });
    }

    /**
     * Filter uploads by date range
     */
    filterUploadsByDate(uploads, startDate, endDate) {
        return uploads.filter(upload => {
            const uploadDate = new Date(upload.actualUploadTime || upload.createdAt);
            return uploadDate >= startDate && uploadDate <= endDate;
        });
    }

    /**
     * Filter engagement by date range
     */
    filterEngagementByDate(engagement, startDate, endDate) {
        return engagement.filter(eng => {
            const trackedDate = new Date(eng.trackedAt);
            return trackedDate >= startDate && trackedDate <= endDate;
        });
    }

    /**
     * Get overview statistics
     */
    getOverviewStats(uploads, engagement) {
        const totalUploads = uploads.length;
        const successfulUploads = uploads.filter(u => u.status === 'completed').length;
        const failedUploads = uploads.filter(u => u.status === 'failed').length;

        const totalViews = engagement.reduce((sum, e) => sum + (e.metrics.views || 0), 0);
        const totalLikes = engagement.reduce((sum, e) => sum + (e.metrics.likes || 0), 0);
        const totalComments = engagement.reduce((sum, e) => sum + (e.metrics.comments || 0), 0);
        const totalShares = engagement.reduce((sum, e) => sum + (e.metrics.shares || 0), 0);

        const avgEngagementRate = engagement.length > 0
            ? engagement.reduce((sum, e) => sum + (e.metrics.engagementRate || 0), 0) / engagement.length
            : 0;

        return {
            totalUploads,
            successfulUploads,
            failedUploads,
            successRate: totalUploads > 0 ? (successfulUploads / totalUploads * 100) : 0,
            totalViews,
            totalLikes,
            totalComments,
            totalShares,
            averageEngagementRate: avgEngagementRate,
            totalEngagement: totalLikes + totalComments + totalShares
        };
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats(uploads, engagement) {
        const reelUploads = uploads.filter(u => u.type === 'reel');
        const postUploads = uploads.filter(u => u.type === 'post');

        const reelEngagement = engagement.filter(e => e.type === 'reel');
        const postEngagement = engagement.filter(e => e.type === 'post');

        return {
            byType: {
                reels: {
                    uploads: reelUploads.length,
                    views: reelEngagement.reduce((sum, e) => sum + (e.metrics.views || 0), 0),
                    engagementRate: reelEngagement.length > 0
                        ? reelEngagement.reduce((sum, e) => sum + (e.metrics.engagementRate || 0), 0) / reelEngagement.length
                        : 0
                },
                posts: {
                    uploads: postUploads.length,
                    views: postEngagement.reduce((sum, e) => sum + (e.metrics.views || 0), 0),
                    engagementRate: postEngagement.length > 0
                        ? postEngagement.reduce((sum, e) => sum + (e.metrics.engagementRate || 0), 0) / postEngagement.length
                        : 0
                }
            },
            averageProcessingTime: uploads.length > 0
                ? uploads.reduce((sum, u) => sum + (u.processingTime || 0), 0) / uploads.length
                : 0,
            averageRetryCount: uploads.length > 0
                ? uploads.reduce((sum, u) => sum + (u.retryCount || 0), 0) / uploads.length
                : 0
        };
    }

    /**
     * Get trends data
     */
    getTrendsData(uploads, engagement, startDate, endDate) {
        const dailyStats = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dayUploads = uploads.filter(u => {
                const uploadDate = new Date(u.actualUploadTime || u.createdAt);
                return uploadDate.toDateString() === currentDate.toDateString();
            });

            const dayEngagement = engagement.filter(e => {
                const trackedDate = new Date(e.trackedAt);
                return trackedDate.toDateString() === currentDate.toDateString();
            });

            dailyStats.push({
                date: currentDate.toISOString().split('T')[0],
                totalUploads: dayUploads.length,
                successfulUploads: dayUploads.filter(u => u.status === 'completed').length,
                totalViews: dayEngagement.reduce((sum, e) => sum + (e.metrics.views || 0), 0),
                totalEngagement: dayEngagement.reduce((sum, e) =>
                    sum + (e.metrics.likes || 0) + (e.metrics.comments || 0) + (e.metrics.shares || 0), 0
                ),
                topPerformingUpload: dayUploads
                    .filter(u => u.status === 'completed')
                    .sort((a, b) => (b.processingTime || 0) - (a.processingTime || 0))[0]?.id
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return {
            dailyStats,
            weeklyStats: this.getWeeklyStats(dailyStats),
            monthlyStats: this.getMonthlyStats(dailyStats)
        };
    }

    /**
     * Get weekly statistics
     */
    getWeeklyStats(dailyStats) {
        const weeklyStats = [];
        for (let i = 0; i < dailyStats.length; i += 7) {
            const weekData = dailyStats.slice(i, i + 7);
            weeklyStats.push({
                weekStart: weekData[0]?.date,
                totalUploads: weekData.reduce((sum, d) => sum + d.totalUploads, 0),
                totalViews: weekData.reduce((sum, d) => sum + d.totalViews, 0),
                totalEngagement: weekData.reduce((sum, d) => sum + d.totalEngagement, 0),
                engagementGrowth: weeklyStats.length > 0
                    ? ((weekData.reduce((sum, d) => sum + d.totalEngagement, 0) -
                        weeklyStats[weeklyStats.length - 1].totalEngagement) /
                       weeklyStats[weeklyStats.length - 1].totalEngagement * 100)
                    : 0
            });
        }
        return weeklyStats;
    }

    /**
     * Get monthly statistics
     */
    getMonthlyStats(dailyStats) {
        const monthlyStats = [];
        const monthlyGroups = {};

        dailyStats.forEach(day => {
            const monthKey = day.date.substring(0, 7); // YYYY-MM
            if (!monthlyGroups[monthKey]) {
                monthlyGroups[monthKey] = [];
            }
            monthlyGroups[monthKey].push(day);
        });

        Object.keys(monthlyGroups).forEach(month => {
            const monthData = monthlyGroups[month];
            monthlyStats.push({
                month,
                totalUploads: monthData.reduce((sum, d) => sum + d.totalUploads, 0),
                totalViews: monthData.reduce((sum, d) => sum + d.totalViews, 0),
                totalEngagement: monthData.reduce((sum, d) => sum + d.totalEngagement, 0)
            });
        });

        return monthlyStats;
    }

    /**
     * Get account comparison data
     */
    getAccountComparison(uploads, engagement) {
        const accountGroups = {};

        uploads.forEach(upload => {
            if (!accountGroups[upload.accountName]) {
                accountGroups[upload.accountName] = {
                    accountName: upload.accountName,
                    uploads: [],
                    engagement: []
                };
            }
            accountGroups[upload.accountName].uploads.push(upload);
        });

        engagement.forEach(eng => {
            if (accountGroups[eng.accountName]) {
                accountGroups[eng.accountName].engagement.push(eng);
            }
        });

        return Object.values(accountGroups).map(account => ({
            accountName: account.accountName,
            totalUploads: account.uploads.length,
            successfulUploads: account.uploads.filter(u => u.status === 'completed').length,
            totalViews: account.engagement.reduce((sum, e) => sum + (e.metrics.views || 0), 0),
            totalLikes: account.engagement.reduce((sum, e) => sum + (e.metrics.likes || 0), 0),
            totalComments: account.engagement.reduce((sum, e) => sum + (e.metrics.comments || 0), 0),
            totalShares: account.engagement.reduce((sum, e) => sum + (e.metrics.shares || 0), 0),
            averageEngagementRate: account.engagement.length > 0
                ? account.engagement.reduce((sum, e) => sum + (e.metrics.engagementRate || 0), 0) / account.engagement.length
                : 0,
            successRate: account.uploads.length > 0
                ? (account.uploads.filter(u => u.status === 'completed').length / account.uploads.length * 100)
                : 0,
            averageProcessingTime: account.uploads.length > 0
                ? account.uploads.reduce((sum, u) => sum + (u.processingTime || 0), 0) / account.uploads.length
                : 0
        }));
    }

    /**
     * Get category statistics
     */
    getCategoryStats(uploads, engagement) {
        const categoryGroups = {};

        uploads.forEach(upload => {
            const category = upload.category || 'uncategorized';
            if (!categoryGroups[category]) {
                categoryGroups[category] = {
                    category,
                    uploads: [],
                    engagement: []
                };
            }
            categoryGroups[category].uploads.push(upload);
        });

        engagement.forEach(eng => {
            const upload = uploads.find(u => u.id === eng.uploadId);
            if (upload) {
                const category = upload.category || 'uncategorized';
                if (categoryGroups[category]) {
                    categoryGroups[category].engagement.push(eng);
                }
            }
        });

        return Object.values(categoryGroups).map(cat => ({
            category: cat.category,
            totalUploads: cat.uploads.length,
            averageViews: cat.engagement.length > 0
                ? cat.engagement.reduce((sum, e) => sum + (e.metrics.views || 0), 0) / cat.engagement.length
                : 0,
            averageEngagementRate: cat.engagement.length > 0
                ? cat.engagement.reduce((sum, e) => sum + (e.metrics.engagementRate || 0), 0) / cat.engagement.length
                : 0,
            topHashtags: this.getTopHashtags(cat.uploads)
        }));
    }

    /**
     * Get top hashtags for category
     */
    getTopHashtags(uploads) {
        const hashtagCount = {};

        uploads.forEach(upload => {
            if (upload.hashtags) {
                upload.hashtags.forEach(tag => {
                    hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
                });
            }
        });

        return Object.entries(hashtagCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([tag]) => tag);
    }

    /**
     * Get best posting times analysis
     */
    getBestPostingTimes(uploads, engagement) {
        const timeSlots = {};

        // Initialize time slots (24 hours x 7 days)
        for (let hour = 0; hour < 24; hour++) {
            for (let day = 0; day < 7; day++) {
                const key = `${day}-${hour}`;
                timeSlots[key] = {
                    hour,
                    dayOfWeek: day,
                    uploads: [],
                    engagement: []
                };
            }
        }

        // Group uploads by time slots
        uploads.forEach(upload => {
            if (upload.actualUploadTime) {
                const uploadDate = new Date(upload.actualUploadTime);
                const day = uploadDate.getDay();
                const hour = uploadDate.getHours();
                const key = `${day}-${hour}`;

                if (timeSlots[key]) {
                    timeSlots[key].uploads.push(upload);
                }
            }
        });

        // Group engagement by time slots
        engagement.forEach(eng => {
            const upload = uploads.find(u => u.id === eng.uploadId);
            if (upload && upload.actualUploadTime) {
                const uploadDate = new Date(upload.actualUploadTime);
                const day = uploadDate.getDay();
                const hour = uploadDate.getHours();
                const key = `${day}-${hour}`;

                if (timeSlots[key]) {
                    timeSlots[key].engagement.push(eng);
                }
            }
        });

        // Calculate performance for each time slot
        return Object.values(timeSlots)
            .filter(slot => slot.uploads.length > 0)
            .map(slot => ({
                hour: slot.hour,
                dayOfWeek: slot.dayOfWeek,
                totalUploads: slot.uploads.length,
                averageEngagement: slot.engagement.length > 0
                    ? slot.engagement.reduce((sum, e) => sum + (e.metrics.engagementRate || 0), 0) / slot.engagement.length
                    : 0,
                totalViews: slot.engagement.reduce((sum, e) => sum + (e.metrics.views || 0), 0),
                successRate: slot.uploads.length > 0
                    ? (slot.uploads.filter(u => u.status === 'completed').length / slot.uploads.length * 100)
                    : 0
            }))
            .sort((a, b) => b.averageEngagement - a.averageEngagement)
            .slice(0, 20); // Top 20 time slots
    }

    /**
     * Export analytics data
     */
    async exportData(format = 'json', timeRange = '30d') {
        try {
            const dashboardData = await this.getDashboardData(timeRange);

            if (format === 'json') {
                return {
                    success: true,
                    data: dashboardData,
                    exportDate: new Date().toISOString(),
                    timeRange: timeRange
                };
            } else if (format === 'csv') {
                return this.exportToCSV(dashboardData);
            } else if (format === 'pdf') {
                return this.exportToPDF(dashboardData);
            }

            return { success: false, error: 'Unsupported format' };
        } catch (error) {
            console.error('Error exporting data:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Export to CSV format
     */
    exportToCSV(data) {
        // Implementation untuk CSV export
        // Ini akan diimplementasikan ketika frontend siap
        return {
            success: true,
            data: 'CSV export not implemented yet',
            format: 'csv'
        };
    }

    /**
     * Export to PDF format
     */
    exportToPDF(data) {
        // Implementation untuk PDF export
        // Ini akan diimplementasikan ketika frontend siap
        return {
            success: true,
            data: 'PDF export not implemented yet',
            format: 'pdf'
        };
    }

    // Helper methods for database queries
    async getUploadsData(startDate, endDate, userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM analytics_uploads
                WHERE user_id = ? AND actual_upload_time BETWEEN ? AND ?
                ORDER BY actual_upload_time DESC
            `;

            this.db.all(query, [userId, startDate.toISOString(), endDate.toISOString()], (err, rows) => {
                if (err) {
                    console.error('Error getting uploads data:', err);
                    resolve([]);
                    return;
                }

                const uploads = rows.map(row => ({
                    id: row.id,
                    accountName: row.account_name,
                    pageId: row.page_id,
                    pageName: row.page_name,
                    type: row.type,
                    fileName: row.file_name,
                    status: row.status,
                    actualUploadTime: row.actual_upload_time,
                    completionTime: row.completion_time,
                    processingTime: row.processing_time,
                    retryCount: row.retry_count,
                    errorMessage: row.error_message,
                    category: row.category,
                }));

                resolve(uploads);
            });
        });
    }

    async getEngagementData(startDate, endDate, userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM analytics_engagement
                WHERE user_id = ? AND tracked_at BETWEEN ? AND ?
                ORDER BY tracked_at DESC
            `;

            this.db.all(query, [userId, startDate.toISOString(), endDate.toISOString()], (err, rows) => {
                if (err) {
                    console.error('Error getting engagement data:', err);
                    resolve([]);
                    return;
                }

                const engagement = rows.map(row => ({
                    uploadId: row.upload_id,
                    accountName: row.account_name,
                    pageId: row.page_id,
                    type: row.type,
                    metrics: {
                        views: row.views,
                        likes: row.likes,
                        comments: row.comments,
                        shares: row.shares,
                        engagementRate: row.engagement_rate,
                        reach: row.reach,
                        impressions: row.impressions,
                        reactions: row.reactions ? JSON.parse(row.reactions) : {},
                    },
                    trackedAt: row.tracked_at,
                }));

                resolve(engagement);
            });
        });
    }

    async getTrendsDataFromDB(startDate, endDate, userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    DATE(actual_upload_time) as date,
                    COUNT(*) as totalUploads,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successfulUploads
                FROM analytics_uploads
                WHERE user_id = ? AND actual_upload_time BETWEEN ? AND ?
                GROUP BY DATE(actual_upload_time)
                ORDER BY date DESC
            `;

            this.db.all(query, [userId, startDate.toISOString(), endDate.toISOString()], (err, rows) => {
                if (err) {
                    console.error('Error getting trends data:', err);
                    resolve([]);
                    return;
                }

                // Process daily stats and engagement data
                const dailyStats = [];
                let i = 0;
                while (startDate <= endDate) {
                    const dateString = startDate.toISOString().split('T')[0];
                    const dbRow = rows.find(row => row.date === dateString) || {
                        totalUploads: 0,
                        successfulUploads: 0
                    };

                    dailyStats.push({
                        date: dateString,
                        totalUploads: dbRow.totalUploads,
                        successfulUploads: dbRow.successfulUploads,
                        totalViews: 0, // Will be populated from engagement data
                        totalEngagement: 0,
                        topPerformingUpload: null
                    });

                    startDate.setDate(startDate.getDate() + 1);
                }

                // Get engagement data for the same period
                this.getEngagementData(new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000), endDate, userId)
                    .then(engagementData => {
                        // Aggregate engagement by date
                        const engagementByDate = {};
                        engagementData.forEach(eng => {
                            const dateKey = new Date(eng.trackedAt).toISOString().split('T')[0];
                            if (!engagementByDate[dateKey]) {
                                engagementByDate[dateKey] = { totalViews: 0, totalEngagement: 0 };
                            }
                            engagementByDate[dateKey].totalViews += eng.metrics.views || 0;
                            engagementByDate[dateKey].totalEngagement +=
                                (eng.metrics.likes || 0) + (eng.metrics.comments || 0) + (eng.metrics.shares || 0);
                        });

                        // Merge engagement data into daily stats
                        dailyStats.forEach(day => {
                            const engData = engagementByDate[day.date];
                            if (engData) {
                                day.totalViews = engData.totalViews;
                                day.totalEngagement = engData.totalEngagement;
                            }
                        });

                        const result = {
                            dailyStats,
                            weeklyStats: this.getWeeklyStats(dailyStats),
                            monthlyStats: this.getMonthlyStats(dailyStats)
                        };

                        resolve(result);
                    })
                    .catch(error => {
                        console.error('Error getting engagement for trends:', error);
                        resolve({
                            dailyStats,
                            weeklyStats: this.getWeeklyStats(dailyStats),
                            monthlyStats: this.getMonthlyStats(dailyStats)
                        });
                    });
            });
        });
    }

    async getAccountComparisonFromDB(startDate, endDate, userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    account_name,
                    COUNT(*) as totalUploads,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successfulUploads,
                    AVG(processing_time) as averageProcessingTime
                FROM analytics_uploads
                WHERE user_id = ? AND actual_upload_time BETWEEN ? AND ?
                GROUP BY account_name
            `;

            this.db.all(query, [userId, startDate.toISOString(), endDate.toISOString()], (err, rows) => {
                if (err) {
                    console.error('Error getting account comparison:', err);
                    resolve([]);
                    return;
                }

                const accounts = rows.map(row => ({
                    accountName: row.account_name,
                    totalUploads: row.totalUploads,
                    successfulUploads: row.successfulUploads,
                    successRate: row.totalUploads > 0 ? ((row.successfulUploads / row.totalUploads) * 100) : 0,
                    averageProcessingTime: row.averageProcessingTime || 0,
                    // Placeholder values for engagement (would need separate query)
                    totalViews: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    totalShares: 0,
                    averageEngagementRate: 0
                }));

                resolve(accounts);
            });
        });
    }

    async getCategoryStatsFromDB(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    category,
                    COUNT(*) as totalUploads,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successfulUploads,
                    GROUP_CONCAT(DISTINCT hashtags) as hashtagsList
                FROM analytics_uploads
                WHERE user_id = ? AND category IS NOT NULL AND category != ''
                GROUP BY category
            `;

            this.db.all(query, [userId], (err, rows) => {
                if (err) {
                    console.error('Error getting category stats:', err);
                    resolve([]);
                    return;
                }

                const categories = rows.map(row => ({
                    category: row.category,
                    totalUploads: row.totalUploads,
                    averageViews: 0, // Would need engagement data
                    averageEngagementRate: 0,
                    topHashtags: row.hashtagsList ? this.extractTopHashtags(row.hashtagsList) : []
                }));

                resolve(categories);
            });
        });
    }

    extractTopHashtags(hashtagsString) {
        // Parse and count hashtags from the concatenated string
        const hashtagCount = {};
        const tags = hashtagsString.split(',').filter(tag => tag.trim());

        tags.forEach(tagList => {
            try {
                const parsed = JSON.parse(tagList);
                if (Array.isArray(parsed)) {
                    parsed.forEach(tag => {
                        hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
                    });
                }
            } catch (e) {
                // Ignore parsing errors
            }
        });

        return Object.entries(hashtagCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([tag]) => tag);
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Clean up old analytics data
     */
    async cleanupOldData(daysToKeep = 90) {
        try {
            const data = await this.readDb();
            const analytics = data.analytics || {};

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            // Clean uploads
            if (analytics.uploads) {
                analytics.uploads = analytics.uploads.filter(upload => {
                    const uploadDate = new Date(upload.createdAt);
                    return uploadDate >= cutoffDate;
                });
            }

            // Clean engagement
            if (analytics.engagement) {
                analytics.engagement = analytics.engagement.filter(engagement => {
                    const trackedDate = new Date(engagement.trackedAt);
                    return trackedDate >= cutoffDate;
                });
            }

            await this.writeDb(data);

            console.log(`🧹 Cleaned up analytics data older than ${daysToKeep} days`);
            return { success: true, message: `Cleaned up data older than ${daysToKeep} days` };
        } catch (error) {
            console.error('Error cleaning up old data:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = AnalyticsManager;
