const FacebookAutomation = require('../src/modules/facebook-automation.js');

async function testPage2Dashboard() {
    console.log('🎯 Testing Dashboard Navigation for Page 2 (GoyangGo)');
    console.log('Alur: Profil -> Dashboard -> Handle Popup -> Stop');
    console.log('=' .repeat(60));

    const automation = new FacebookAutomation();

    const uploadData = {
        cookie: '[{"domain":".facebook.com","expirationDate":1795163428.531776,"hostOnly":false,"httpOnly":true,"name":"sb","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaIJWm8hr_IHzgvIgaq6y"},{"domain":".facebook.com","expirationDate":1795163341.643106,"hostOnly":false,"httpOnly":true,"name":"datr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaLRagBmweA2C4FRuLUe3"},{"domain":".facebook.com","expirationDate":1792807164.444735,"hostOnly":false,"httpOnly":false,"name":"c_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"100003912046246"},{"domain":".facebook.com","expirationDate":1792139451.995713,"hostOnly":false,"httpOnly":false,"name":"i_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"61579915261071"},{"domain":".facebook.com","expirationDate":1795163454.827026,"hostOnly":false,"httpOnly":true,"name":"ps_l","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1795163454.827201,"hostOnly":false,"httpOnly":true,"name":"ps_n","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1761877012,"hostOnly":false,"httpOnly":false,"name":"wd","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1718x1270"},{"domain":".facebook.com","expirationDate":1769047164.444835,"hostOnly":false,"httpOnly":true,"name":"fr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1g4V8qQgsdt1TDXir.AWd4ySb-AWJC_ua-09UJsdUgiLYpkhHpyyo0kdN1uZGgUjeWR-E.Bo-t18..AAA.0.0.Bo-t18.AWdbibHtNe4qfTG_Si_pLW4RUtg"},{"domain":".facebook.com","expirationDate":1792807164.444881,"hostOnly":false,"httpOnly":true,"name":"xs","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"33%3A1e_0HMbiYCiQVg%3A2%3A1760603427%3A-1%3A-1%3A%3AAcW8ZB0-1AjHWswnbdPBJR8w2DTr0CP0IUaHwg72gg"}]',
        pageId: '100087263454995', // Page 2 ID
        videoPath: 'D:\\apaya\\_马来西亚 _甜系女孩 好久没跳舞了 来动一动.mp4',
        caption: 'Test untuk Halaman 2'
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

        // Step 2: Navigate to dashboard
        console.log('\n🔄 Step 2: Navigating to professional dashboard...');
        await page.goto('https://www.facebook.com/professional_dashboard/overview/', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);

        const currentUrl = page.url();
        console.log('📍 Current URL:', currentUrl);

        if (currentUrl.includes('professional_dashboard')) {
            console.log('✅ Successfully in professional dashboard');
        } else {
            console.log('⚠️ Not in dashboard');
        }

        // Step 3: Handle switch profile popup if present
        console.log('\n🔄 Step 3: Handling switch profile popup...');
        const popupHandled = await automation.handleSwitchProfilePopup(page);

        if (popupHandled) {
            console.log('✅ Switch profile popup handled successfully');
        } else {
            console.log('ℹ️ No popup appeared or already in dashboard');
        }

        // Step 4: Stop here for user verification
        console.log('\n🔍 Step 4: Dashboard reached, stopping for user verification...');
        console.log('📍 Final URL:', page.url());

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
    testPage2Dashboard().catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testPage2Dashboard };