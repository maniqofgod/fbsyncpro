const FacebookAutomation = require('../src/modules/facebook-automation.js');

async function testPage2Simple() {
    console.log('🎯 Testing Simple Dashboard Navigation for Page 2');
    console.log('=' .repeat(50));

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

        // Step 1: Navigate to profile
        console.log('\n📍 Step 1: Navigate to profile');
        await page.goto(`https://www.facebook.com/profile.php?id=${uploadData.pageId}`, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        console.log('✅ Profile loaded');

        // Step 2: Use mouse click for dashboard
        console.log('\n🔄 Step 2: Click dashboard with mouse');

        // Try mouse clicks at dashboard positions
        const dashboardPositions = [
            { x: 150, y: 200 },
            { x: 200, y: 250 },
            { x: 100, y: 300 }
        ];

        for (const pos of dashboardPositions) {
            try {
                await page.mouse.click(pos.x, pos.y);
                console.log(`✅ Clicked at (${pos.x}, ${pos.y})`);
                await page.waitForTimeout(2000);
                break;
            } catch (error) {
                console.log(`❌ Failed at (${pos.x}, ${pos.y})`);
            }
        }

        // Step 3: Handle popup
        console.log('\n🔄 Step 3: Handle popup');
        const popupHandled = await automation.handleSwitchProfilePopup(page);

        if (popupHandled) {
            console.log('✅ Popup handled');
        } else {
            console.log('ℹ️ No popup');
        }

        // Step 4: Check URL and stop
        console.log('\n🔍 Step 4: Check final state');
        const finalUrl = page.url();
        console.log('📍 Final URL:', finalUrl);

        console.log('\n🔍 Browser open for verification. Press Ctrl+C to close.');
        await new Promise(() => {});

    } catch (error) {
        console.error('\n❌ Error:', error);
    } finally {
        await automation.cleanup();
    }
}

if (require.main === module) {
    testPage2Simple().catch(error => {
        console.error('💥 Failed:', error);
        process.exit(1);
    });
}

module.exports = { testPage2Simple };