/**
 * Debug script to check browser visibility settings and test Puppeteer launch
 */

const Database = require('better-sqlite3');
const path = require('path');

async function debugBrowserVisibility() {
    console.log('🔍 Debugging browser visibility...\n');

    try {
        // Step 1: Check database settings
        console.log('1️⃣ Checking database settings...');
        const dbPath = path.join(__dirname, '..', 'database.sqlite');
        const db = new Database(dbPath);

        const stmt = db.prepare('SELECT key, value FROM settings WHERE key = ?');
        const setting = stmt.get('showBrowser');

        console.log('Database setting:', setting);

        if (setting) {
            console.log(`📊 showBrowser stored as: "${setting.value}" (type: ${typeof setting.value})`);
            console.log(`📊 showBrowser boolean conversion: ${setting.value === 'true'}`);
        } else {
            console.log('❌ No showBrowser setting found in database');
        }

        db.close();

        // Step 2: Test direct Puppeteer launch with headless: false
        console.log('\n2️⃣ Testing direct Puppeteer launch...');

        const puppeteer = require('puppeteer');

        console.log('🎯 Launching browser with headless: false...');

        try {
            const browser = await puppeteer.launch({
                headless: false, // Explicitly set to false
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--window-size=1280,1024',
                    '--start-maximized'
                ],
                defaultViewport: {
                    width: 1366,
                    height: 768
                },
                ignoreDefaultArgs: ['--enable-automation'],
                timeout: 60000
            });

            console.log('✅ Browser launched successfully!');
            console.log('📱 Creating page...');

            const page = await browser.newPage();
            await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });

            console.log('🌐 Page loaded successfully');
            console.log('📸 Taking screenshot to verify...');

            // Take screenshot to verify browser is working
            const screenshotPath = path.join(__dirname, '..', 'debug-direct-launch.png');
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`📸 Screenshot saved: ${screenshotPath}`);

            console.log('📝 Waiting 10 seconds for visual verification...');
            await new Promise(resolve => setTimeout(resolve, 10000));

            await browser.close();
            console.log('✅ Browser closed successfully');

        } catch (launchError) {
            console.error('❌ Failed to launch browser:', launchError.message);

            // Check if it's a display issue
            if (launchError.message.includes('DISPLAY') || launchError.message.includes('display')) {
                console.log('💻 This seems to be a display/server environment issue');
                console.log('🚀 In server environments, browser windows cannot be displayed');
                console.log('💡 Solution: Use Xvfb or run on desktop environment');
            }
        }

        // Step 3: Test FacebookAutomation with debug
        console.log('\n3️⃣ Testing FacebookAutomation initialization...');

        const FacebookAutomation = require('../src/modules/facebook-automation');

        const fbAuto = new FacebookAutomation({ showBrowser: true });

        console.log('FacebookAutomation options:', fbAuto.options);
        console.log('🚀 Initializing FacebookAutomation...');

        try {
            await fbAuto.initialize();
            console.log('✅ FacebookAutomation initialized');

            console.log('📝 Creating test page...');
            const page = await fbAuto.browser.newPage();
            await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });

            const screenshotPath = path.join(__dirname, '..', 'debug-facebook-automation.png');
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`📸 Screenshot saved: ${screenshotPath}`);

            await fbAuto.close();

        } catch (fbError) {
            console.error('❌ FacebookAutomation initialization failed:', fbError.message);
        }

        console.log('\n🎉 Debug completed!');

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

// Run debug if called directly
if (require.main === module) {
    debugBrowserVisibility().then(() => {
        console.log('\n🔚 Debug script finished');
        process.exit(0);
    }).catch(error => {
        console.error('\n❌ Debug failed:', error);
        process.exit(1);
    });
}

module.exports = debugBrowserVisibility;
