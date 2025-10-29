/**
 * Script sederhana untuk test klik "Kirim" dengan mouse.click
 * User harus sudah ada di halaman caption (setelah klik "Berikutnya")
 */

const puppeteer = require('puppeteer');

async function testKirimManual() {
    console.log('🎯 TEST KLICK KIRIM MANUAL - Pastikan Anda di halaman caption!');
    console.log('=' .repeat(60));

    let browser = null;
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1366, height: 1000 }
        });

        const page = await browser.newPage();

        // Set user agent
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // Set cookies untuk auto login
        const cookieString = '[{"domain":".facebook.com","expirationDate":1795163428.531776,"hostOnly":false,"httpOnly":true,"name":"sb","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaIJWm8hr_IHzgvIgaq6y"},{"domain":".facebook.com","expirationDate":1795163341.643106,"hostOnly":false,"httpOnly":true,"name":"datr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaLRagBmweA2C4FRuLUe3"},{"domain":".facebook.com","expirationDate":1792807164.444735,"hostOnly":false,"httpOnly":false,"name":"c_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"100003912046246"},{"domain":".facebook.com","expirationDate":1792139451.995713,"hostOnly":false,"httpOnly":false,"name":"i_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"61579915261071"},{"domain":".facebook.com","expirationDate":1795163454.827026,"hostOnly":false,"httpOnly":true,"name":"ps_l","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1795163454.827201,"hostOnly":false,"httpOnly":true,"name":"ps_n","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1761877012,"hostOnly":false,"httpOnly":false,"name":"wd","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1718x1270"},{"domain":".facebook.com","expirationDate":1769047164.444835,"hostOnly":false,"httpOnly":true,"name":"fr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1g4V8qQgsdt1TDXir.AWd4ySb-AWJC_ua-09UJsdUgiLYpkhHpyyo0kdN1uZGgUjeWR-E.Bo-t18..AAA.0.0.Bo-t18.AWdbibHtNe4qfTG_Si_pLW4RUtg"},{"domain":".facebook.com","expirationDate":1792807164.444881,"hostOnly":false,"httpOnly":true,"name":"xs","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"33%3A1e_0HMbiYCiQVg%3A2%3A1760603427%3A-1%3A-1%3A%3AAcW8ZB0-1AjHWswnbdPBJR8w2DTr0CP0IUaHwg72gg"}]';
        const cookies = JSON.parse(cookieString);

        for (const cookie of cookies) {
            try {
                await page.setCookie(cookie);
            } catch (error) {
                console.log(`⚠️ Failed to set cookie ${cookie.name}`);
            }
        }
        console.log('✅ Cookies loaded');

        // Navigate ke profile page untuk setup
        const pageId = '61579915261071';
        console.log(`🔄 Navigating to profile page: ${pageId}`);
        await page.goto(`https://www.facebook.com/profile.php?id=${pageId}`, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);

        // Check login status
        const isLoggedIn = await page.evaluate(() => {
            const title = document.title;
            return !title.includes('Login') && document.querySelector('nav') !== null;
        });

        if (!isLoggedIn) {
            console.log('❌ Login failed');
            return;
        }
        console.log('✅ Login successful');

        // Navigate to Facebook main
        console.log('🏠 Navigating to Facebook main page...');
        await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);

        console.log('\n🔍 SETUP SELESAI!');
        console.log('Sekarang Anda di halaman Facebook utama yang sudah login');
        console.log('\n📋 INSTRUKSI MANUAL:');
        console.log('1. Upload video dari menu create post');
        console.log('2. Tunggu sampai video ter-upload');
        console.log('3. Klik tombol "Berikutnya"');
        console.log('4. Tunggu sampai masuk halaman caption');
        console.log('5. Tekan Enter di terminal untuk test klik "Kirim"');
        console.log('');

        // Wait for user to manually navigate to caption page
        process.stdout.write('Tekan Enter setelah Anda sudah di halaman caption (setelah klik "Berikutnya")...');
        await new Promise(resolve => {
            process.stdin.once('data', () => resolve());
        });
        process.stdout.write('\n\n✅ OK, mulai test klik "Kirim"!\n\n');

        // Input caption dulu
        console.log('📝 Mencoba input caption...');
        try {
            const captionInput = await page.$('[contenteditable="true"]');
            if (captionInput) {
                await captionInput.click({ clickCount: 3 });
                await captionInput.type('Test klik Kirim dengan page.mouse.click');
                console.log('✅ Caption tersimpan');
            }
        } catch (error) {
            console.log('⚠️ Caption input gagal');
        }

        await page.waitForTimeout(1000);

        // Cari dan klik tombol Kirim dengan mouse.click
        console.log('\n🎯 Mencari tombol Kirim dan klik dengan mouse.click...');

        const result = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));

            for (let i = 0; i < buttons.length; i++) {
                const btn = buttons[i];
                const text = btn.textContent?.trim() || '';

                if (text.includes('Kirim') || text.includes('Post') || text.includes('Bagikan')) {
                    const rect = btn.getBoundingClientRect();
                    return {
                        found: true,
                        coords: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
                        text: text
                    };
                }
            }

            // Fallback: klik tombol kanan terdepan
            if (buttons.length > 0) {
                const allButtons = buttons.map(btn => ({
                    btn,
                    rect: btn.getBoundingClientRect()
                })).filter(item => item.rect.width > 40 && item.rect.height > 20)
                  .sort((a, b) => b.rect.left - a.rect.left);

                if (allButtons.length > 0) {
                    const fallbackBtn = allButtons[0];
                    return {
                        found: true,
                        coords: {
                            x: fallbackBtn.rect.left + fallbackBtn.rect.width / 2,
                            y: fallbackBtn.rect.top + fallbackBtn.rect.height / 2
                        },
                        text: fallbackBtn.btn.textContent?.trim() || 'fallback button',
                        fallback: true
                    };
                }
            }

            return { found: false };
        });

        if (!result.found) {
            console.log('❌ Tombol Kirim tidak ditemukan!');
            console.log('⚠️ Pastikan Anda di halaman dengan tombol "Kirim"');
            await page.screenshot({ path: 'debug-no-kirim-button.png', fullPage: true });
            return;
        }

        console.log(`✅ Ditemukan tombol: "${result.text}" di koordinat (${Math.round(result.coords.x)}, ${Math.round(result.coords.y)})`);

        // Add visual indicator
        console.log('\n🎨 Menambahkan visual indicator hijau "KIRIM"...');
        await page.evaluate((x, y) => {
            const indicator = document.createElement('div');
            indicator.style.position = 'fixed';
            indicator.style.left = (x - 25) + 'px';
            indicator.style.top = (y - 25) + 'px';
            indicator.style.width = '50px';
            indicator.style.height = '50px';
            indicator.style.border = '4px solid green';
            indicator.style.borderRadius = '50%';
            indicator.style.backgroundColor = 'rgba(0, 128, 0, 0.9)';
            indicator.style.zIndex = '10000';
            indicator.style.pointerEvents = 'none';
            indicator.style.boxShadow = '0 0 30px rgba(0, 128, 0, 1)';
            indicator.style.color = 'white';
            indicator.style.fontSize = '12px';
            indicator.style.fontWeight = 'bold';
            indicator.style.display = 'flex';
            indicator.style.alignItems = 'center';
            indicator.style.justifyContent = 'center';
            indicator.textContent = 'KIRIM';
            document.body.appendChild(indicator);

            // Strong flash effect
            let flashes = 0;
            const flash = () => {
                indicator.style.transform = flashes % 2 === 0 ? 'scale(0.7)' : 'scale(1.2)';
                indicator.style.opacity = flashes % 2 === 0 ? '0.3' : '1';
                flashes++;
                if (flashes < 10) {
                    setTimeout(flash, 300);
                }
            };
            flash();

            setTimeout(() => {
                document.body.removeChild(indicator);
            }, 5000);
        }, result.coords.x, result.coords.y);

        console.log('🔴 Ready to click! Indicator akan nampak 3 detik sebelum klik...');
        await page.waitForTimeout(3000);

        // Klik dengan mouse.click
        console.log('🖱️ Klik dengan page.mouse.click...');
        await page.mouse.click(result.coords.x, result.coords.y);
        console.log(`✅ SUKSES! Klik "Kirim" dengan page.mouse.click di (${Math.round(result.coords.x)}, ${Math.round(result.coords.y)})`);
        console.log('🎉 TEST SELESAI!');

        console.log('\n📸 Ambil screenshot final...');
        await page.screenshot({ path: 'debug-final-kirim-click.png', fullPage: true });
        console.log('📸 Screenshot: debug-final-kirim-click.png');

        console.log('\n🔍 Browser tetap terbuka. Tekan Ctrl+C untuk tutup');
        console.log('Cek apakah post berhasil diupload!');

        await new Promise(() => {});

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

if (require.main === module) {
    testKirimManual().catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}
