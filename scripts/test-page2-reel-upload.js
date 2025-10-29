const FacebookAutomation = require('../src/modules/facebook-automation.js');

async function testPage2ReelUpload() {
    console.log('🎯 Testing Reel Upload for Page 2 (GoyangGo)');
    console.log('Alur: Profil -> Switch Popup -> Dashboard -> Reels Create -> Upload');
    console.log('=' .repeat(60));

    const automation = new FacebookAutomation();

    const uploadData = {
        cookie: '[{"domain":".facebook.com","expirationDate":1795163428.531776,"hostOnly":false,"httpOnly":true,"name":"sb","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaIJWm8hr_IHzgvIgaq6y"},{"domain":".facebook.com","expirationDate":1795163341.643106,"hostOnly":false,"httpOnly":true,"name":"datr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaLRagBmweA2C4FRuLUe3"},{"domain":".facebook.com","expirationDate":1792807164.444735,"hostOnly":false,"httpOnly":false,"name":"c_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"100003912046246"},{"domain":".facebook.com","expirationDate":1792139451.995713,"hostOnly":false,"httpOnly":false,"name":"i_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"61579915261071"},{"domain":".facebook.com","expirationDate":1795163454.827026,"hostOnly":false,"httpOnly":true,"name":"ps_l","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1795163454.827201,"hostOnly":false,"httpOnly":true,"name":"ps_n","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1761877012,"hostOnly":false,"httpOnly":false,"name":"wd","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1718x1270"},{"domain":".facebook.com","expirationDate":1769047164.444835,"hostOnly":false,"httpOnly":true,"name":"fr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1g4V8qQgsdt1TDXir.AWd4ySb-AWJC_ua-09UJsdUgiLYpkhHpyyo0kdN1uZGgUjeWR-E.Bo-t18..AAA.0.0.Bo-t18.AWdbibHtNe4qfTG_Si_pLW4RUtg"},{"domain":".facebook.com","expirationDate":1792807164.444881,"hostOnly":false,"httpOnly":true,"name":"xs","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"33%3A1e_0HMbiYCiQVg%3A2%3A1760603427%3A-1%3A-1%3A%3AAcW8ZB0-1AjHWswnbdPBJR8w2DTr0CP0IUaHwg72gg"}]',
        pageId: '100087263454995', // Page 2 ID
        videoPath: 'D:\\apaya\\_马来西亚 _甜系女孩 好久没跳舞了 来动一动.mp4',
        caption: 'Test upload reel untuk Halaman 2'
    };

    try {
        await automation.initialize();
        const page = await automation.browser.newPage();
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
        await automation.setCookies(page, uploadData.cookie);

        // Step 1: Navigate to profile page
        console.log(`\n📍 Step 1: Navigating to profile page: https://www.facebook.com/profile.php?id=${uploadData.pageId}`);
        await page.goto(`https://www.facebook.com/profile.php?id=${uploadData.pageId}`, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);

        // Check login
        const isLoggedIn = await automation.checkLoginStatus(page);
        if (!isLoggedIn) {
            throw new Error('Authentication failed - profile page not accessible');
        }
        console.log('✅ Profile page loaded successfully');

        // Step 2: Click the switch button (from first image)
        console.log('\n🔄 Step 2: Clicking switch button for GoyangGo page...');
        try {
            // Wait for the switch button to appear (from sidebar)
            await page.waitForSelector('[aria-label*="Beralih ke Halaman GoyangGo"], [data-testid="page-switch-button"], button:has-text("Beralih ke Halaman GoyangGo")', { timeout: 10000 });

            // Try to find and click the switch button
            let buttonClicked = false;

            // Method 1: Direct selector
            const switchSelectors = [
                '[aria-label*="Beralih ke Halaman GoyangGo"]',
                '[data-testid="page-switch-button"]',
                'button:has-text("Beralih ke Halaman GoyangGo")',
                'button:has-text("Beralih")',
                'a[href*="/professional_dashboard"]',
                'button[class*="switch" i]',
                // Additional selectors based on image
                'div[role="button"]:has-text("Beralih ke Halaman GoyangGo")',
                'span:has-text("Beralih ke Halaman GoyangGo")',
                'button[aria-label*="Switch to"]',
                'div[class*="switch" i] button',
                'div[class*="page" i] button:has-text("Beralih")'
            ];

            for (const selector of switchSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 2000 });
                    await page.click(selector);
                    buttonClicked = true;
                    console.log(`✅ Clicked switch button using selector: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`❌ Selector ${selector} not found, trying next...`);
                }
            }

            // Method 2: Fallback to mouse click at approximate position (from image, around sidebar area)
            if (!buttonClicked) {
                console.log('🎯 Using mouse click fallback for switch button...');

                // Try multiple coordinates based on typical sidebar positions
                const coordinates = [
                    { x: 200, y: 500 }, // Left sidebar area
                    { x: 150, y: 400 },
                    { x: 250, y: 450 },
                    { x: 180, y: 550 },
                    { x: 220, y: 480 }
                ];

                for (const coord of coordinates) {
                    try {
                        await page.mouse.click(coord.x, coord.y);
                        console.log(`✅ Clicked at coordinate (${coord.x}, ${coord.y})`);
                        buttonClicked = true;
                        break;
                    } catch (error) {
                        console.log(`❌ Failed to click at (${coord.x}, ${coord.y}):`, error.message);
                    }
                }

                if (!buttonClicked) {
                    console.log('⚠️ All coordinate clicks failed, but continuing...');
                    buttonClicked = true; // Continue anyway
                }
            }

            await page.waitForTimeout(2000);

        } catch (error) {
            console.log('⚠️ Switch button not found or failed to click:', error.message);
        }

        // Step 3: Handle switch profile popup if present
        console.log('\n🔄 Step 3: Handling switch profile popup...');
        const popupHandled = await automation.handleSwitchProfilePopup(page);

        if (popupHandled) {
            console.log('✅ Switch profile popup handled successfully');
        } else {
            console.log('ℹ️ No popup appeared or already in dashboard');
        }

        // Step 4: Navigate directly to professional dashboard if needed, then to reels
        console.log('\n🔍 Step 4: Checking if we need to go to professional dashboard...');
        const currentUrl = page.url();
        console.log('📍 Current URL:', currentUrl);

        // If not in dashboard, try to navigate to it
        if (!currentUrl.includes('professional_dashboard')) {
            console.log('🚀 Navigating to professional dashboard...');
            await page.goto('https://www.facebook.com/professional_dashboard/overview/', { waitUntil: 'networkidle2' });
            await page.waitForTimeout(3000);

            const newUrl = page.url();
            if (newUrl.includes('professional_dashboard')) {
                console.log('✅ Successfully in professional dashboard');
            } else {
                console.log('⚠️ Still not in dashboard, continuing anyway...');
            }
        } else {
            console.log('✅ Already in professional dashboard');
        }

        // Step 5: Navigate to reels create page
        console.log('\n📍 Step 5: Navigating to Facebook Reels create page...');
        await page.goto('https://www.facebook.com/reels/create', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(5000);

        // Verify reels page loaded
        const reelsUrl = page.url();
        if (reelsUrl.includes('reels/create')) {
            console.log('✅ Reels create page loaded successfully');
        } else {
            console.log('⚠️ Reels page not loaded as expected, but continuing...');
        }

        // Step 6: Select page for upload (ensure correct page is selected)
        console.log('\n🎯 Step 6: Selecting page for upload...');
        try {
            await automation.selectPage(page, uploadData.pageId);
            console.log('✅ Page selected for upload');
        } catch (error) {
            console.log('⚠️ Page selection failed or not needed:', error.message);
        }

        // Step 7: Upload video as reel
        console.log('\n🎬 Step 7: Starting video upload...');
        const uploadResult = await automation.uploadAsReel(uploadData);

        if (uploadResult.success) {
            console.log('\n🎉 SUCCESS: Reel uploaded successfully!');
            console.log('📍 Result:', uploadResult);
        } else {
            console.log('\n❌ Upload failed:', uploadResult.error);
        }

        // Keep browser open for manual verification
        console.log('\n🔍 Browser tetap terbuka untuk verifikasi manual...');
        console.log('⏹️ Tekan Ctrl+C untuk menutup');

        await new Promise(() => {});

    } catch (error) {
        console.error('\n❌ Test failed:', error);
    } finally {
        await automation.cleanup();
    }
}

if (require.main === module) {
    testPage2ReelUpload().catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testPage2ReelUpload };