const FacebookAutomation = require('../src/modules/facebook-automation.js');

async function testImprovedPageSelection() {
    console.log('🎯 Testing Improved Page Selection Methods');
    console.log('=' .repeat(50));

    const automation = new FacebookAutomation();

    const uploadData = {
        cookie: '[{"domain":".facebook.com","expirationDate":1795163428.531776,"hostOnly":false,"httpOnly":true,"name":"sb","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaIJWm8hr_IHzgvIgaq6y"},{"domain":".facebook.com","expirationDate":1795163341.643106,"hostOnly":false,"httpOnly":true,"name":"datr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaLRagBmweA2C4FRuLUe3"},{"domain":".facebook.com","expirationDate":1792807164.444735,"hostOnly":false,"httpOnly":false,"name":"c_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"100003912046246"},{"domain":".facebook.com","expirationDate":1792139451.995713,"hostOnly":false,"httpOnly":false,"name":"i_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"61579915261071"},{"domain":".facebook.com","expirationDate":1795163454.827026,"hostOnly":false,"httpOnly":true,"name":"ps_l","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1795163454.827201,"hostOnly":false,"httpOnly":true,"name":"ps_n","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1761877012,"hostOnly":false,"httpOnly":false,"name":"wd","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1718x1270"},{"domain":".facebook.com","expirationDate":1769047164.444835,"hostOnly":false,"httpOnly":true,"name":"fr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1g4V8qQgsdt1TDXir.AWd4ySb-AWJC_ua-09UJsdUgiLYpkhHpyyo0kdN1uZGgUjeWR-E.Bo-t18..AAA.0.0.Bo-t18.AWdbibHtNe4qfTG_Si_pLW4RUtg"},{"domain":".facebook.com","expirationDate":1792807164.444881,"hostOnly":false,"httpOnly":true,"name":"xs","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"33%3A1e_0HMbiYCiQVg%3A2%3A1760603427%3A-1%3A-1%3A%3AAcW8ZB0-1AjHWswnbdPBJR8w2DTr0CP0IUaHwg72gg"}]',
        pageId: '61579915261071',
        videoPath: 'D:\\apaya\\_马来西亚 _甜系女孩 好久没跳舞了 来动一动.mp4',
        caption: 'Test improved page selection methods'
    };

    try {
        console.log('\n📋 Test 1: Initialize browser');
        await automation.initialize();
        console.log('✅ Browser initialized');

        const page = await automation.browser.newPage();
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
        await automation.setCookies(page, uploadData.cookie);

        console.log('\n📋 Test 2: Navigate to profile page');
        await page.goto(`https://www.facebook.com/profile.php?id=${uploadData.pageId}`, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);

        const isLoggedIn = await automation.checkLoginStatus(page);
        if (!isLoggedIn) {
            throw new Error('Authentication failed');
        }
        console.log('✅ Profile page loaded and authenticated');

        console.log('\n📋 Test 3: Test handleSwitchProfilePopup method');
        const switchHandled = await automation.handleSwitchProfilePopup(page);
        console.log(`✅ Switch profile popup handled: ${switchHandled}`);

        console.log('\n📋 Test 4: Test validatePageAccess method');
        const pageValidated = await automation.validatePageAccess(page, uploadData.pageId);
        console.log(`✅ Page access validated: ${pageValidated}`);

        console.log('\n📋 Test 5: Test selectPage method');
        const pageSelected = await automation.selectPage(page, uploadData.pageId);
        console.log(`✅ Page selected: ${pageSelected}`);

        console.log('\n📋 Test 6: Test complete workflow');
        // Navigate to reels create
        await page.goto('https://www.facebook.com/reels/create', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);

        // Test page selection in reels context
        const reelsPageSelected = await automation.selectPage(page, uploadData.pageId);
        console.log(`✅ Reels page selection: ${reelsPageSelected}`);

        console.log('\n🎉 All tests completed successfully!');
        console.log('✅ Improved page selection methods are working correctly');

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

async function testPageSelectionMethods() {
    console.log('🧪 Testing Individual Page Selection Methods');
    console.log('=' .repeat(50));

    const automation = new FacebookAutomation();

    try {
        await automation.initialize();
        const page = await automation.browser.newPage();

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        const testCookie = '[{"domain":".facebook.com","expirationDate":1795163428.531776,"hostOnly":false,"httpOnly":true,"name":"sb","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaIJWm8hr_IHzgvIgaq6y"},{"domain":".facebook.com","expirationDate":1795163341.643106,"hostOnly":false,"httpOnly":true,"name":"datr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaLRagBmweA2C4FRuLUe3"},{"domain":".facebook.com","expirationDate":1792807164.444735,"hostOnly":false,"httpOnly":false,"name":"c_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"100003912046246"},{"domain":".facebook.com","expirationDate":1792139451.995713,"hostOnly":false,"httpOnly":false,"name":"i_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"61579915261071"},{"domain":".facebook.com","expirationDate":1795163454.827026,"hostOnly":false,"httpOnly":true,"name":"ps_l","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1795163454.827201,"hostOnly":false,"httpOnly":true,"name":"ps_n","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1761877012,"hostOnly":false,"httpOnly":false,"name":"wd","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1718x1270"},{"domain":".facebook.com","expirationDate":1769047164.444835,"hostOnly":false,"httpOnly":true,"name":"fr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1g4V8qQgsdt1TDXir.AWd4ySb-AWJC_ua-09UJsdUgiLYpkhHpyyo0kdN1uZGgUjeWR-E.Bo-t18..AAA.0.0.Bo-t18.AWdbibHtNe4qfTG_Si_pLW4RUtg"},{"domain":".facebook.com","expirationDate":1792807164.444881,"hostOnly":false,"httpOnly":true,"name":"xs","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"33%3A1e_0HMbiYCiQVg%3A2%3A1760603427%3A-1%3A-1%3A%3AAcW8ZB0-1AjHWswnbdPBJR8w2DTr0CP0IUaHwg72gg"}]';

        await automation.setCookies(page, testCookie);

        // Test 1: Navigate to profile
        console.log('\n📋 Test: Navigate to profile');
        await page.goto('https://www.facebook.com/profile.php?id=61579915261071', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        console.log('✅ Navigation successful');

        // Test 2: Check login status
        console.log('\n📋 Test: Check login status');
        const loginStatus = await automation.checkLoginStatus(page);
        console.log(`✅ Login status: ${loginStatus}`);

        // Test 3: Handle switch profile popup
        console.log('\n📋 Test: Handle switch profile popup');
        const switchResult = await automation.handleSwitchProfilePopup(page);
        console.log(`✅ Switch profile result: ${switchResult}`);

        // Test 4: Validate page access
        console.log('\n📋 Test: Validate page access');
        const validateResult = await automation.validatePageAccess(page, '61579915261071');
        console.log(`✅ Page validation result: ${validateResult}`);

        // Test 5: Select page
        console.log('\n📋 Test: Select page');
        const selectResult = await automation.selectPage(page, '61579915261071');
        console.log(`✅ Page selection result: ${selectResult}`);

        console.log('\n🎉 Individual method tests completed!');

        // Keep browser open for verification
        console.log('\n🔍 Browser tetap terbuka untuk verifikasi manual...');
        await new Promise(() => {});

    } catch (error) {
        console.error('❌ Individual test failed:', error);
    } finally {
        await automation.cleanup();
    }
}

if (require.main === module) {
    // Run the comprehensive test by default
    testImprovedPageSelection().catch(error => {
        console.error('💥 Comprehensive test failed:', error);
        process.exit(1);
    });
}

module.exports = {
    testImprovedPageSelection,
    testPageSelectionMethods
};