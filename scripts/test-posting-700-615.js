/**
 * Test Posting Button at (700, 615)
 * Test tombol posting dengan coordinate (700, 615)
 */

const puppeteer = require('puppeteer');

async function testPosting700615() {
    console.log('🎯 Testing Posting Button at (700, 615)');
    console.log('=' .repeat(40));

    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768'],
            defaultViewport: { width: 1366, height: 768 }
        });

        const page = await browser.newPage();

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        const testCookie = '[{"domain":".facebook.com","expirationDate":1795163428.531776,"hostOnly":false,"httpOnly":true,"name":"sb","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaIJWm8hr_IHzgvIgaq6y"},{"domain":".facebook.com","expirationDate":1795163341.643106,"hostOnly":false,"httpOnly":true,"name":"datr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaLRagBmweA2C4FRuLUe3"},{"domain":".facebook.com","expirationDate":1792807164.444735,"hostOnly":false,"httpOnly":false,"name":"c_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"100003912046246"},{"domain":".facebook.com","expirationDate":1792139451.995713,"hostOnly":false,"httpOnly":false,"name":"i_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"61579915261071"},{"domain":".facebook.com","expirationDate":1795163454.827026,"hostOnly":false,"httpOnly":true,"name":"ps_l","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1795163454.827201,"hostOnly":false,"httpOnly":true,"name":"ps_n","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1761877012,"hostOnly":false,"httpOnly":false,"name":"wd","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1718x1270"},{"domain":".facebook.com","expirationDate":1769047164.444835,"hostOnly":false,"httpOnly":true,"name":"fr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1g4V8qQgsdt1TDXir.AWd4ySb-AWJC_ua-09UJsdUgiLYpkhHpyyo0kdN1uZGgUjeWR-E.Bo-t18..AAA.0.0.Bo-t18.AWdbibHtNe4qfTG_Si_pLW4RUtg"},{"domain":".facebook.com","expirationDate":1792807164.444881,"hostOnly":false,"httpOnly":true,"name":"xs","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"33%3A1e_0HMbiYCiQVg%3A2%3A1760603427%3A-1%3A-1%3A%3AAcW8ZB0-1AjHWswnbdPBJR8w2DTr0CP0IUaHwg72gg"}]';

        const cookies = JSON.parse(testCookie);
        for (const cookie of cookies) {
            try {
                await page.setCookie(cookie);
            } catch (error) {
                console.log(`Warning: Failed to set cookie ${cookie.name}`);
            }
        }

        // Navigate to reels create
        await page.goto('https://www.facebook.com/reels/create', { waitUntil: 'networkidle2' });

        // Upload video
        const videoPath = 'D:\\apaya\\_马来西亚 _甜系女孩 好久没跳舞了 来动一动.mp4';
        const fs = require('fs');
        if (fs.existsSync(videoPath)) {
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                await fileInput.uploadFile(videoPath);
                console.log('✅ Video uploaded');
                await page.waitForTimeout(5000);
            }
        }

        // Click first next
        console.log('🎯 Clicking first next at (228, 703)');
        await page.mouse.click(228, 703);
        await page.waitForTimeout(3000);

        // Input caption
        const captionInput = await page.$('[contenteditable="true"]');
        if (captionInput) {
            await captionInput.click({ clickCount: 3 });
            await captionInput.type('Test posting coordinate (700, 615)');
            console.log('✅ Caption inputted');
        }

        // Click second next
        console.log('🎯 Clicking second next at (300, 703)');
        await page.mouse.click(300, 703);
        await page.waitForTimeout(5000);

        // Take screenshot before posting
        await page.screenshot({ path: 'debug-700-615-before.png', fullPage: true });
        console.log('📸 Screenshot before posting: debug-700-615-before.png');

        // Click posting button
        console.log('🎯 Clicking posting button at (700, 615)');
        await page.mouse.click(700, 615);
        console.log('✅ Posting button clicked at (700, 615)');

        // Wait for result
        await page.waitForTimeout(5000);

        // Check for success message
        const successMessage = await page.evaluate(() => {
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

        if (successMessage.found) {
            console.log('\n🎉 SUCCESS! Upload completed successfully!');
            console.log(`📝 Success message: "${successMessage.message}"`);
            console.log('🔗 Reel sedang diproses...');

            // Take final screenshot
            await page.screenshot({ path: 'debug-700-615-success.png', fullPage: true });
            console.log('📸 Success screenshot: debug-700-615-success.png');

        } else {
            console.log('\n⚠️ Success message not found');
            console.log('📍 Final URL:', page.url());

            // Take screenshot anyway
            await page.screenshot({ path: 'debug-700-615-final.png', fullPage: true });
            console.log('📸 Final screenshot: debug-700-615-final.png');
        }

        console.log('\n🔍 Browser tetap terbuka untuk verifikasi manual...');
        console.log('⏹️ Tekan Ctrl+C untuk menutup');

        await new Promise(() => {});

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

if (require.main === module) {
    testPosting700615().catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testPosting700615 };