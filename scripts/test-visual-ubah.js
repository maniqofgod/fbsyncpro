const FacebookAutomation = require('../src/modules/facebook-automation.js');

async function testVisualUbah() {
    console.log('🎯 Testing Visual Mouse Click for Ubah Button');
    console.log('=' .repeat(55));

    const automation = new FacebookAutomation();

    const uploadData = {
        cookie: '[{"domain":".facebook.com","expirationDate":1795163428.531776,"hostOnly":false,"httpOnly":true,"name":"sb","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaIJWm8hr_IHzgvIgaq6y"},{"domain":".facebook.com","expirationDate":1795163341.643106,"hostOnly":false,"httpOnly":true,"name":"datr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaLRagBmweA2C4FRuLUe3"},{"domain":".facebook.com","expirationDate":1792807164.444735,"hostOnly":false,"httpOnly":false,"name":"c_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"100003912046246"},{"domain":".facebook.com","expirationDate":1792139451.995713,"hostOnly":false,"httpOnly":false,"name":"i_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"61579915261071"},{"domain":".facebook.com","expirationDate":1795163454.827026,"hostOnly":false,"httpOnly":true,"name":"ps_l","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1795163454.827201,"hostOnly":false,"httpOnly":true,"name":"ps_n","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1761877012,"hostOnly":false,"httpOnly":false,"name":"wd","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1718x1270"},{"domain":".facebook.com","expirationDate":1769047164.444835,"hostOnly":false,"httpOnly":true,"name":"fr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1g4V8qQgsdt1TDXir.AWd4ySb-AWJC_ua-09UJsdUgiLYpkhHpyyo0kdN1uZGgUjeWR-E.Bo-t18..AAA.0.0.Bo-t18.AWdbibHtNe4qfTG_Si_pLW4RUtg"},{"domain":".facebook.com","expirationDate":1792807164.444881,"hostOnly":false,"httpOnly":true,"name":"xs","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"33%3A1e_0HMbiYCiQVg%3A2%3A1760603427%3A-1%3A-1%3A%3AAcW8ZB0-1AjHWswnbdPBJR8w2DTr0CP0IUaHwg72gg"}]',
        pageId: '100087263454995'
    };

    try {
        await automation.initialize();
        const page = await automation.browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await automation.setCookies(page, uploadData.cookie);

        // Step 1: Navigate to profile and screenshot
        console.log('\n📍 Step 1: Navigate to profile');
        await page.goto(`https://www.facebook.com/profile.php?id=${uploadData.pageId}`, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        console.log('✅ Profile loaded - Taking initial screenshot...');
        await page.screenshot({ path: 'debug-profile-loaded.png', fullPage: true });
        console.log('📸 Screenshot: debug-profile-loaded.png');

        // Step 2: Click dashboard with mouse at (150, 200)
        console.log('\n🔄 Step 2: Click dashboard with mouse at (150, 200)');
        await page.mouse.click(150, 200);
        console.log('✅ 🖱️ DASHBOARD CLICKED at (150, 200) - Taking screenshot...');
        await page.screenshot({ path: 'debug-after-dashboard-click.png', fullPage: true });
        console.log('📸 Screenshot: debug-after-dashboard-click.png');
        await page.waitForTimeout(2000);

        // Step 3: Check URL after dashboard click
        let currentUrl = page.url();
        console.log('📍 URL after dashboard click:', currentUrl);

        if (currentUrl.includes('professional_dashboard')) {
            console.log('✅ 🎉 SUCCESS! Already in professional dashboard!');
            console.log('📍 Final URL:', currentUrl);
        } else {
            console.log('⚠️ Still not in dashboard, trying to click Ubah button...');

            // Step 4: Click Ubah button with mouse
            console.log('\n🔄 Step 4: Click Ubah button with mouse');

            const ubahPositions = [
                { x: 700, y: 450, name: 'Center' },
                { x: 650, y: 400, name: 'Top-Left' },
                { x: 750, y: 500, name: 'Bottom-Right' },
                { x: 600, y: 450, name: 'Left' },
                { x: 800, y: 400, name: 'Top-Right' },
                { x: 700, y: 350, name: 'Top-Center' },
                { x: 650, y: 500, name: 'Bottom-Left' }
            ];

            let ubahClicked = false;
            for (const coord of ubahPositions) {
                try {
                    console.log(`🎯 Trying Ubah button at (${coord.x}, ${coord.y}) - ${coord.name}`);
                    await page.mouse.click(coord.x, coord.y);
                    console.log(`✅ 🖱️ UBAH CLICKED at (${coord.x}, ${coord.y}) - ${coord.name}`);
                    ubahClicked = true;

                    // Take screenshot after each click
                    await page.screenshot({ path: `debug-after-ubah-${coord.name.toLowerCase()}.png`, fullPage: true });
                    console.log(`📸 Screenshot: debug-after-ubah-${coord.name.toLowerCase()}.png`);

                    await page.waitForTimeout(3000);
                    currentUrl = page.url();
                    console.log('📍 URL after Ubah click:', currentUrl);

                    if (currentUrl.includes('professional_dashboard')) {
                        console.log('✅ 🎉 SUCCESS! Redirected to professional dashboard!');
                        break;
                    }
                    break;
                } catch (error) {
                    console.log(`❌ Failed to click Ubah at (${coord.x}, ${coord.y}) - ${coord.name}`);
                }
            }

            if (!ubahClicked) {
                console.log('⚠️ Failed to click Ubah button at any position');
            }
        }

        // Final check
        console.log('\n🔍 FINAL CHECK:');
        currentUrl = page.url();
        console.log('📍 Final URL:', currentUrl);

        if (currentUrl.includes('professional_dashboard')) {
            console.log('✅ 🎉 SUCCESS! Professional dashboard reached!');
            console.log('📍 Dashboard URL:', currentUrl);
        } else {
            console.log('❌ Still not in professional dashboard');
            console.log('📍 Current URL:', currentUrl);
        }

        console.log('\n🔍 Browser open for verification. Check screenshots in folder.');
        console.log('⏹️ Press Ctrl+C to close.');
        await new Promise(() => {});

    } catch (error) {
        console.error('\n❌ Error:', error);
    } finally {
        await automation.cleanup();
    }
}

if (require.main === module) {
    testVisualUbah().catch(error => {
        console.error('💥 Failed:', error);
        process.exit(1);
    });
}

module.exports = { testVisualUbah };