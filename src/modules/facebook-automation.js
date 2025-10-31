const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Facebook Automation Module
 * Menangani upload otomatis menggunakan Puppeteer dengan automation element langsung
 * tanpa menggunakan macro recorder
 */
class FacebookAutomation {
    constructor(options = {}) {
        this.browser = null;
        this.isInitialized = false;

        // Set default options
        this.options = {
            showBrowser: false,
            ...options
        };

        // Set headless mode based on showBrowser
        this.options.headless = this.options.showBrowser ? false : "new";
    }

    /**
     * Update options
     */
    updateOptions(newOptions) {
        const oldOptions = { ...this.options };
        this.options = { ...this.options, ...newOptions };

        // Ensure headless mode matches showBrowser setting
        if (newOptions.showBrowser !== undefined) {
            this.options.headless = newOptions.showBrowser ? false : "new";
        }

        // If browser visibility option changed, close current browser to force restart with new setting
        const browserVisibilityChanged = oldOptions.headless !== this.options.headless ||
                                        oldOptions.showBrowser !== this.options.showBrowser;

        if (browserVisibilityChanged && this.isInitialized) {
            console.log('🔄 Browser visibility options changed, closing current browser...');
            this.close().catch(error => {
                console.warn('Warning during browser close for options update:', error.message);
            });
        }

        console.log('FacebookAutomation options updated:', this.options);
    }



