const Store = require('electron-store');
const fs = require('fs').promises;
const path = require('path');

// Inisialisasi electron-store
const store = new Store();

const DB_PATH = path.join(__dirname, '..', '..', 'db.json');

/**
 * Analytics Manager Module
 * Menangani semua operasi terkait analytics dan performance tracking
 */
class AnalyticsManager {
    constructor() {
        this.store = store;
        this.dbPath = DB_PATH;
    }

    /**
     * Track upload data untuk analytics
     */
    async trackUpload(uploadData) {
        try {
            const data = await this.readDb();
            const analytics = data.analytics || {};

            if (!analytics.uploads) analytics.uploads = [];

            const uploadRecord = {
                id: uploadData.id || this.generateId(),
                accountName: uploadData.accountName,
                pageId: uploadData.pageId,
                pageName: uploadData.pageName,
                type: uploadData.type,
                fileName: uploadData.fileName,
                fileSize: uploadData.fileSize,
                duration: uploadData.duration,
                caption: uploadData.caption,
                hashtags: uploadData.hashtags || [],
                status: uploadData.status || 'pending',
                uploadUrl: uploadData.uploadUrl,
                scheduledTime: uploadData.scheduledTime,
                actualUploadTime: uploadData.actualUploadTime,
                completionTime: uploadData.completionTime,
                processingTime: uploadData.processingTime,
                retryCount: uploadData.retryCount || 0,
                errorMessage: uploadData.errorMessage,
                category: uploadData.category || this.categorizeContent(uploadData),
                priority: uploadData.priority || 'medium',
                thumbnailUrl: uploadData.thumbnailUrl,
                videoUrl: uploadData.videoUrl,
                createdAt: new Date().toISOString()
            };

            analytics.uploads.push(uploadRecord);
            await this.writeDb(data);

            console.log(`📊 Upload tracked: ${uploadRecord.id} - ${uploadRecord.type}`);
            return { success: true, uploadId: uploadRecord.id };
        } catch (error) {
            console.error('Error tracking upload:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update engagement metrics untuk upload tertentu
     */
    async updateEngagement(uploadId, metrics) {
        try {
            const data = await this.readDb();
            const analytics = data.analytics || {};

            if (!analytics.engagement) analytics.engagement = [];

            // Cari engagement record yang sudah ada
            const existingIndex = analytics.engagement.findIndex(e => e.uploadId === uploadId);

            const engagementRecord = {
                uploadId: uploadId,
                accountName: metrics.accountName,
                pageId: metrics.pageId,
                type: metrics.type,
                metrics: {
                    views: metrics.views || 0,
                    likes: metrics.likes || 0,
                    comments: metrics.comments || 0,
                    shares: metrics.shares || 0,
                    reactions: metrics.reactions || {},
                    reach: metrics.reach || 0,
                    impressions: metrics.impressions || 0,
                    engagementRate: this.calculateEngagementRate(metrics),
                    clickThroughRate: metrics.clickThroughRate || 0,
                    watchTime: metrics.watchTime || 0,
                    averageWatchTime: metrics.averageWatchTime || 0
                },
                trackedAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };

            if (existingIndex >= 0) {
                analytics.engagement[existingIndex] = engagementRecord;
            } else {
                analytics.engagement.push(engagementRecord);
            }

            await this.writeDb(data);

            console.log(`📈 Engagement updated: ${uploadId} - ${metrics.views || 0} views`);
            return { success: true };
        } catch (error) {
            console.error('Error updating engagement:', error);
            return { success: false, error: error.message };
        }
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
    async getDashboardData(timeRange = '30d') {
        try {
            const data = await this.readDb();
            const analytics = data.analytics || {};

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

            const filteredUploads = this.filterUploadsByDate(analytics.uploads || [], startDate, endDate);
            const filteredEngagement = this.filterEngagementByDate(analytics.engagement || [], startDate, endDate);

            return {
                overview: this.getOverviewStats(filteredUploads, filteredEngagement),
                performance: this.getPerformanceStats(filteredUploads, filteredEngagement),
                trends: this.getTrendsData(filteredUploads, filteredEngagement, startDate, endDate),
                accounts: this.getAccountComparison(filteredUploads, filteredEngagement),
                categories: this.getCategoryStats(filteredUploads, filteredEngagement),
                bestTimes: this.getBestPostingTimes(filteredUploads, filteredEngagement)
            };
        } catch (error) {
            console.error('Error getting dashboard data:', error);
            return null;
        }
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

    /**
     * Read database file
     */
    async readDb() {
        try {
            const data = await fs.readFile(this.dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading database:', error);
            return {};
        }
    }

    /**
     * Write database file
     */
    async writeDb(data) {
        try {
            await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error writing database:', error);
            throw error;
        }
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
