const FacebookAutomation = require('../src/modules/facebook-automation.js');

async function testFinalUbah() {
    console.log('🎯 FINAL TEST: Mouse Click Dashboard + Visual Indicators');
    console.log('=' .repeat(60));

    const automation = new FacebookAutomation();

    const uploadData = {
        cookie: '[{"domain":".facebook.com","expirationDate":1795163428.531776,"hostOnly":false,"httpOnly":true,"name":"sb","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaIJWm8hr_IHzgvIgaq6y"},{"domain":".facebook.com","expirationDate":1795163341.643106,"hostOnly":false,"httpOnly":true,"name":"datr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaLRagBmweA2C4FRuLUe3"},{"domain":".facebook.com","expirationDate":1792807164.444735,"hostOnly":false,"httpOnly":false,"name":"c_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"100003912046246"},{"domain":".facebook.com","expirationDate":1792139451.995713,"hostOnly":false,"httpOnly":false,"name":"i_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"61579915261071"},{"domain":".facebook.com","expirationDate":1795163454.827026,"hostOnly":false,"httpOnly":true,"name":"ps_l","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1795163454.827201,"hostOnly":false,"httpOnly":true,"name":"ps_n","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1761877012,"hostOnly":false,"httpOnly":false,"name":"wd","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1718x1270"},{"domain":".facebook.com","expirationDate":1769047164.444835,"hostOnly":false,"httpOnly":true,"name":"fr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1g4V8qQgsdt1TDXir.AWd4ySb-AWJC_ua-09UJsdUgiLYpkhHpyyo0kdN1uZGgUjeWR-E.Bo-t18..AAA.0.0.Bo-t18.AWdbibHtNe4qfTG_Si_pLW4RUtg"},{"domain":".facebook.com","expirationDate":1792807164.444881,"hostOnly":false,"httpOnly":true,"name":"xs","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"33%3A1e_0HMbiYCiQVg%3A2%3A1760603427%3A-1%3A-1%3A%3AAcW8ZB0-1AjHWswnbdPBJR8w2DTr0CP0IUaHwg72gg"}]',
        pageId: '61579915261071'
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
        } else {
            console.log('⚠️ Not in dashboard yet, trying Ubah button...');

            // Step 3: Visual indicators for Ubah button clicks
            console.log('\n🎯 Step 3: Adding visual indicators for Ubah button clicks...');

            const ubahPositions = [
                { x: 830, y: 470, name: 'BOTTOM-RIGHT' }
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
                    break;
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
        } else {
            console.log('❌ Still not in professional dashboard');
            console.log('📍 Current URL:', currentUrl);
        }

        console.log('\n🔍 All screenshots saved. Check debug-*.png files in folder.');
        console.log('⏹️ Browser open for verification. Press Ctrl+C to close.');
        await new Promise(() => {});

    } catch (error) {
        console.error('\n❌ Error:', error);
    } finally {
        await automation.cleanup();
    }
}

if (require.main === module) {
    testFinalUbah().catch(error => {
        console.error('💥 Failed:', error);
        process.exit(1);
    });
}

module.exports = { testFinalUbah };