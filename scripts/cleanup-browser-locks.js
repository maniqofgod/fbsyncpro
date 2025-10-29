#!/usr/bin/env node

/**
 * Cleanup Browser Lock Files
 * Script untuk membersihkan lock files Puppeteer yang bermasalah
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function cleanupBrowserLocks() {
    console.log('🧹 Cleaning up browser lock files...');
    console.log('='.repeat(50));
    console.log('');

    try {
        // Common temp directories
        const tempDirs = [
            os.tmpdir(),
            path.join(os.homedir(), 'AppData', 'Local', 'Temp'),
            path.join(os.homedir(), '.cache', 'puppeteer')
        ];

        let cleanedCount = 0;

        for (const tempDir of tempDirs) {
            if (fs.existsSync(tempDir)) {
                console.log(`🔍 Checking directory: ${tempDir}`);

                try {
                    const files = fs.readdirSync(tempDir);

                    for (const file of files) {
                        const filePath = path.join(tempDir, file);
                        const stats = fs.statSync(filePath);

                        // Check if it's a puppeteer profile directory
                        if (stats.isDirectory() &&
                            (file.includes('puppeteer') ||
                             file.includes('chrome') ||
                             file.includes('profile'))) {

                            console.log(`🗂️ Found Puppeteer directory: ${file}`);

                            // Check for lockfile
                            const lockfilePath = path.join(filePath, 'lockfile');
                            if (fs.existsSync(lockfilePath)) {
                                console.log(`🔒 Found lockfile: ${lockfilePath}`);

                                try {
                                    fs.unlinkSync(lockfilePath);
                                    console.log(`✅ Removed lockfile: ${lockfilePath}`);
                                    cleanedCount++;
                                } catch (error) {
                                    console.log(`❌ Could not remove lockfile: ${error.message}`);

                                    // Try to read lockfile content to understand what's locking it
                                    try {
                                        const lockContent = fs.readFileSync(lockfilePath, 'utf8');
                                        console.log(`📝 Lockfile content: ${lockContent}`);
                                    } catch (readError) {
                                        console.log(`❌ Could not read lockfile: ${readError.message}`);
                                    }
                                }
                            }

                            // Check for SingletonLock files
                            const singletonLockPath = path.join(filePath, 'SingletonLock');
                            if (fs.existsSync(singletonLockPath)) {
                                console.log(`🔒 Found SingletonLock: ${singletonLockPath}`);

                                try {
                                    fs.unlinkSync(singletonLockPath);
                                    console.log(`✅ Removed SingletonLock: ${singletonLockPath}`);
                                    cleanedCount++;
                                } catch (error) {
                                    console.log(`❌ Could not remove SingletonLock: ${error.message}`);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.log(`⚠️ Could not read directory ${tempDir}: ${error.message}`);
                }
            } else {
                console.log(`📁 Directory not found: ${tempDir}`);
            }
        }

        // Also check current working directory for any puppeteer profiles
        const currentDir = process.cwd();
        console.log(`🔍 Checking current directory: ${currentDir}`);

        try {
            const files = fs.readdirSync(currentDir);
            for (const file of files) {
                if (file.includes('puppeteer') || file.includes('chrome')) {
                    const filePath = path.join(currentDir, file);
                    const stats = fs.statSync(filePath);

                    if (stats.isDirectory()) {
                        console.log(`🗂️ Found Puppeteer directory in cwd: ${file}`);

                        const lockfilePath = path.join(filePath, 'lockfile');
                        if (fs.existsSync(lockfilePath)) {
                            try {
                                fs.unlinkSync(lockfilePath);
                                console.log(`✅ Removed lockfile from cwd: ${lockfilePath}`);
                                cleanedCount++;
                            } catch (error) {
                                console.log(`❌ Could not remove cwd lockfile: ${error.message}`);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.log(`⚠️ Could not read current directory: ${error.message}`);
        }

        console.log('');
        console.log('📊 Cleanup Summary:');
        console.log(`🧹 Cleaned ${cleanedCount} lock files`);
        console.log('');

        if (cleanedCount > 0) {
            console.log('✅ Browser lock files cleaned successfully!');
            console.log('💡 You can now run browser automation without EBUSY errors');
        } else {
            console.log('ℹ️ No lock files found to clean');
            console.log('💡 If you still get EBUSY errors, try:');
            console.log('   - Restart your computer');
            console.log('   - Kill any Chrome/Chromium processes in Task Manager');
            console.log('   - Clear browser cache and temp files');
        }

        console.log('');
        console.log('🔧 Manual cleanup commands:');
        console.log('   Windows: taskkill /f /im chrome.exe');
        console.log('   Windows: taskkill /f /im "Google Chrome.exe"');
        console.log('   Windows: rd /s /q %temp%\\puppeteer_*');

    } catch (error) {
        console.error('💥 Cleanup failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

function killBrowserProcesses() {
    console.log('🔪 Killing browser processes...');
    console.log('');

    try {
        const { execSync } = require('child_process');

        // Kill Chrome processes (Windows)
        try {
            console.log('🔍 Killing Chrome processes...');
            execSync('taskkill /f /im chrome.exe 2>nul', { stdio: 'pipe' });
            console.log('✅ Chrome processes killed');
        } catch (e) {
            console.log('ℹ️ No Chrome processes found');
        }

        // Kill Chromium processes
        try {
            console.log('🔍 Killing Chromium processes...');
            execSync('taskkill /f /im "Google Chrome.exe" 2>nul', { stdio: 'pipe' });
            console.log('✅ Chromium processes killed');
        } catch (e) {
            console.log('ℹ️ No Chromium processes found');
        }

        // Kill any remaining browser processes
        try {
            console.log('🔍 Killing any remaining browser processes...');
            execSync('taskkill /f /im *chrome* 2>nul', { stdio: 'pipe' });
            console.log('✅ All browser processes killed');
        } catch (e) {
            console.log('ℹ️ No remaining browser processes found');
        }

    } catch (error) {
        console.log('⚠️ Could not kill processes (may require admin privileges)');
        console.log('💡 Try manually in Task Manager or Command Prompt as Administrator');
    }
}

async function main() {
    const args = process.argv.slice(2);

    console.log('🧹 Browser Lock Files Cleanup Tool');
    console.log('='.repeat(50));
    console.log('');

    if (args.includes('--kill-processes')) {
        killBrowserProcesses();
    } else {
        killBrowserProcesses(); // Always kill processes first
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        cleanupBrowserLocks();
    }

    console.log('');
    console.log('🎉 Cleanup completed!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Try running your browser automation again');
    console.log('2. If issues persist, restart your computer');
    console.log('3. Check Task Manager for any stuck browser processes');
    console.log('');
    console.log('💡 Usage:');
    console.log('   node scripts/cleanup-browser-locks.js');
    console.log('   node scripts/cleanup-browser-locks.js --kill-processes');
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Cleanup failed:', error);
        process.exit(1);
    });
}

module.exports = { cleanupBrowserLocks, killBrowserProcesses };