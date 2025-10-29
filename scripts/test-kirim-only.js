/**
 * Test hanya klik "Kirim" menggunakan page.mouse.click
 * Mengasumsikan browser sudah di halaman caption setelah klik "Berikutnya"
 */

const puppeteer = require('puppeteer');

async function testKirimOnly() {
    console.log('🎯 TEST KHUSUS: Klik "Kirim" saja menggunakan page.mouse.click');
    console.log('=' .repeat(55));

    let browser = null;
    try {
        console.log('🔄 Mengasumsikan browser sudah di halaman caption setelah klik "Berikutnya"');

        // Launch browser manually for testing
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,1000'],
            defaultViewport: { width: 1366, height: 1000 }
        });

        const page = await browser.newPage();

        // Set user agent
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        console.log('\n📝 Instruksi:');
        console.log('1. Pastikan browser sudah terbuka di halaman Facebook caption input');
        console.log('2. Jika belum, navigate ke https://www.facebook.com/ dan upload video');
        console.log('3. Pastikan sudah klik "Berikutnya" dan sekarang di halaman caption');
        console.log('4. Input caption jika diperlukan');
        console.log('5. Jalankan script ini');
        console.log('');

        // Wait for user to navigate to correct page
        console.log('⏳ Tunggu user navigate ke halaman caption...');
        await page.waitForTimeout(10000); // Give time for user to navigate

        // Optional: Input caption
        console.log('\n📝 Inputting caption (optional)...');
        try {
            const captionInput = await page.$('[contenteditable="true"]');
            if (captionInput) {
                await captionInput.click({ clickCount: 3 });
                await captionInput.type('Test klik Kirim dengan visual indicator');
                console.log('✅ Caption inputted');
            } else {
                console.log('ℹ️ Caption input not found, skipping');
            }
        } catch (error) {
            console.log('ℹ️ Caption input failed, continuing...');
        }

        await page.waitForTimeout(2000);

        // Find "Kirim" button coordinates
        console.log('\n🎯 Finding "Kirim" button...');

        const kirimFound = await page.evaluate(() => {
            const allButtons = Array.from(document.querySelectorAll('button, [role="button"], div[role="button"], span[role="button"]'));

            console.log(`🔍 Found ${allButtons.length} clickable elements for kirim button`);

            // Find button with "Kirim", "Post", "Bagikan" text
            const kirimBtn = allButtons.find(btn => {
                const text = btn.textContent?.trim() || '';
                const ariaLabel = btn.getAttribute('aria-label') || '';
                return text.includes('Kirim') ||
                       text.includes('Post') ||
                       text.includes('Bagikan') ||
                       text.includes('Share') ||
                       ariaLabel.includes('Kirim') ||
                       ariaLabel.includes('Post') ||
                       ariaLabel.includes('Bagikan') ||
                       ariaLabel.includes('Share');
            });

            if (kirimBtn) {
                const rect = kirimBtn.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;

                console.log(`📍 Kirim button coordinates: (${Math.round(x)}, ${Math.round(y)})`);

                return { success: true, coords: { x, y }, text: kirimBtn.textContent?.trim() };
            }

            // Fallback: find the rightmost button
            if (allButtons.length > 0) {
                const sortedButtons = allButtons
                    .map(btn => ({ btn, rect: btn.getBoundingClientRect() }))
                    .filter(item => item.rect.width > 50 && item.rect.height > 30)
                    .sort((a, b) => b.rect.left - a.rect.left);

                if (sortedButtons.length > 0) {
                    const fallbackBtn = sortedButtons[0].btn;
                    const rect = fallbackBtn.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;

                    console.log('Using fallback button for kirim (rightmost):', fallbackBtn.textContent?.trim());
                    console.log(`Fallback button coordinates: (${Math.round(x)}, ${Math.round(y)})`);

                    return {
                        success: true,
                        coords: { x, y },
                        text: fallbackBtn.textContent?.trim(),
                        fallback: true
                    };
                }
            }

            return { success: false };
        });

        if (!kirimFound || !kirimFound.success) {
            console.log('❌ Could not find "Kirim" button');
            console.log('ℹ️ Make sure you are on the caption page after clicking "Berikutnya"');
            return;
        }

        console.log(`🎯 KIRIM button found: "${kirimFound.text}" at coordinates (${Math.round(kirimFound.coords.x)}, ${Math.round(kirimFound.coords.y)})`);

        // Add visual indicator before clicking "Kirim"
        console.log('\n🟩 Adding visual indicator for KIRIM...');
        await page.evaluate((x, y) => {
            const indicator = document.createElement('div');
            indicator.id = 'kirim-indicator';
            indicator.style.position = 'fixed';
            indicator.style.left = (x - 25) + 'px';
            indicator.style.top = (y - 25) + 'px';
            indicator.style.width = '50px';
            indicator.style.height = '50px';
            indicator.style.border = '4px solid green';
            indicator.style.borderRadius = '50%';
            indicator.style.backgroundColor = 'rgba(0, 128, 0, 0.8)';
            indicator.style.zIndex = '999999';
            indicator.style.pointerEvents = 'none';
            indicator.style.boxShadow = '0 0 20px rgba(0, 128, 0, 1)';
            indicator.textContent = 'KIRIM';
            indicator.style.color = 'white';
            indicator.style.fontSize = '10px';
            indicator.style.display = 'flex';
            indicator.style.alignItems = 'center';
            indicator.style.justifyContent = 'center';
            indicator.style.fontWeight = 'bold';
            document.body.appendChild(indicator);
            console.log('🟢 KIRIM indicator added to DOM');

            // Flash effect - slower to make it more visible
            let flashCount = 0;
            const flashInterval = setInterval(() => {
                indicator.style.opacity = flashCount % 2 === 0 ? '0.2' : '1';
                indicator.style.transform = flashCount % 2 === 0 ? 'scale(0.9)' : 'scale(1.1)';
                flashCount++;
                if (flashCount > 8) { // 4 flashes - longer visibility
                    clearInterval(flashInterval);
                    setTimeout(() => {
                        if (indicator.parentNode) {
                            indicator.parentNode.removeChild(indicator);
                            console.log('🟢 KIRIM indicator removed');
                        }
                    }, 1500); // Stay longer
                }
            }, 400); // Slower flash
        }, kirimFound.coords.x, kirimFound.coords.y);

        // Wait for visual indicator to be visible
        console.log('📱 Waiting 3 seconds to see visual indicator flash...');
        await page.waitForTimeout(3000);

        // Click "Kirim" button using mouse.click (as requested)
        console.log(`\n🖱️ Clicking "Kirim" button with page.mouse.click at (${Math.round(kirimFound.coords.x)}, ${Math.round(kirimFound.coords.y)})`);
        await page.mouse.click(kirimFound.coords.x, kirimFound.coords.y);
        console.log('✅ SUCCESS! Clicked "Kirim" button with mouse.click');
        console.log('🎉 TEST COMPLETED - "Kirim" button clicked successfully!');

        console.log('');
        console.log('❓ KATKAN "SUDAH SUKSES" jika Anda melihat:');
        console.log('   - Lingkaran hijau dengan text "KIRIM" yang berkedip dan berukuran scalable');
        console.log('   - Browser memproses upload (muncul pesan sukses atau refresh)');
        console.log('');

        // Wait for possible upload processing
        await page.waitForTimeout(5000);

        // Take final screenshot
        await page.screenshot({ path: 'debug-after-kirim-click.png', fullPage: true });
        console.log('📸 Screenshot after Kirim click: debug-after-kirim-click.png');

        console.log('\n🔍 Browser tetap terbuka untuk verifikasi hasil upload!');
        console.log('⏹️ Tekan Ctrl+C untuk menutup');

        // Keep browser open
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
    testKirimOnly().catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testKirimOnly };
