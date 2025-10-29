const FacebookAutomation = require('../src/modules/facebook-automation.js');

async function testUbah720700() {
    console.log('🎯 Test Ubah Button at (720, 700) with Visual Indicators');
    console.log('=' .repeat(60));

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
        console.log('✅ Profile loaded - Taking screenshot...');
        await page.screenshot({ path: 'debug-profile-loaded.png', fullPage: true });
        console.log('📸 Screenshot: debug-profile-loaded.png');

        // Step 2: Click dashboard at (150, 200)
        console.log('\n🎯 Step 2: Click dashboard at (150, 200)');

        // Visual indicator for dashboard
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
            indicator.textContent = 'DB';
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
        console.log('✅ 🖱️ DASHBOARD CLICKED at (150, 200)');
        await page.waitForTimeout(2000);

        // Step 3: Click Ubah at (720, 700)
        console.log('\n🎯 Step 3: Click Ubah at (720, 700)');

        // Visual indicator for Ubah button
        await page.evaluate(() => {
            const indicator = document.createElement('div');
            indicator.style.position = 'fixed';
            indicator.style.left = '710px';
            indicator.style.top = '690px';
            indicator.style.width = '20px';
            indicator.style.height = '20px';
            indicator.style.border = '3px solid red';
            indicator.style.borderRadius = '50%';
            indicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            indicator.style.zIndex = '999999';
            indicator.style.pointerEvents = 'none';
            indicator.textContent = 'UBAH';
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

        await page.mouse.click(720, 700);
        console.log('✅ 🖱️ UBAH CLICKED at (720, 700)');
        await page.waitForTimeout(3000);

        // Take screenshot after Ubah click
        await page.screenshot({ path: 'debug-after-ubah-720-700.png', fullPage: true });
        console.log('📸 Screenshot: debug-after-ubah-720-700.png');

        // Check URL after Ubah click
        const currentUrl = page.url();
        console.log('📍 URL after Ubah click:', currentUrl);

        if (currentUrl.includes('professional_dashboard')) {
            console.log('✅ 🎉 SUCCESS! Redirected to professional dashboard!');
            console.log('📍 Dashboard URL:', currentUrl);
        } else {
            console.log('❌ Still not in professional dashboard');
            console.log('📍 Current URL:', currentUrl);
        }

        console.log('\n🔍 Check screenshot: debug-after-ubah-720-700.png');
        console.log('⏹️ Browser open for verification. Press Ctrl+C to close.');
        await new Promise(() => {});

    } catch (error) {
        console.error('\n❌ Error:', error);
    } finally {
        await automation.cleanup();
    }
}

if (require.main === module) {
    testUbah720700().catch(error => {
        console.error('💥 Failed:', error);
        process.exit(1);
    });
}

module.exports = { testUbah720700 };