    /**
       * Handle switch profile popup jika muncul dengan visual indicators
       * @param {Page} page - Puppeteer page instance
       * @param {string} pageId - Facebook page ID
       * @returns {Promise<boolean>} - true jika berhasil switch ke dashboard
       */
    async handleSwitchProfilePopup(page, pageId) {
        try {
            console.log('🔄 Checking for switch profile and navigating to dashboard...');

            // Step 1: Navigate to profile
            console.log('\n📍 Step 1: Navigate to profile');
            await page.goto(`https://www.facebook.com/profile.php?id=${pageId}`, { waitUntil: 'networkidle2' });
            await page.waitForTimeout(3000);
            console.log('✅ Profile loaded - Taking initial screenshot...');
            await page.screenshot({ path: 'debug-profile-loaded.png', fullPage: true });
            console.log('📸 Screenshot: debug-profile-loaded.png');

            // Step 2: Visual indicator for dashboard click
            console.log('\n🎯 Step 2: Adding visual indicator for dashboard click...');
            await page.evaluate(() => {
                const indicator = document.createElement('div');
                indicator.style.position = 'fixed';
                indicator.style.left = '140px';
                indicator.style.top = '190px';
                indicator.style.width = '20px';
                indicator.style.height = '20px';
                indicator.style.border = '3px solid red';
                indicator.style.borderRadius = '50%';
                indicator.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
                indicator.style.zIndex = '999999';
                indicator.style.pointerEvents = 'none';
                indicator.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.8)';
                indicator.textContent = 'DASHBOARD';
                indicator.style.color = 'white';
                indicator.style.fontSize = '8px';
                indicator.style.display = 'flex';
                indicator.style.alignItems = 'center';
                indicator.style.justifyContent = 'center';
                indicator.style.fontWeight = 'bold';
                document.body.appendChild(indicator);

                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }
                }, 2000);
            });

            await page.mouse.click(150, 200);
            console.log('✅ 🖱️ DASHBOARD CLICKED at (150, 200) - Taking screenshot...');
            await page.screenshot({ path: 'debug-after-dashboard-click.png', fullPage: true });
            console.log('📸 Screenshot: debug-after-dashboard-click.png');
            await page.waitForTimeout(2000);

            // Check URL after dashboard click
            let currentUrl = page.url();
            console.log('📍 URL after dashboard click:', currentUrl);

            if (currentUrl.includes('professional_dashboard')) {
                console.log('✅ 🎉 SUCCESS! Already in professional dashboard!');
                return true;
            } else {
                console.log('⚠️ Not in dashboard yet, trying Ubah button...');

                // Step 3: Visual indicators for Ubah button clicks
                console.log('\n🎯 Step 3: Adding visual indicators for Ubah button clicks...');

                const ubahPositions = [
                    { x: 850, y: 590, name: 'BOTTOM-RIGHT' }
                ];

                for (const coord of ubahPositions) {
                    console.log(`\n🎯 Trying Ubah button at (${coord.x}, ${coord.y}) - ${coord.name}`);

                    // Add visual indicator
                    await page.evaluate((x, y, name) => {
                        const indicator = document.createElement('div');
                        indicator.style.position = 'fixed';
                        indicator.style.left = (x - 15) + 'px';
                        indicator.style.top = (y - 15) + 'px';
                        indicator.style.width = '30px';
                        indicator.style.height = '30px';
                        indicator.style.border = '3px solid red';
                        indicator.style.borderRadius = '50%';
                        indicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                        indicator.style.zIndex = '999999';
                        indicator.style.pointerEvents = 'none';
                        indicator.style.boxShadow = '0 0 15px rgba(255, 0, 0, 1)';
                        indicator.textContent = 'UBAH';
                        indicator.style.color = 'white';
                        indicator.style.fontSize = '10px';
                        indicator.style.display = 'flex';
                        indicator.style.alignItems = 'center';
                        indicator.style.justifyContent = 'center';
                        indicator.style.fontWeight = 'bold';
                        document.body.appendChild(indicator);

                        setTimeout(() => {
                            if (indicator.parentNode) {
                                indicator.parentNode.removeChild(indicator);
                            }
                        }, 2000);
                    }, coord.x, coord.y, coord.name);

                    await page.mouse.click(coord.x, coord.y);
                    console.log(`✅ 🖱️ UBAH CLICKED at (${coord.x}, ${coord.y}) - ${coord.name}`);

                    // Take screenshot after each click
                    await page.screenshot({ path: `debug-after-ubah-${coord.name.toLowerCase()}.png`, fullPage: true });
                    console.log(`📸 Screenshot: debug-after-ubah-${coord.name.toLowerCase()}.png`);

                    await page.waitForTimeout(3000);
                    currentUrl = page.url();
                    console.log('📍 URL after Ubah click:', currentUrl);

                    if (currentUrl.includes('professional_dashboard')) {
                        console.log('✅ 🎉 SUCCESS! Redirected to professional dashboard!');
                        return true;
                    }
                }
            }

            // Final check
            console.log('\n🔍 FINAL RESULT:');
            currentUrl = page.url();
            console.log('📍 Final URL:', currentUrl);

            if (currentUrl.includes('professional_dashboard')) {
                console.log('✅ 🎉 SUCCESS! Professional dashboard reached!');
                console.log('📍 Dashboard URL:', currentUrl);
                return true;
            } else {
                console.log('❌ Still not in professional dashboard');
                console.log('📍 Current URL:', currentUrl);
                return false;
            }

        } catch (error) {
            console.log('ℹ️ No switch profile popup or failed to switch:', error.message);
            return false;
        }
    }

    /**
      * Select and switch to specific page
      * @param {Page} page - Puppeteer page instance
      * @param {string} pageId - Facebook page ID to select
      * @returns {Promise<boolean>} - true jika berhasil select page
      */
    async selectPage(page, pageId) {
        try {
            console.log(`🎯 Selecting page with ID: ${pageId}`);

            // Wait for account selector to appear
            await page.waitForSelector('[aria-label="Account"], [aria-label="Page"], [data-testid="account-selector"], button[aria-label*="Account"]', { timeout: 10000 });

            // Click to open dropdown with multiple selectors
            let selectorFound = false;
            const selectors = [
                '[aria-label="Account"]',
                '[aria-label="Page"]',
                '[data-testid="account-selector"]',
                'button[aria-label*="Account"]',
                'button[aria-label*="Page"]',
                'button[aria-label*="Akun"]',
                'button[aria-label*="Halaman"]'
            ];

            for (const sel of selectors) {
                try {
                    await page.waitForSelector(sel, { timeout: 2000 });

                    // Add visual indicator before click
                    await page.evaluate((selector) => {
                        const element = document.querySelector(selector);
                        if (element) {
                            const rect = element.getBoundingClientRect();
                            const indicator = document.createElement('div');
                            indicator.style.position = 'absolute';
                            indicator.style.left = (rect.left + rect.width / 2 - 15) + 'px';
                            indicator.style.top = (rect.top + rect.height / 2 - 15) + 'px';
                            indicator.style.width = '30px';
                            indicator.style.height = '30px';
                            indicator.style.border = '3px solid yellow';
                            indicator.style.borderRadius = '50%';
                            indicator.style.backgroundColor = 'rgba(255, 255, 0, 0.5)';
                            indicator.style.zIndex = '999999';
                            indicator.style.pointerEvents = 'none';
                            indicator.textContent = 'SEL';
                            indicator.style.color = 'black';
                            indicator.style.fontSize = '8px';
                            indicator.style.display = 'flex';
                            indicator.style.alignItems = 'center';
                            indicator.style.justifyContent = 'center';
                            indicator.style.fontWeight = 'bold';
                            document.body.appendChild(indicator);
                            setTimeout(() => indicator.remove(), 1500);
                        }
                    }, sel);
                    await page.waitForTimeout(500); // Give time for indicator to show

                    await page.click(sel);
                    selectorFound = true;
                    console.log(`✅ Clicked account selector: ${sel}`);
                    await page.screenshot({ path: `debug-after-selector-click-${sel.replace(/[^a-zA-Z0-9]/g, '_')}.png`, fullPage: true });
                    console.log(`📸 Screenshot: debug-after-selector-click-${sel.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
                    break;
                } catch (e) {
                    console.log(`❌ Selector ${sel} not found, trying next...`);
                }
            }

            if (!selectorFound) {
                console.log('⚠️ Account selector not found, checking if already on correct page...');
                const currentUrl = page.url();
                if (currentUrl.includes(`profile.php?id=${pageId}`) ||
                    currentUrl.includes(`/${pageId}`)) {
                    console.log('✅ Already on the correct page');
                    return true;
                }
                throw new Error('Account selector not found');
            }

            // Wait for dropdown options to load
            await page.waitForTimeout(2000);

            // Find and click the option that matches pageId
            const selected = await page.evaluate((targetPageId) => {
                const options = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], li a[href*="/profile.php?id="], div a[href*="/profile.php?id="], li a[href*="/pages/"], div a[href*="/pages/"]'));

                console.log(`🔍 Found ${options.length} options in dropdown`);

                // Log all options for debugging
                options.forEach((option, index) => {
                    const text = option.textContent?.trim() || '';
                    const href = option.href || option.querySelector('a')?.href || '';
                    console.log(`Option ${index}: "${text}" | href: ${href}`);
                });

                // Try to find matching option
                for (const option of options) {
                    const text = option.textContent?.trim() || '';
                    const href = option.href || option.querySelector('a')?.href || '';

                    console.log(`Checking option: "${text}" | href: ${href}`);

                    if (href.includes(`profile.php?id=${targetPageId}`) ||
                        href.includes(`/${targetPageId}`) ||
                        href.includes(`pages/${targetPageId}`) ||
                        text.includes(targetPageId)) {
                        console.log(`✅ Found matching option, clicking...`);

                        // Add visual indicator before click
                        const rect = option.getBoundingClientRect();
                        const indicator = document.createElement('div');
                        indicator.style.position = 'absolute';
                        indicator.style.left = (rect.left + rect.width / 2 - 15) + 'px';
                        indicator.style.top = (rect.top + rect.height / 2 - 15) + 'px';
                        indicator.style.width = '30px';
                        indicator.style.height = '30px';
                        indicator.style.border = '3px solid purple';
                        indicator.style.borderRadius = '50%';
                        indicator.style.backgroundColor = 'rgba(128, 0, 128, 0.5)';
                        indicator.style.zIndex = '999999';
                        indicator.style.pointerEvents = 'none';
                        indicator.textContent = 'PAGE';
                        indicator.style.color = 'white';
                        indicator.style.fontSize = '8px';
                        indicator.style.display = 'flex';
                        indicator.style.alignItems = 'center';
                        indicator.style.justifyContent = 'center';
                        indicator.style.fontWeight = 'bold';
                        document.body.appendChild(indicator);
                        setTimeout(() => indicator.remove(), 1500);
                        
                        option.click();
                        return { success: true, text: text };
                    }
                }

                return { success: false };
            }, pageId);

            if (selected.success) {
                console.log(`✅ Page selected successfully: ${selected.text}`);
                await page.screenshot({ path: `debug-after-page-option-click-${pageId}.png`, fullPage: true });
                console.log(`📸 Screenshot: debug-after-page-option-click-${pageId}.png`);
                await page.waitForTimeout(3000);

                // Verify selection
                const currentUrl = page.url();
                if (currentUrl.includes(`profile.php?id=${pageId}`) ||
                    currentUrl.includes(`/${pageId}`) ||
                    currentUrl.includes(`pages/${pageId}`)) {
                    console.log('✅ Page selection verified via URL');
                    return true;
                } else {
                    console.log('⚠️ Page selected but URL not updated yet, continuing...');
                    return true;
                }
            } else {
                console.log('❌ Could not select page with ID:', pageId);
                return false;
            }

        } catch (error) {
            console.log('❌ Page selection failed:', error.message);
            return false;
        }
    }

    /**
      * Validate page access and ensure we're on the right page
      * @param {Page} page - Puppeteer page instance
      * @param {string} pageId - Facebook page ID to validate
      * @returns {Promise<boolean>} - true jika page dapat diakses
      */
    async validatePageAccess(page, pageId) {
        try {
            console.log(`🔐 Validating access to page: ${pageId}`);

            const currentUrl = page.url();
            console.log(`📍 Current URL: ${currentUrl}`);

            // Check if already on the correct page
            if (currentUrl.includes(`profile.php?id=${pageId}`) ||
                currentUrl.includes(`/${pageId}`) ||
                currentUrl.includes(`pages/${pageId}`)) {
                console.log('✅ Already on the correct page');
                return true;
            }

            // Try to navigate directly to the page
            console.log(`🚀 Navigating directly to page: ${pageId}`);
            await page.goto(`https://www.facebook.com/profile.php?id=${pageId}`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Wait for page to load
            await page.waitForTimeout(3000);

            const newUrl = page.url();
            console.log(`📍 New URL after navigation: ${newUrl}`);

            if (newUrl.includes(`profile.php?id=${pageId}`) ||
                newUrl.includes(`/${pageId}`)) {
                console.log('✅ Page access validated successfully');
                return true;
            } else {
                console.log('❌ Page access validation failed - wrong URL');
                return false;
            }

        } catch (error) {
            console.log('❌ Page access validation error:', error.message);
            return false;
        }
    }
    /**
     * Upload video sebagai Reel menggunakan automation element langsung
     * Parameter uploadData harus berisi:
     * - cookie: string cookie Facebook
     * - pageId: ID halaman Facebook
     * - videoPath: path ke file video
     * - caption: caption untuk video (opsional)
     */
    async uploadAsReel(uploadData) {
        try {
            // Validate required parameters
            if (!uploadData) {
                throw new Error('uploadData is required');
            }
            if (!uploadData.cookie) {
                throw new Error('cookie is required in uploadData');
            }
            if (!uploadData.pageId) {
                throw new Error('pageId is required in uploadData');
            }
            if (!uploadData.videoPath) {
                throw new Error('videoPath is required in uploadData');
            }

            await this.initialize();

            const page = await this.browser.newPage();

            // Set user agent
            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );

            // Set cookies
            await this.setCookies(page, uploadData.cookie);

            // Navigate to profile page first
            console.log(`Navigating to profile page: https://www.facebook.com/profile.php?id=${uploadData.pageId}`);
            await page.goto(`https://www.facebook.com/profile.php?id=${uploadData.pageId}`, { waitUntil: 'networkidle2' });

            // Wait for profile page to load
            await page.waitForTimeout(3000);

            // Check if profile loaded successfully
            const isLoggedIn = await this.checkLoginStatus(page);
            if (!isLoggedIn) {
                throw new Error('Authentication failed - profile page not accessible');
            }
// Handle switch profile popup if present
console.log('Checking for switch profile popup...');
const switchSuccess = await this.handleSwitchProfilePopup(page, uploadData.pageId);
if (switchSuccess) {
    console.log('✅ Successfully switched to professional dashboard');
} else {
    console.log('❌ Failed to switch to professional dashboard');
}


            // Navigate to reels create
            console.log('Navigating to Facebook Reels create page...');
            await page.goto('https://www.facebook.com/reels/create', { waitUntil: 'networkidle2' });

            // Wait for page to load
            
// Step 0: Select page if pageId is provided
console.log('Selecting page for upload...');
try {
    // Wait for account selector
    await page.waitForSelector('[aria-label="Account"], [aria-label="Page"], [data-testid="account-selector"], button[aria-label*="Account"]', { timeout: 10000 });

    // Click to open dropdown
    let selectorFound = false;
    const selectors = [
        '[aria-label="Account"]',
        '[aria-label="Page"]',
        '[data-testid="account-selector"]',
        'button[aria-label*="Account"]',
        'button[aria-label*="Page"]'
    ];

    for (const sel of selectors) {
        try {
            await page.waitForSelector(sel, { timeout: 2000 });

            // Add visual indicator before click
            await page.evaluate((selector) => {
                const element = document.querySelector(selector);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const indicator = document.createElement('div');
                    indicator.style.position = 'absolute';
                    indicator.style.left = (rect.left + rect.width / 2 - 15) + 'px';
                    indicator.style.top = (rect.top + rect.height / 2 - 15) + 'px';
                    indicator.style.width = '30px';
                    indicator.style.height = '30px';
                    indicator.style.border = '3px solid yellow';
                    indicator.style.borderRadius = '50%';
                    indicator.style.backgroundColor = 'rgba(255, 255, 0, 0.5)';
                    indicator.style.zIndex = '999999';
                    indicator.style.pointerEvents = 'none';
                    indicator.textContent = 'SEL';
                    indicator.style.color = 'black';
                    indicator.style.fontSize = '8px';
                    indicator.style.display = 'flex';
                    indicator.style.alignItems = 'center';
                    indicator.style.justifyContent = 'center';
                    indicator.style.fontWeight = 'bold';
                    document.body.appendChild(indicator);
                    setTimeout(() => indicator.remove(), 1500);
                }
            }, sel);
            await page.waitForTimeout(500); // Give time for indicator to show

            await page.click(sel);
            selectorFound = true;
            console.log(`✅ Clicked account selector: ${sel}`);
            await page.screenshot({ path: `debug-reel-selector-click-${sel.replace(/[^a-zA-Z0-9]/g, '_')}.png`, fullPage: true });
            console.log(`📸 Screenshot: debug-reel-selector-click-${sel.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
            break;
        } catch (e) {
            // Continue
        }
    }

    if (!selectorFound) {
        throw new Error('Account selector not found');
    }

    // Wait for dropdown options
    await page.waitForTimeout(2000);

    // Find and click the option that matches pageId
    const selected = await page.evaluate((pageId) => {
        const options = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], li a[href*="/profile.php?id="], div a[href*="/profile.php?id="]'));

        console.log(`Found ${options.length} options`);

        for (const option of options) {
            const text = option.textContent || '';
            const href = option.href || option.querySelector('a')?.href || '';

            console.log(`Option: ${text} | href: ${href}`);

            if (href.includes(`profile.php?id=${pageId}`) || text.includes(pageId)) {
                // Add visual indicator before click
                const rect = option.getBoundingClientRect();
                const indicator = document.createElement('div');
                indicator.style.position = 'absolute';
                indicator.style.left = (rect.left + rect.width / 2 - 15) + 'px';
                indicator.style.top = (rect.top + rect.height / 2 - 15) + 'px';
                indicator.style.width = '30px';
                indicator.style.height = '30px';
                indicator.style.border = '3px solid purple';
                indicator.style.borderRadius = '50%';
                indicator.style.backgroundColor = 'rgba(128, 0, 128, 0.5)';
                indicator.style.zIndex = '999999';
                indicator.style.pointerEvents = 'none';
                indicator.textContent = 'PAGE';
                indicator.style.color = 'white';
                indicator.style.fontSize = '8px';
                indicator.style.display = 'flex';
                indicator.style.alignItems = 'center';
                indicator.style.justifyContent = 'center';
                indicator.style.fontWeight = 'bold';
                document.body.appendChild(indicator);
                setTimeout(() => indicator.remove(), 1500);

                option.click();
                return { success: true, text: text };
            }
        }

        return { success: false };
    }, uploadData.pageId);

    if (selected.success) {
        console.log(`✅ Page selected successfully: ${selected.text}`);
        await page.screenshot({ path: `debug-reel-page-option-click-${uploadData.pageId}.png`, fullPage: true });
        console.log(`📸 Screenshot: debug-reel-page-option-click-${uploadData.pageId}.png`);
        await page.waitForTimeout(3000);
    } else {
        throw new Error(`Could not select page with ID: ${uploadData.pageId}`);
    }

    console.log('Page selected successfully');
    await page.waitForTimeout(3000);

} catch (error) {
    console.log('Page selection failed or not needed:', error.message);
    // Continue without selection
}


            // Step 1: Upload video file
            console.log('Uploading video file...');
            const fileInputSelectors = [
                'input[type="file"]',
                '[data-testid="video-file-input"]',
                '[data-testid="video-upload-area"]',
                '.upload-area input[type="file"]'
            ];

            let fileInput = null;
            for (const selector of fileInputSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                    fileInput = await page.$(selector);
                    if (fileInput) {
                        console.log(`Found file input: ${selector}`);
                        break;
                    }
                } catch (error) {
                    // Continue trying other selectors
                }
            }

            if (!fileInput) {
                throw new Error('Video file input not found');
            }

            // Upload file
            const videoPath = path.resolve(uploadData.videoPath);
            if (!fs.existsSync(videoPath)) {
                throw new Error(`Video file not found: ${videoPath}`);
            }

            await fileInput.uploadFile(videoPath);
            console.log('Video file uploaded successfully');
            await page.screenshot({ path: 'debug-reel-after-video-upload.png', fullPage: true });
            console.log('📸 Screenshot: debug-reel-after-video-upload.png');

            // Wait for upload to process
            

            
            
            

            // Step 2: Click first next button at (228, 903)
            console.log('🎯 Adding visual indicator for FIRST NEXT at (228, 903)...');
            await page.evaluate(() => {
                const indicator = document.createElement('div');
                indicator.id = 'first-next-indicator';
                indicator.style.position = 'fixed';
                indicator.style.left = '208px';
                indicator.style.top = '818px';
                indicator.style.width = '40px';
                indicator.style.height = '40px';
                indicator.style.border = '3px solid blue';
                indicator.style.borderRadius = '50%';
                indicator.style.backgroundColor = 'rgba(0, 0, 255, 0.7)';
                indicator.style.zIndex = '999999';
                indicator.style.pointerEvents = 'none';
                indicator.style.boxShadow = '0 0 15px rgba(0, 0, 255, 0.9)';
                indicator.textContent = 'NEXT';
                indicator.style.color = 'white';
                indicator.style.fontSize = '10px';
                indicator.style.display = 'flex';
                indicator.style.alignItems = 'center';
                indicator.style.justifyContent = 'center';
                indicator.style.fontWeight = 'bold';
                document.body.appendChild(indicator);

                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }
                }, 2000);
            });

            console.log('🎯 Clicking first next at (228, 903)');
            await page.mouse.click(228, 903);
            await page.screenshot({ path: 'debug-reel-after-first-next-click.png', fullPage: true });
            console.log('📸 Screenshot: debug-reel-after-first-next-click.png');
            await page.waitForTimeout(3000);

            
            
            
            

            // Input caption
            const captionInput = await page.$('[contenteditable="true"]');
            if (captionInput) {
                // Add visual indicator before click
                await page.evaluate(() => {
                    const element = document.querySelector('[contenteditable="true"]');
                    if (element) {
                        const rect = element.getBoundingClientRect();
                        const indicator = document.createElement('div');
                        indicator.style.position = 'absolute';
                        indicator.style.left = (rect.left + rect.width / 2 - 15) + 'px';
                        indicator.style.top = (rect.top + rect.height / 2 - 15) + 'px';
                        indicator.style.width = '30px';
                        indicator.style.height = '30px';
                        indicator.style.border = '3px solid green';
                        indicator.style.borderRadius = '50%';
                        indicator.style.backgroundColor = 'rgba(0, 128, 0, 0.5)';
                        indicator.style.zIndex = '999999';
                        indicator.style.pointerEvents = 'none';
                        indicator.textContent = 'CAP';
                        indicator.style.color = 'white';
                        indicator.style.fontSize = '8px';
                        indicator.style.display = 'flex';
                        indicator.style.alignItems = 'center';
                        indicator.style.justifyContent = 'center';
                        indicator.style.fontWeight = 'bold';
                        document.body.appendChild(indicator);
                        setTimeout(() => indicator.remove(), 1500);
                    }
                });
                await page.waitForTimeout(500); // Give time for indicator to show

                await captionInput.click({ clickCount: 3 });
                await captionInput.type(uploadData.caption || 'Test posting coordinate (700, 615)');
                console.log('✅ Caption inputted');
                await page.screenshot({ path: 'debug-reel-after-caption-input-click.png', fullPage: true });
                console.log('📸 Screenshot: debug-reel-after-caption-input-click.png');
            }

            // Click second next
            console.log('🎯 Adding visual indicator for SECOND NEXT at (300, 903)...');
            await page.evaluate(() => {
                const indicator = document.createElement('div');
                indicator.id = 'second-next-indicator';
                indicator.style.position = 'fixed';
                indicator.style.left = '280px';
                indicator.style.top = '818px';
                indicator.style.width = '40px';
                indicator.style.height = '40px';
                indicator.style.border = '3px solid orange';
                indicator.style.borderRadius = '50%';
                indicator.style.backgroundColor = 'rgba(255, 165, 0, 0.7)';
                indicator.style.zIndex = '999999';
                indicator.style.pointerEvents = 'none';
                indicator.style.boxShadow = '0 0 15px rgba(255, 165, 0, 0.9)';
                indicator.textContent = 'NEXT2';
                indicator.style.color = 'white';
                indicator.style.fontSize = '9px';
                indicator.style.display = 'flex';
                indicator.style.alignItems = 'center';
                indicator.style.justifyContent = 'center';
                indicator.style.fontWeight = 'bold';
                document.body.appendChild(indicator);

                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }
                }, 2000);
            });

            console.log('🎯 Clicking second next at (300, 903)');
            await page.mouse.click(300, 903);
            await page.screenshot({ path: 'debug-reel-after-second-next-click.png', fullPage: true });
            console.log('📸 Screenshot: debug-reel-after-second-next-click.png');
            await page.waitForTimeout(10000);

            // Take screenshot before posting
            await page.screenshot({ path: 'debug-700-615-before.png', fullPage: true });
            console.log('📸 Screenshot before posting: debug-700-615-before.png');

            // Click posting button
            console.log('🎯 Adding visual indicator for POSTING BUTTON at (650, 830)...');
            await page.evaluate(() => {
                const indicator = document.createElement('div');
                indicator.id = 'posting-indicator';
                indicator.style.position = 'fixed';
                indicator.style.left = '620px';
                indicator.style.top = '810px';
                indicator.style.width = '60px';
                indicator.style.height = '60px';
                indicator.style.border = '5px solid #FF0000';
                indicator.style.borderRadius = '50%';
                indicator.style.backgroundColor = 'rgba(255, 0, 0, 0.9)';
                indicator.style.zIndex = '999999';
                indicator.style.pointerEvents = 'none';
                indicator.style.boxShadow = '0 0 30px rgba(255, 0, 0, 1), 0 0 60px rgba(255, 0, 0, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.3)';
                indicator.textContent = 'POSTING';
                indicator.style.color = 'white';
                indicator.style.fontSize = '12px';
                indicator.style.display = 'flex';
                indicator.style.alignItems = 'center';
                indicator.style.justifyContent = 'center';
                indicator.style.fontWeight = 'bold';
                indicator.style.textShadow = '1px 1px 2px black';
                document.body.appendChild(indicator);

                // Add pulsating animation
                let scale = 1;
                const pulse = setInterval(() => {
                    scale = scale === 1 ? 1.1 : 1;
                    indicator.style.transform = `scale(${scale})`;
                }, 200);

                setTimeout(() => {
                    clearInterval(pulse);
                    if (indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }
                }, 3000);
            });

            console.log('🎯 Clicking posting button at (650, 840)');
            await page.mouse.click(650, 840);
            console.log('✅ Posting button clicked at (650, 840)');

            // Take screenshot after posting button click
            await page.screenshot({ path: 'debug-700-615-after-posting-click.png', fullPage: true });
            console.log('📸 Screenshot after posting button click: debug-700-615-after-posting-click.png');

            // Wait for success message after posting
            console.log('Menunggu pesan sukses...');
            let successMessage = { found: false };
            let attempts = 2;
            const maxAttempts = 20; // 30 detik total (15 x 2 detik)

            while (!successMessage.found && attempts < maxAttempts) {
                successMessage = await page.evaluate(() => {
                    const allText = document.body.textContent || '';
                    const successTexts = [
                        'Reel Anda sedang diproses',
                        'Kami akan memberi tahu Anda',
                        'reel siap dilihat',
                        'Your reel is being processed',
                        'We will let you know'
                    ];

                    for (const text of successTexts) {
                        if (allText.includes(text)) {
                            return { found: true, message: text };
                        }
                    }

                    return { found: false };
                });

                if (!successMessage.found) {
                    await page.waitForTimeout(2000);
                    attempts++;
                    
                }
            }

            

            if (successMessage.found) {
                
                
                

                const uploadUrl = page ? page.url() : 'unknown';
                await this.cleanup();
                return {
                    success: true,
                    url: uploadUrl,
                    message: successMessage.message
                };
            } else {
                
                

                const uploadUrl = page ? page.url() : 'unknown';
                await this.cleanup();
                return {
                    success: false,
                    error: 'Success message not found'
                };
            }
            
            
            

            // Wait for result
            await page.waitForTimeout(5000);
            

            
            
            
            

            // Wait for result
            

            // Take screenshot before posting
            
            


        } catch (error) {
            console.error('Error uploading as reel:', error);
            const uploadUrl = page ? page.url() : 'unknown';
                await this.cleanup();
// Step 0: Select page if pageId is provided for post
console.log('Selecting page for post upload...');
try {
    // Wait for account selector
    await page.waitForSelector('[aria-label="Account"], [aria-label="Page"], [data-testid="account-selector"], button[aria-label*="Account"]', { timeout: 10000 });

    // Click to open dropdown
    let selectorFound = false;
    const selectors = [
        '[aria-label="Account"]',
        '[aria-label="Page"]',
        '[data-testid="account-selector"]',
        'button[aria-label*="Account"]',
        'button[aria-label*="Page"]'
    ];

    for (const sel of selectors) {
        try {
            await page.waitForSelector(sel, { timeout: 2000 });
            await page.click(sel);
            selectorFound = true;
            console.log(`Clicked account selector: ${sel}`);
            break;
        } catch (e) {
            // Continue
        }
    }

    if (!selectorFound) {
        throw new Error('Account selector not found');
    }

    // Wait for dropdown options
    await page.waitForTimeout(2000);

    // Find and click the option that matches pageId
    const selected = await page.evaluate((pageId) => {
        const options = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], li a[href*="/profile.php?id="], div a[href*="/profile.php?id="]'));

        console.log(`Found ${options.length} options`);

        for (const option of options) {
            const text = option.textContent || '';
            const href = option.href || option.querySelector('a')?.href || '';

            console.log(`Option: ${text} | href: ${href}`);

            if (href.includes(`profile.php?id=${pageId}`) || text.includes(pageId)) {
                option.click();
                return true;
            }
        }

        return false;
    }, uploadData.pageId);

    if (!selected) {
        throw new Error(`Could not select page with ID: ${uploadData.pageId}`);
    }

    console.log('Page selected successfully');
    await page.waitForTimeout(3000);

} catch (error) {
    console.log('Page selection failed or not needed for post:', error.message);
    // Continue without selection
}

            return {
                success: false,
                error: `Reel upload failed: ${error.message}`
            };
        }
    }

    /**
     * Upload video sebagai Post menggunakan automation element langsung
     * Parameter uploadData harus berisi:
     * - cookie: string cookie Facebook
     * - pageId: ID halaman Facebook
     * - videoPath: path ke file video
     * - caption: caption untuk video (opsional)
     */
    async uploadAsPost(uploadData) {
        let page = null;
        try {
            // Validate required parameters
            if (!uploadData) {
                throw new Error('uploadData is required');
            }
            if (!uploadData.cookie) {
                throw new Error('cookie is required in uploadData');
            }
            if (!uploadData.pageId) {
                throw new Error('pageId is required in uploadData');
            }

            if (!uploadData.videoPath) {
                throw new Error('videoPath is required in uploadData');
            }

            await this.initialize();

            page = await this.browser.newPage();

            // Set user agent
            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );

            // Set cookies
            await this.setCookies(page, uploadData.cookie);

            // Navigate ke profile page
            console.log(`Navigating to profile page: https://www.facebook.com/profile.php?id=${uploadData.pageId}`);
            await page.goto(`https://www.facebook.com/profile.php?id=${uploadData.pageId}`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Wait for profile page to load
            await page.waitForTimeout(3000);

            // Check if profile loaded successfully
            const isLoggedIn = await this.checkLoginStatus(page);
            if (!isLoggedIn) {
                throw new Error('Authentication failed - profile page not accessible');
            }

// Handle switch profile popup if present
console.log('Checking for switch profile popup...');
const switchSuccess = await this.handleSwitchProfilePopup(page, uploadData.pageId);
if (switchSuccess) {
    console.log('✅ Successfully switched to professional dashboard');
} else {
    console.log('❌ Failed to switch to professional dashboard');
}

            // Navigate ke main Facebook
            console.log('Navigating to Facebook main page...');
            await page.goto('https://www.facebook.com/', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Wait for page to load
            

            // Step 1: Find and click the "What's on your mind?" or photo/video upload area
            console.log('Looking for post creation area...');
            const postCreationSelectors = [
                '[data-testid="status-attachment-photo"]',
                '[data-testid="status-attachment-video"]',
                '[aria-label="Photo/Video"]',
                '[aria-label="Foto/Video"]',
                'input[type="file"]',
                '.post-creation-area'
            ];

            let postArea = null;
            for (const selector of postCreationSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                    postArea = await page.$(selector);
                    if (postArea) {
                        console.log(`Found post creation area: ${selector}`);
                        
                        // Add visual indicator before click
                        await page.evaluate((sel) => {
                            const element = document.querySelector(sel);
                            if (element) {
                                const rect = element.getBoundingClientRect();
                                const indicator = document.createElement('div');
                                indicator.style.position = 'absolute';
                                indicator.style.left = (rect.left + rect.width / 2 - 15) + 'px';
                                indicator.style.top = (rect.top + rect.height / 2 - 15) + 'px';
                                indicator.style.width = '30px';
                                indicator.style.height = '30px';
                                indicator.style.border = '3px solid cyan';
                                indicator.style.borderRadius = '50%';
                                indicator.style.backgroundColor = 'rgba(0, 255, 255, 0.5)';
                                indicator.style.zIndex = '999999';
                                indicator.style.pointerEvents = 'none';
                                indicator.textContent = 'POST';
                                indicator.style.color = 'black';
                                indicator.style.fontSize = '8px';
                                indicator.style.display = 'flex';
                                indicator.style.alignItems = 'center';
                                indicator.style.justifyContent = 'center';
                                indicator.style.fontWeight = 'bold';
                                document.body.appendChild(indicator);
                                setTimeout(() => indicator.remove(), 1500);
                            }
                        }, selector);
                        await page.waitForTimeout(500); // Give time for indicator to show

                        await postArea.click();
                        console.log(`✅ Clicked post creation area: ${selector}`);
                        await page.screenshot({ path: `debug-post-creation-click-${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png`, fullPage: true });
                        console.log(`📸 Screenshot: debug-post-creation-click-${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
                        break;
                    }
                } catch (error) {
                    // Continue trying other selectors
                }
            }

            if (!postArea) {
                // Fallback: look for any clickable element that might open file upload
                console.log('Post area not found, trying fallback...');
                const fallbackClicked = await page.evaluate(() => {
                    const elements = Array.from(document.querySelectorAll('[role="button"], button, div[tabindex]'));
                    const uploadBtn = elements.find(el =>
                        el.textContent?.includes('Photo') ||
                        el.textContent?.includes('Video') ||
                        el.textContent?.includes('Foto') ||
                        el.getAttribute('aria-label')?.includes('Photo') ||
                        el.getAttribute('aria-label')?.includes('Video')
                    );
                    if (uploadBtn) {
                        const rect = uploadBtn.getBoundingClientRect();
                        const indicator = document.createElement('div');
                        indicator.style.position = 'absolute';
                        indicator.style.left = (rect.left + rect.width / 2 - 15) + 'px';
                        indicator.style.top = (rect.top + rect.height / 2 - 15) + 'px';
                        indicator.style.width = '30px';
                        indicator.style.height = '30px';
                        indicator.style.border = '3px solid cyan';
                        indicator.style.borderRadius = '50%';
                        indicator.style.backgroundColor = 'rgba(0, 255, 255, 0.5)';
                        indicator.style.zIndex = '999999';
                        indicator.style.pointerEvents = 'none';
                        indicator.textContent = 'FALL';
                        indicator.style.color = 'black';
                        indicator.style.fontSize = '8px';
                        indicator.style.display = 'flex';
                        indicator.style.alignItems = 'center';
                        indicator.style.justifyContent = 'center';
                        indicator.style.fontWeight = 'bold';
                        document.body.appendChild(indicator);
                        setTimeout(() => indicator.remove(), 1500);

                        uploadBtn.click();
                        return true;
                    }
                    return false;
                });
                if (fallbackClicked) {
                    console.log('✅ Clicked fallback post creation button.');
                    await page.waitForTimeout(500); // Give time for indicator to show
                    await page.screenshot({ path: 'debug-post-creation-fallback-click.png', fullPage: true });
                    console.log('📸 Screenshot: debug-post-creation-fallback-click.png');
                } else {
                    throw new Error('Post creation area not found');
                }
                await page.waitForTimeout(2000);
            }

            // Step 2: Upload video file
            console.log('Uploading video file...');

            // Clean start
            await page.evaluateOnNewDocument(() => {
                console.log('Starting clean...');
            });

            const fileInputSelectors = [
                'input[type="file"]',
                '[data-testid="video-file-input"]',
                '[data-testid="photo-file-input"]',
                '.upload-input'
            ];

            let fileInput = null;
            for (const selector of fileInputSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                    fileInput = await page.$(selector);
                    if (fileInput) {
                        console.log(`Found file input: ${selector}`);
                        break;
                    }
                } catch (error) {
                    // Continue trying other selectors
                }
            }

            if (!fileInput) {
                throw new Error('Video file input not found');
            }

            // Upload file
            const videoPath = path.resolve(uploadData.videoPath);
            if (!fs.existsSync(videoPath)) {
                throw new Error(`Video file not found: ${videoPath}`);
            }

            await fileInput.uploadFile(videoPath);
            console.log('Video file uploaded successfully');
            await page.screenshot({ path: 'debug-post-after-video-upload.png', fullPage: true });
            console.log('📸 Screenshot: debug-post-after-video-upload.png');

            // Step 3: Wait for upload processing, input caption FIRST, then click "Berikutnya" button
            console.log('Waiting for video processing, then inputting caption and clicking "Berikutnya" button...');

            // Wait longer for video upload processing and modal to fully load
            console.log('⏳ Waiting longer for video processing and modal stability...');
            await page.waitForTimeout(8000); // Increased from 3000 to 8000

            // Wait for upload to be ready (look for video thumbnail or processing indicators)
            console.log('🔍 Waiting for video processing to complete...');
            let processingComplete = false;
            let attempts = 0;
            const maxAttempts = 10; // 10 attempts * 2s = 20s max wait

            while (!processingComplete && attempts < maxAttempts) {
                console.log(`🔄 Checking upload status (attempt ${attempts + 1}/${maxAttempts})...`);

                processingComplete = await page.evaluate(() => {
                    // Check for video thumbnail (indicates processing is done)
                    const videoThumbs = document.querySelectorAll('img[src*="video"], video, [data-visualcompletion="media-vc"]');

                    // Check for compose form elements that indicate next step is ready
                    const composeElements = document.querySelectorAll('[contenteditable="true"], [aria-label*="caption"], [aria-label*="deskripsi"]');

                    // Check if buttons are available (indicating modal loaded)
                    const buttons = document.querySelectorAll('button, [role="button"]');
                    const hasNextButtons = Array.from(buttons).some(btn =>
                        btn.textContent?.includes('Berikutnya') ||
                        btn.textContent?.includes('Next') ||
                        btn.textContent?.includes('Lanjutkan') ||
                        btn.getAttribute('aria-label')?.includes('Berikutnya')
                    );

                    console.log(`📊 Processing check: thumbs=${videoThumbs.length}, compose=${composeElements.length}, buttons=${buttons.length}, nextBtn=${hasNextButtons}`);

                    // Consider processing complete if we have video elements AND buttons
                    return videoThumbs.length > 0 && composeElements.length > 0 && hasNextButtons;
                });

                if (!processingComplete) {
                    await page.waitForTimeout(2000);
                    attempts++;
                }
            }

            if (!processingComplete) {
                console.log('⚠️ Video processing check failed, proceeding anyway...');
            } else {
                console.log('✅ Video processing complete, modal ready for caption input');
            }

            // INPUT CAPTION FIRST (before "Berikutnya" button click)
            console.log('Inputting caption BEFORE "Berikutnya" button click...');

            // Wait a bit more for the caption input to fully render
            await page.waitForTimeout(2000);

            // Try to find the caption input field that appears before "Berikutnya"
            // For Facebook posts, the caption input might be available immediately after upload
            let captionInput = await page.$('[contenteditable="true"]');
            let captionFound = false;

            if (captionInput) {
                console.log('Found contenteditable caption input');
                captionFound = true;
            } else {
                // Try other common caption input selectors
                const captionSelectors = [
                    '[aria-label="Apa yang Anda pikirkan?"]',
                    '[aria-label="What\'s on your mind?"]',
                    '[aria-label="Deskripsikan video Anda"]',
                    '[aria-label="Describe your video"]',
                    '[placeholder*="caption"]',
                    '[placeholder*="deskripsi"]'
                ];

                for (const selector of captionSelectors) {
                    try {
                        captionInput = await page.$(selector);
                        if (captionInput) {
                            console.log(`Found caption input with selector: ${selector}`);
                            captionFound = true;
                            break;
                        }
                    } catch (e) {
                        // Continue
                    }
                }
            }

            if (captionFound && captionInput) {
                // Add visual indicator before click
                await page.evaluate(() => {
                    const element = document.querySelector('[contenteditable="true"]');
                    if (element) {
                        const rect = element.getBoundingClientRect();
                        const indicator = document.createElement('div');
                        indicator.style.position = 'absolute';
                        indicator.style.left = (rect.left + rect.width / 2 - 15) + 'px';
                        indicator.style.top = (rect.top + rect.height / 2 - 15) + 'px';
                        indicator.style.width = '30px';
                        indicator.style.height = '30px';
                        indicator.style.border = '3px solid green';
                        indicator.style.borderRadius = '50%';
                        indicator.style.backgroundColor = 'rgba(0, 128, 0, 0.5)';
                        indicator.style.zIndex = '999999';
                        indicator.style.pointerEvents = 'none';
                        indicator.textContent = 'CAP';
                        indicator.style.color = 'white';
                        indicator.style.fontSize = '8px';
                        indicator.style.display = 'flex';
                        indicator.style.alignItems = 'center';
                        indicator.style.justifyContent = 'center';
                        indicator.style.fontWeight = 'bold';
                        document.body.appendChild(indicator);
                        setTimeout(() => indicator.remove(), 1500);
                    }
                });
                await page.waitForTimeout(500); // Give time for indicator to show

                // Click to focus and clear existing content
                await captionInput.click({ clickCount: 1 });
                await page.waitForTimeout(500);

                // Clear any existing content
                await page.keyboard.press('End');
                await page.keyboard.down('Shift');
                await page.keyboard.press('Home');
                await page.keyboard.up('Shift');
                await page.keyboard.press('Backspace');

                // Now input the caption
                await page.keyboard.type(uploadData.caption || 'Uploaded via automation');
                console.log('✅ Caption inputted BEFORE "Berikutnya" button click');
                await page.screenshot({ path: 'debug-post-after-caption-input-click.png', fullPage: true });
                console.log('📸 Screenshot: debug-post-after-caption-input-click.png');

                // Trigger change events
                await page.evaluate(() => {
                    const inputs = document.querySelectorAll('[contenteditable="true"]');
                    inputs.forEach(input => {
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    });
                });
            } else {
                console.log('⚠️ Caption input not found before "Berikutnya", will try after click');
            }

            console.log('Now proceeding to click "Berikutnya" button...');

            console.log('Clicking "Berikutnya" button using element click...');

            // IMPLEMENT ENHANCED NEXT BUTTON CLICKING LOGIC
            let nextBtnElement = null;
            let nextBtnFound = false;
            let nextBtnCoords = null;

            // Try to find and click the "Berikutnya" button directly via element
            try {
                // First try: Look for button with specific text using page.evaluate
                nextBtnFound = await page.evaluate(() => {
                    const allButtons = Array.from(document.querySelectorAll('button, [role="button"], div[role="button"], span[role="button"]'));

                    console.log(`🔍 Found ${allButtons.length} clickable elements for next element click`);

                    // Find button with "Berikutnya" text and click it directly
                    const nextBtn = allButtons.find(btn => {
                        const text = btn.textContent?.trim() || '';
                        const ariaLabel = btn.getAttribute('aria-label') || '';
                        return text.includes('Berikutnya') ||
                               text.includes('Next') ||
                               text.includes('Selanjutnya') ||
                               ariaLabel.includes('Berikutnya') ||
                               ariaLabel.includes('Next');
                    });

                    if (nextBtn) {
                        console.log('✅ Found next button by text:', nextBtn.textContent?.trim());
                        const rect = nextBtn.getBoundingClientRect();
                        const x = rect.left + rect.width / 2;
                        const y = rect.top + rect.height / 2;

                        console.log(`📍 Next button coordinates: (${Math.round(x)}, ${Math.round(y)})`);

                        return { success: true, coords: { x, y } };
                    }

                    return { success: false };
                });

                if (nextBtnFound && nextBtnFound.success) {
                    nextBtnCoords = nextBtnFound.coords;
                    // Add visual indicator before click
                    console.log(`🎯 BERIKUTNYA button found at coordinates: (${Math.round(nextBtnCoords.x)}, ${Math.round(nextBtnCoords.y)})`);

                    console.log('🟥 Adding visual indicator for BERIKUTNYA...');
                    await page.evaluate((x, y) => {
                        const indicator = document.createElement('div');
                        indicator.id = 'berikutnya-indicator';
                        indicator.style.position = 'fixed';
                        indicator.style.left = (x - 25) + 'px';
                        indicator.style.top = (y - 25) + 'px';
                        indicator.style.width = '50px';
                        indicator.style.height = '50px';
                        indicator.style.border = '4px solid red';
                        indicator.style.borderRadius = '50%';
                        indicator.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
                        indicator.style.zIndex = '999999';
                        indicator.style.pointerEvents = 'none';
                        indicator.style.boxShadow = '0 0 20px rgba(255, 0, 0, 1)';
                        indicator.textContent = 'BERIKUTNYA';
                        indicator.style.color = 'white';
                        indicator.style.fontSize = '10px';
                        indicator.style.display = 'flex';
                        indicator.style.alignItems = 'center';
                        indicator.style.justifyContent = 'center';
                        indicator.style.fontWeight = 'bold';
                        document.body.appendChild(indicator);
                        console.log('🔴 BERIKUTNYA indicator added to DOM');

                        // Simple indicator - remove after 5 seconds
                        setTimeout(() => {
                            if (indicator.parentNode) {
                                indicator.parentNode.removeChild(indicator);
                            }
                        }, 5000);
                    }, nextBtnCoords.x, nextBtnCoords.y);

                    // Wait for visual indicator to be visible
                    console.log('📱 Waiting 5 seconds for visual indicator...');
                    await page.waitForTimeout(5000);

                    // Now click the button - this should happen after the visual flash
                    const clickResult = await page.evaluate(() => {
                        const allButtons = Array.from(document.querySelectorAll('button, [role="button"], div[role="button"], span[role="button"]'));

                        // Find the button again and click it
                        const nextBtn = allButtons.find(btn => {
                            const text = btn.textContent?.trim() || '';
                            const ariaLabel = btn.getAttribute('aria-label') || '';
                            return text.includes('Berikutnya') ||
                                   text.includes('Next') ||
                                   text.includes('Selanjutnya') ||
                                   ariaLabel.includes('Berikutnya') ||
                                   ariaLabel.includes('Next');
                        });

                        if (nextBtn) {
                            nextBtn.click();
                            return { clicked: true, text: nextBtn.textContent?.trim() };
                        }

                        return { clicked: false };
                    });

                    if (clickResult.clicked) {
                        console.log(`✅ SUCCESS! Element clicked "Berikutnya" button: "${clickResult.text}"`);
                        await page.screenshot({ path: 'debug-post-after-berikutnya-click.png', fullPage: true });
                        console.log('📸 Screenshot: debug-post-after-berikutnya-click.png');
                        await page.waitForTimeout(2000);
                    } else {
                        console.log('❌ FAILED: Could not click "Berikutnya" button');
                        throw new Error('Could not click the "Berikutnya" button');
                    }

                } else {
                    console.log('❌ Failed to find "Berikutnya" button');
                    throw new Error('Could not find the "Berikutnya" button');
                }

            } catch (error) {
                console.log('❌ Error during "Berikutnya" click:', error.message);
                throw error;
            }

            // CONTINUE TO "Kirim" BUTTON - "Berikutnya" clicked successfully
            console.log('🎯 "BERIKUTNYA" BUTTON FUNCTIONALITY COMPLETE');
            console.log('🔄 Now proceeding to click "KIRIM" (Post/Send) button...');

            // Wait for the "Kirim" button to appear after "Berikutnya" click
            await page.waitForTimeout(3000);

            // Step 4: Click "Kirim" button using enhanced approach
            console.log('Clicking "Kirim" button using element click...');

            // IMPLEMENT ENHANCED "KIRIM" BUTTON CLICKING LOGIC
            let kirimBtnFound = false;
            let kirimBtnCoords = null;

            // Try to find and click the "Kirim" button directly via element
            try {
                // First try: Look for button with specific Post/Send related text
                kirimBtnFound = await page.evaluate(() => {
                    const allButtons = Array.from(document.querySelectorAll('button, [role="button"], div[role="button"], span[role="button"]'));

                    console.log(`🔍 Found ${allButtons.length} clickable elements for Kirim button click`);

                    // Find button with ONLY "Kirim" text (strict exclusion of Bagikan/Share/English)
                    const kirimBtn = allButtons.find(btn => {
                        const text = btn.textContent?.trim() || '';
                        const ariaLabel = btn.getAttribute('aria-label') || '';

                        // STRICT CHECK: Must contain Kirim/Kirimkan AND NOT contain Bagikan/Share/English
                        const hasKirimOnly = (
                            text === 'Kirim' ||
                            text.includes('Kirim') ||
                            text.includes('Kirimkan') ||
                            ariaLabel.includes('Kirim') ||
                            ariaLabel.includes('Kirimkan')
                        ) && !text.includes('Bagikan') &&
                          !text.includes('Share') &&
                          !text.includes('Post') &&
                          !text.includes('Send');

                        return hasKirimOnly;
                    });

                    if (kirimBtn) {
                        console.log('✅ Found Kirim button by text:', kirimBtn.textContent?.trim());
                        const rect = kirimBtn.getBoundingClientRect();
                        const x = rect.left + rect.width / 2;
                        const y = rect.top + rect.height / 2;

                        console.log(`📍 Kirim button coordinates: (${Math.round(x)}, ${Math.round(y)})`);

                        return { success: true, coords: { x, y }, text: kirimBtn.textContent?.trim() };
                    }

                    return { success: false };
                });

                if (kirimBtnFound && kirimBtnFound.success) {
                    kirimBtnCoords = kirimBtnFound.coords;
                    // Add visual indicator for "Kirim" button
                    console.log(`🎯 KIRIM button found at coordinates: (${Math.round(kirimBtnCoords.x)}, ${Math.round(kirimBtnCoords.y)})`);

                    console.log('🟢 Adding visual indicator for KIRIM...');
                    await page.evaluate((x, y) => {
                        const indicator = document.createElement('div');
                        indicator.id = 'kirim-indicator';
                        indicator.style.position = 'fixed';
                        indicator.style.left = (x - 30) + 'px';
                        indicator.style.top = (y - 30) + 'px';
                        indicator.style.width = '60px';
                        indicator.style.height = '60px';
                        indicator.style.border = '4px solid green';
                        indicator.style.borderRadius = '50%';
                        indicator.style.backgroundColor = 'rgba(0, 128, 0, 0.8)';
                        indicator.style.zIndex = '999999';
                        indicator.style.pointerEvents = 'none';
                        indicator.style.boxShadow = '0 0 30px rgba(0, 128, 0, 1)';
                        indicator.textContent = 'KIRIM';
                        indicator.style.color = 'white';
                        indicator.style.fontSize = '12px';
                        indicator.style.display = 'flex';
                        indicator.style.alignItems = 'center';
                        indicator.style.justifyContent = 'center';
                        indicator.style.fontWeight = 'bold';
                        document.body.appendChild(indicator);
                        console.log('🟢 KIRIM indicator added to DOM');

                        // Remove indicator after 3 seconds
                        setTimeout(() => {
                            if (indicator.parentNode) {
                                indicator.parentNode.removeChild(indicator);
                            }
                        }, 3000);
                    }, kirimBtnCoords.x, kirimBtnCoords.y);

                    // Wait for visual indicator to be visible
                    console.log('⏳ Waiting 2 seconds for visual indicator...');
                    await page.waitForTimeout(2000);

                    // Now click the button using element click
                    console.log(`🖱️ Clicking KIRIM button at coordinates (${Math.round(kirimBtnCoords.x)}, ${Math.round(kirimBtnCoords.y)})...`);

                    const clickResult = await page.evaluate(() => {
                        const allButtons = Array.from(document.querySelectorAll('button, [role="button"], div[role="button"], span[role="button"]'));

                        // Find the button again and click it - STRICT EXCLUSION of Bagikan/Share/English
                        const kirimBtn = allButtons.find(btn => {
                            const text = btn.textContent?.trim() || '';
                            const ariaLabel = btn.getAttribute('aria-label') || '';

                            // STRICT: Must have Kirim AND NOT have Bagikan/Share/English words
                            const hasKirimOnly = (text.includes('Kirim') || text.includes('Kirimkan') || ariaLabel.includes('Kirim') || ariaLabel.includes('Kirimkan')) &&
                                               !text.includes('Bagikan') &&
                                               !text.includes('Share') &&
                                               !text.includes('Post') &&
                                               !text.includes('Send');

                            return hasKirimOnly;
                        });

                        if (kirimBtn) {
                            kirimBtn.click();
                            return { clicked: true, text: kirimBtn.textContent?.trim() };
                        }

                        return { clicked: false };
                    });

                    if (clickResult.clicked) {
                        console.log(`✅ SUCCESS! Element clicked "Kirim" button: "${clickResult.text}"`);
                        await page.screenshot({ path: 'debug-post-after-kirim-click.png', fullPage: true });
                        console.log('📸 Screenshot: debug-post-after-kirim-click.png');

                        // GET SUCCESS MESSAGE LIKE REELS - CHECK SHORT TEXT FRAGMENTS
                        let successMessage = { found: false };
                        let attempts = 0;
                        const maxAttempts = 15; // 15 attempts * 2s = 30 seconds total (same as reels)

                        while (!successMessage.found && attempts < maxAttempts) {
                            successMessage = await page.evaluate(() => {
                                const allText = document.body.textContent || '';

                                // POST SUCCESS TEXTS - LIKE REELS BUT FOR POSTS
                                const successTexts = [
                                    'Postingan Anda sedang diproses',
                                    'Kami akan memberi tahu Anda',
                                    'postingan siap untuk dilihat',
                                    'Postingan Anda berhasil',
                                    'Post telah dibagikan'
                                ];

                                for (const text of successTexts) {
                                    if (allText.includes(text)) {
                                        return { found: true, message: text };
                                    }
                                }

                                return { found: false };
                            });

                            if (!successMessage.found) {
                                await page.waitForTimeout(2000);
                                attempts++;
                            }
                        }

                        if (successMessage.found) {
                            console.log('🎉 POST SUCCESS MESSAGE FOUND!');
                            console.log(`📝 Message: "${successMessage.message}"`);

                            const uploadUrl = page ? page.url() : 'unknown';

                            // CLEANUP BROWSER AS SOON AS SUCCESS IS DETECTED
                            console.log('🧹 Cleaning up browser (success detected)...');
                            await this.cleanup();

                            return {
                                success: true,
                                url: uploadUrl,
                                message: successMessage.message
                            };
                        } else {
                            console.log('⚠️ Success message not found within timeout');

                            const uploadUrl = page ? page.url() : 'unknown';

                            // CLEANUP BROWSER ON FAILURE TOO
                            console.log('🧹 Cleaning up browser (failure detected)...');
                            await this.cleanup();

                            return {
                                success: false,
                                error: 'Success message not found'
                            };
                        }

                    } else {
                        console.log('❌ FAILED: Could not click "Kirim" button');
                        throw new Error('Could not click the "Kirim" button');
                    }

                } else {
                    console.log('❌ Failed to find "Kirim" button');
                    throw new Error('Could not find the "Kirim" button');
                }

            } catch (error) {
                console.log('❌ Error during "Kirim" click:', error.message);
                throw error;
            }



        } catch (error) {
            console.error('Error uploading as post:', error);
            const uploadUrl = page ? page.url() : 'unknown';
            await this.cleanup();
            return {
                success: false,
                error: `Video post upload failed: ${error.message}`
            };
        }
    }

    /**
     * Cleanup browser dan pages
     */
    async cleanup(page) {
        try {
            if (page) await page.close();
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
                this.isInitialized = false;
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }

    // ... (methods lainnya tetap sama)

    /**
     * Inisialisasi Puppeteer browser
     */
    async initialize() {
        try {
            if (this.isInitialized && this.browser) {
                return { success: true };
            }

            if (this.browser) {
                await this.close();
            }

            // Log current options for debugging
            console.log('🎯 Initializing FacebookAutomation browser with options:', this.options);
            console.log(`🎭 Headless mode: ${this.options.headless} (showBrowser: ${this.options.showBrowser})`);

            this.browser = await puppeteer.launch({
                headless: this.options.headless,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-blink-features=AutomationControlled',
                    '--window-size=1280,1024',
                    '--start-maximized',
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                ],
                defaultViewport: {
                    width: 1366,
                    height: 1000
                },
                ignoreDefaultArgs: ['--enable-automation'],
                executablePath: this.getChromiumPath(),
                ignoreHTTPSErrors: true,
                timeout: 60000
            });

            console.log('✅ Browser initialized successfully - headless mode:', this.options.headless === false ? 'OFF (visible)' : 'ON (hidden)');
            this.isInitialized = true;
            return {
                success: true,
                message: `Browser berhasil diinisialisasi`
            };
        } catch (error) {
            console.error('Error initializing browser:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get Chromium executable path
     */
    getChromiumPath() {
        const systemChromePaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser'
        ];

        for (const chromePath of systemChromePaths) {
            if (fs.existsSync(chromePath)) {
                console.log(`Using system Chrome: ${chromePath}`);
                return chromePath;
            }
        }

        console.log('Using bundled Chromium (fallback)');
        return undefined;
    }

    /**
     * Set cookies untuk page
     */
    async setCookies(page, cookieString) {
        try {
            const cookies = this.parseCookieString(cookieString);
            if (cookies.length === 0) {
                throw new Error('No valid cookies found');
            }

            for (const cookie of cookies) {
                try {
                    await page.setCookie(cookie);
                } catch (error) {
                    console.warn(`Failed to set cookie ${cookie.name}:`, error.message);
                }
            }
        } catch (error) {
            console.error('Error setting cookies:', error);
            throw error;
        }
    }

    /**
     * Parse cookie string
     */
    parseCookieString(cookieString) {
        try {
            const cookies = [];

            if (cookieString.trim().startsWith('[') && cookieString.trim().endsWith(']')) {
                try {
                    const cookieArray = JSON.parse(cookieString);
                    if (Array.isArray(cookieArray)) {
                        for (const cookieObj of cookieArray) {
                            if (cookieObj.name && cookieObj.value) {
                                cookies.push({
                                    name: cookieObj.name,
                                    value: cookieObj.value,
                                    domain: cookieObj.domain || '.facebook.com',
                                    path: cookieObj.path || '/',
                                    secure: cookieObj.secure || true,
                                    httpOnly: cookieObj.httpOnly || false,
                                    sameSite: cookieObj.sameSite || 'None'
                                });
                            }
                        }
                    }
                } catch (jsonError) {
                    console.log('JSON parsing failed, trying other formats...');
                }
            }

            if (cookies.length === 0) {
                if (cookieString.includes(';')) {
                    const cookiePairs = cookieString.split(';');
                    for (const pair of cookiePairs) {
                        const trimmedPair = pair.trim();
                        if (trimmedPair.includes('=')) {
                            const [name, ...valueParts] = trimmedPair.split('=');
                            if (name && valueParts.length > 0) {
                                const value = valueParts.join('=');
                                cookies.push({
                                    name: name.trim(),
                                    value: decodeURIComponent(value.trim()),
                                    domain: '.facebook.com',
                                    path: '/',
                                    secure: true,
                                    httpOnly: false,
                                    sameSite: 'None'
                                });
                            }
                        }
                    }
                }
            }

            const essentialCookies = ['c_user', 'xs', 'fr', 'datr', 'sb', 'wd', 'cnm', 'i_user', 'ps_l', 'ps_n'];
            const filteredCookies = cookies.filter(cookie =>
                essentialCookies.some(essential =>
                    cookie.name.toLowerCase().includes(essential.toLowerCase())
                )
            );

            console.log(`Parsed ${cookies.length} cookies, filtered to ${filteredCookies.length} essential cookies`);
            return filteredCookies.length > 0 ? filteredCookies : cookies;
        } catch (error) {
            console.error('Error parsing cookie string:', error);
            return [];
        }
    }

    /**
     * Check login status
     */
    async checkLoginStatus(page) {
        try {
            const currentUrl = page.url();
            if (currentUrl.includes('/login/') || currentUrl.includes('/checkpoint/')) {
                return false;
            }

            try {
                await page.waitForSelector('input[name="email"]', { timeout: 3000 });
                return false;
            } catch (error) {
                // Continue
            }

            let successSelectors = [
                '[aria-label="Facebook"]',
                'nav, [role="navigation"]'
            ];

            for (const selector of successSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 3000 });
                    return true;
                } catch (error) {
                    // Continue
                }
            }

            return true;
        } catch (error) {
            console.error('Error checking login status:', error);
            return false;
        }
    }

    /**
     * Check if upload was successful - IMPROVED FOR POSTS
     */
    async checkUploadSuccess(page) {
        try {
            console.log('🔍 Checking upload success...');

            // For POSTS: Look for multiple success indicators
            const successIndicators = await page.evaluate(() => {
                // Check 1: Success messages or close buttons (post was closed/jumped out of modal)
                const closeButtons = document.querySelectorAll('button[aria-label="Close"], [data-testid="popup-close"], svg[aria-label="Close"]');

                // Check 2: New URL (often redirects to profile or feed)
                const currentUrl = window.location.href;
                const urlChanged = !currentUrl.includes('/composer/') && !currentUrl.includes('/reel/create');
                const hasPostId = currentUrl.includes('/posts/') || currentUrl.includes('pfbid');

                // Check 3: Success toast/snackbar messages
                const toastMessages = document.querySelectorAll('[data-testid*="toast"], [role="alert"], .notification-content');
                const hasSuccessToast = Array.from(toastMessages).some(el => {
                    const text = el.textContent?.toLowerCase() || '';
                    return text.includes('posted') || text.includes('shared') || text.includes('uploaded') ||
                           text.includes('diposting') || text.includes('dibagikan') || text.includes('diupload');
                });

                // Check 4: No more compose dialog/modal visible
                const hasComposeDialog = document.querySelectorAll('form[role="dialog"], div[role="dialog"].composer, .composer-modal').length > 0;

                // Check 5: Page title changed back to normal (not "Create Post")
                const title = document.title;
                const titleChanged = !title.toLowerCase().includes('create') && !title.toLowerCase().includes('buat');

                console.log('📊 Success indicators:', {
                    hasCloseButton: closeButtons.length > 0,
                    urlChanged,
                    hasPostId,
                    hasSuccessToast,
                    hasComposeDialog: !hasComposeDialog,
                    titleChanged
                });

                // For POSTS: Consider it successful if at least 2/5 conditions are met
                const successScore = [
                    closeButtons.length > 0,
                    urlChanged || hasPostId,
                    hasSuccessToast,
                    !hasComposeDialog,
                    titleChanged
                ].filter(Boolean).length;

                console.log(`🎯 Success score for POST: ${successScore}/5`);

                // Lower threshold for posts (2/5) vs reels (3/5)
                return successScore >= 2;
            });

            console.log('✅ Upload success detection result:', successIndicators);

            // For REELS: More specific URL pattern check
            const currentUrl = page.url();
            if (currentUrl.includes('/reel/') && !currentUrl.endsWith('/reel/')) {
                console.log('✅ Reel URL detected - success!');
                return true;
            }

            // Return overall result
            return successIndicators;

        } catch (error) {
            console.error('Error checking upload success:', error);
            // In case of error, assume not successful for safety
            return false;
        }
    }

    /**
     * Get Reel URL after successful upload
     */
    async getReelUrl(page) {
        try {
            const currentUrl = page.url();
            if (currentUrl.includes('/reel/') && !currentUrl.endsWith('/reel/')) {
                return currentUrl;
            }
            return currentUrl;
        } catch (error) {
            console.error('Error getting reel URL:', error);
            return page.url();
        }
    }

    /**
     * Get Post URL after successful upload
     */
    async getPostUrl(page) {
        try {
            const currentUrl = page.url();
            if (currentUrl.includes('/posts/')) {
                return currentUrl;
            }
            return currentUrl;
        } catch (error) {
            console.error('Error getting post URL:', error);
            return page.url();
        }
    }

    /**
     * Validasi cookie dan ambil pages
     */
    async validateCookieAndGetPages(cookieData, accountType = 'personal') {
        try {
            await this.initialize();

            const page = await this.browser.newPage();
            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );

            await this.setCookies(page, cookieData);

            await page.goto('https://www.facebook.com/pages/?category=your_pages', {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            const isLoggedIn = await this.checkLoginStatus(page);
            if (!isLoggedIn) {
                const uploadUrl = page ? page.url() : 'unknown';
                await this.cleanup();
                await this.close();
                return {
                    success: false,
                    error: 'Cookie tidak valid atau sudah kedaluwarsa'
                };
            }

            const pagesData = await this.extractPagesData(page);

            const uploadUrl = page ? page.url() : 'unknown';
                await this.cleanup();
            await this.close();

            return {
                success: true,
                pages: pagesData,
                message: `Berhasil mengambil ${pagesData.length} halaman`
            };
        } catch (error) {
            console.error('Error validating cookie:', error);
            return {
                success: false,
                error: `Validasi gagal: ${error.message}`
            };
        }
    }

    /**
     * Extract pages data
     */
    async extractPagesData(page) {
        try {
            await page.waitForSelector('a[href*="/profile.php?id="]', { timeout: 8000 });

            const pagesData = await page.evaluate(() => {
                const pages = [];
                const profileLinks = document.querySelectorAll('a[href*="/profile.php?id="]');

                profileLinks.forEach((link) => {
                    const href = link.href;
                    const profileMatch = href.match(/profile\.php\?id=(\d+)/);
                    if (profileMatch) {
                        const profileId = profileMatch[1];
                        const pageName = link.textContent.trim();

                        if (pageName && pageName.length > 2) {
                            pages.push({
                                id: profileId,
                                name: pageName,
                                url: `https://www.facebook.com/${profileId}`,
                                type: 'profile',
                                profileUrl: href
                            });
                        }
                    }
                });

                return pages.filter((page, index, self) =>
                    index === self.findIndex(p => p.id === page.id)
                );
            });

            console.log(`Found ${pagesData.length} pages`);
            return pagesData;
        } catch (error) {
            console.error('Error extracting pages data:', error);
            return [];
        }
    }

    /**
     * Test connection
     */
    async testConnection(cookieData) {
        try {
            await this.initialize();

            const page = await this.browser.newPage();
            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );

            await this.setCookies(page, cookieData);

            await page.goto('https://www.facebook.com/me', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            const isLoggedIn = await this.checkLoginStatus(page);
            const uploadUrl = page ? page.url() : 'unknown';
                await this.cleanup();
            await this.close();

            return {
                success: isLoggedIn,
                message: isLoggedIn ? 'Koneksi berhasil' : 'Koneksi gagal'
            };
        } catch (error) {
            console.error('Error testing connection:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Close browser
     */
    async close() {
        try {
            if (this.browser) {
                const pages = await this.browser.pages();
                for (const page of pages) {
                    const uploadUrl = page ? page.url() : 'unknown';
                await this.cleanup();
                }
                await this.browser.close();
                this.browser = null;
                this.isInitialized = false;
                console.log('✅ Browser closed successfully');
            }
            return { success: true };
        } catch (error) {
            console.error('Error closing browser:', error);
            this.browser = null;
            this.isInitialized = false;
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = FacebookAutomation;
