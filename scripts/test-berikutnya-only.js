/**
 * Test hanya sampai Klik "Berikutnya" dengan visual indicators
 * Stopping at next button click to see if element click works properly
 */

const FacebookAutomation = require('../src/modules/facebook-automation');

async function testBerikutnyaOnly() {
    console.log('🎯 TEST KHUSUS: Klik "Berikutnya" saja dengan Visual Indicators');
    console.log('=' .repeat(60));

    const automation = new FacebookAutomation({
        showBrowser: true // Browser terlihat
    });

    let page = null;
    try {
        console.log('🔄 Inisialisasi dan navigasi...');

        await automation.initialize();

        page = await automation.browser.newPage();

        // Clean start - no scroll interference
        await page.evaluateOnNewDocument(() => {
            console.log('Starting clean test...');
        });

        // Set user agent
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // Cookies untuk login
        const uploadData = {
            cookie: '[{"domain":".facebook.com","expirationDate":1795163428.531776,"hostOnly":false,"httpOnly":true,"name":"sb","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaIJWm8hr_IHzgvIgaq6y"},{"domain":".facebook.com","expirationDate":1795163341.643106,"hostOnly":false,"httpOnly":true,"name":"datr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaLRagBmweA2C4FRuLUe3"},{"domain":".facebook.com","expirationDate":1792807164.444735,"hostOnly":false,"httpOnly":false,"name":"c_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"100003912046246"},{"domain":".facebook.com","expirationDate":1792139451.995713,"hostOnly":false,"httpOnly":false,"name":"i_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"61579915261071"},{"domain":".facebook.com","expirationDate":1795163454.827026,"hostOnly":false,"httpOnly":true,"name":"ps_l","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1795163454.827201,"hostOnly":false,"httpOnly":true,"name":"ps_n","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1761877012,"hostOnly":false,"httpOnly":false,"name":"wd","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1718x1270"},{"domain":".facebook.com","expirationDate":1769047164.444835,"hostOnly":false,"httpOnly":true,"name":"fr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1g4V8qQgsdt1TDXir.AWd4ySb-AWJC_ua-09UJsdUgiLYpkhHpyyo0kdN1uZGgUjeWR-E.Bo-t18..AAA.0.0.Bo-t18.AWdbibHtNe4qfTG_Si_pLW4RUtg"},{"domain":".facebook.com","expirationDate":1792807164.444881,"hostOnly":false,"httpOnly":true,"name":"xs","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"33%3A1e_0HMbiYCiQVg%3A2%3A1760603427%3A-1%3A-1%3A%3AAcW8ZB0-1AjHWswnbdPBJR8w2DTr0CP0IUaHwg72gg"}]',
            pageId: '61579915261071'
        };

        // Set cookies
        await automation.setCookies(page, uploadData.cookie);

        // Step 1: Login dan navigasi
        console.log('\n📍 Step 1: Navigate to profile page');
        await page.goto(`https://www.facebook.com/profile.php?id=${uploadData.pageId}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await page.waitForTimeout(3000);

        const isLoggedIn = await automation.checkLoginStatus(page);
        if (!isLoggedIn) {
            throw new Error('Login failed');
        }
        console.log('✅ Profile loaded successfully');

        // Step 2: Handle switch profile popup
        console.log('\n📍 Step 2: Handle switch profile popup');
        const switchSuccess = await automation.handleSwitchProfilePopup(page, uploadData.pageId);
        console.log('ℹ Switch profile result:', switchSuccess);

        // Step 3: Go to Facebook main page
        console.log('\n📍 Step 3: Navigate to Facebook main page');
        await page.goto('https://www.facebook.com/', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Step 4: Look for post creation area
        console.log('\n📍 Step 4: Looking for post creation area...');
        const postCreationSelectors = [
            '[data-testid="status-attachment-photo"]',
            '[data-testid="status-attachment-video"]',
            '[aria-label="Photo/Video"]',
            '[aria-label="Foto/Video"]',
            'input[type="file"]',
            '.post-creation-area'
        ];

        let postArea = null;
        for (const selector of postCreationSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 5000 });
                postArea = await page.$(selector);
                if (postArea) {
                    console.log(`✅ Found post creation area: ${selector}`);
                    break;
                }
            } catch (error) {
                // Continue trying other selectors
            }
        }

        if (!postArea) {
            throw new Error('Could not find post creation area');
        }

        // Step 5: Upload video file
        console.log('\n📍 Step 5: Upload video file...');
        const videoPath = 'uploads/1761719390863-860031623.mp4';
        const fs = require('fs');

        if (!fs.existsSync(videoPath)) {
            throw new Error(`Video file not found: ${videoPath}`);
        }

        const fileInputSelectors = [
            'input[type="file"]',
            '[data-testid="video-file-input"]',
            '[data-testid="photo-file-input"]',
            '.upload-input'
        ];

        let fileInput = null;
        for (const selector of fileInputSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 5000 });
                fileInput = await page.$(selector);
                if (fileInput) {
                    console.log(`✅ Found file input: ${selector}`);
                    break;
                }
            } catch (error) {
                // Continue trying other selectors
            }
        }

        if (!fileInput) {
            throw new Error('Video file input not found');
        }

        await fileInput.uploadFile(videoPath);
        console.log('✅ Video file uploaded successfully');

        // Wait for upload to process
        await page.waitForTimeout(3000);

        // Step 6: Wait for upload processing, then click "Berikutnya" button using element click
        console.log('\n🎯 STEP 6: WAITING FOR VIDEO PROCESSING, THEN CLICKING "BERIKUTNYA" BUTTON');

        // Wait longer for video upload processing and modal to fully load
        console.log('⏳ Waiting longer for video processing and modal stability...');
        await page.waitForTimeout(8000); // Increased from 3000 to 8000

        // Wait for upload to be ready (look for video thumbnail or processing indicators)
        console.log('🔍 Waiting for video processing to complete...');
        let processingComplete = false;
        let attempts = 0;
        const maxAttempts = 10; // 10 attempts * 2s = 20s max wait

        while (!processingComplete && attempts < maxAttempts) {
            console.log(`🔄 Checking upload status (attempt ${attempts + 1}/${maxAttempts})...`);

            processingComplete = await page.evaluate(() => {
                // Check for video thumbnail (indicates processing is done)
                const videoThumbs = document.querySelectorAll('img[src*="video"], video, [data-visualcompletion="media-vc"]');

                // Check for compose form elements that indicate next step is ready
                const composeElements = document.querySelectorAll('[contenteditable="true"], [aria-label*="caption"], [aria-label*="deskripsi"]');

                // Check if buttons are available (indicating modal loaded)
                const buttons = document.querySelectorAll('button, [role="button"]');
                const hasNextButtons = Array.from(buttons).some(btn =>
                    btn.textContent?.includes('Berikutnya') ||
                    btn.textContent?.includes('Next') ||
                    btn.textContent?.includes('Lanjutkan') ||
                    btn.getAttribute('aria-label')?.includes('Berikutnya')
                );

                console.log(`📊 Processing check: thumbs=${videoThumbs.length}, compose=${composeElements.length}, buttons=${buttons.length}, nextBtn=${hasNextButtons}`);

                // Consider processing complete if we have video elements AND buttons
                return videoThumbs.length > 0 && composeElements.length > 0 && hasNextButtons;
            });

            if (!processingComplete) {
                await page.waitForTimeout(2000);
                attempts++;
            }
        }

        if (!processingComplete) {
            console.log('⚠️ Video processing check failed, proceeding anyway...');
        } else {
            console.log('✅ Video processing complete, modal ready for next step');
        }

        console.log('\n🎯 STEP 6: CLICKING "BERIKUTNYA" BUTTON WITH ELEMENT CLICK');
        console.log('🌟 This should show red circle with "BERIKUTNYA" text');
        console.log('⏳ Will wait 5 seconds to see the visual indicator...');

        // IMPLEMENT THE SAME LOGIC AS IN uploadAsPost for next button click
        let nextBtnElement = null;
        let nextBtnFound = false;

        // Try to find and click the "Berikutnya" button directly via element
        try {
            // First try: Look for button with specific text using page.evaluate
            nextBtnFound = await page.evaluate(() => {
                const allButtons = Array.from(document.querySelectorAll('button, [role="button"], div[role="button"], span[role="button"]'));

                console.log(`🔍 Found ${allButtons.length} clickable elements for next element click`);

                // Find button with "Berikutnya" text and click it directly
                const nextBtn = allButtons.find(btn => {
                    const text = btn.textContent?.trim() || '';
                    const ariaLabel = btn.getAttribute('aria-label') || '';
                    return text.includes('Berikutnya') ||
                           text.includes('Next') ||
                           text.includes('Selanjutnya') ||
                           ariaLabel.includes('Berikutnya') ||
                           ariaLabel.includes('Next');
                });

                if (nextBtn) {
                    console.log('✅ Found next button by text:', nextBtn.textContent?.trim());
                    const rect = nextBtn.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;

                    console.log(`📍 Next button coordinates: (${Math.round(x)}, ${Math.round(y)})`);

                    return { success: true, coords: { x, y } };
                }

                return { success: false };
            });

            if (nextBtnFound && nextBtnFound.success) {
                // Add visual indicator and click
                console.log(`🎯 BERIKUTNYA button found at coordinates: (${Math.round(nextBtnFound.coords.x)}, ${Math.round(nextBtnFound.coords.y)})`);

                console.log('🟥 Adding visual indicator for BERIKUTNYA...');
                await page.evaluate((x, y) => {
                    const indicator = document.createElement('div');
                    indicator.id = 'berikutnya-indicator';
                    indicator.style.position = 'fixed';
                    indicator.style.left = (x - 25) + 'px';
                    indicator.style.top = (y - 25) + 'px';
                    indicator.style.width = '50px';
                    indicator.style.height = '50px';
                    indicator.style.border = '4px solid red';
                    indicator.style.borderRadius = '50%';
                    indicator.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
                    indicator.style.zIndex = '999999';
                    indicator.style.pointerEvents = 'none';
                    indicator.style.boxShadow = '0 0 20px rgba(255, 0, 0, 1)';
                    indicator.textContent = 'BERIKUTNYA';
                    indicator.style.color = 'white';
                    indicator.style.fontSize = '10px';
                    indicator.style.display = 'flex';
                    indicator.style.alignItems = 'center';
                    indicator.style.justifyContent = 'center';
                    indicator.style.fontWeight = 'bold';
                    document.body.appendChild(indicator);
                    console.log('🔴 BERIKUTNYA indicator added to DOM');

                    // Simple indicator - remove after 5 seconds
                    setTimeout(() => {
                        if (indicator.parentNode) {
                            indicator.parentNode.removeChild(indicator);
                        }
                    }, 5000);
                }, nextBtnFound.coords.x, nextBtnFound.coords.y);

                // Wait for visual indicator to be visible
                console.log('📱 Waiting 5 seconds for visual indicator to flash...');
                await page.waitForTimeout(5000);

                // Now click the button - this should happen after the visual flash
                const clickResult = await page.evaluate(() => {
                    const allButtons = Array.from(document.querySelectorAll('button, [role="button"], div[role="button"], span[role="button"]'));

                    // Find the button again and click it
                    const nextBtn = allButtons.find(btn => {
                        const text = btn.textContent?.trim() || '';
                        const ariaLabel = btn.getAttribute('aria-label') || '';
                        return text.includes('Berikutnya') ||
                               text.includes('Next') ||
                               text.includes('Selanjutnya') ||
                               ariaLabel.includes('Berikutnya') ||
                               ariaLabel.includes('Next');
                    });

                    if (nextBtn) {
                        nextBtn.click();
                        return { clicked: true, text: nextBtn.textContent?.trim() };
                    }

                    return { clicked: false };
                });

                if (clickResult.clicked) {
                    console.log(`✅ SUCCESS! Element clicked "Berikutnya" button: "${clickResult.text}"`);
                    console.log('▶️ Sekarang lanjut ke halaman caption untuk klik "Kirim"');
                    console.log('');
                    await page.waitForTimeout(2000);

                    // === STEP 7: INPUT CAPTION ===
                    console.log('📝 STEP 7: Input caption...');
                    try {
                        const captionInput = await page.$('[contenteditable="true"]');
                        if (captionInput) {
                            await captionInput.click({ clickCount: 3 });
                            await captionInput.type('Test klik Berikutnya + Kirim dengan visual indicators');
                            console.log('✅ Caption inputted');
                        } else {
                            console.log('⚠️ Caption input not found');
                        }
                    } catch (error) {
                        console.log('⚠️ Caption input error:', error.message);
                    }

                    await page.waitForTimeout(2000);

                    // === STEP 8: KLIK "KIRIM" DENGAN MOUSE.CLICK ===
                    console.log('\n🖱️ STEP 8: Klik "Kirim" dengan page.mouse.click seperti permintaan...');

                    // Cari tombol "Kirim" dengan pendekatan yang lebih baik
                    const kirimResult = await page.evaluate(() => {
                        // Pencarian prioritas: cari tombol yang terlihat dan memiliki text yang benar
                        const buttons = Array.from(document.querySelectorAll('button, [role="button"], div[role="button"], span[role="button"]'));

                        console.log(`🔍 Searching for "Kirim" button among ${buttons.length} elements`);

                        const candidates = [];

                        for (let i = 0; i < buttons.length; i++) {
                            const btn = buttons[i];
                            const text = btn.textContent?.trim() || '';
                            const ariaLabel = (btn.getAttribute('aria-label') || '').trim();
                            const className = btn.className || '';
                            const style = window.getComputedStyle(btn);

                            // Skip hidden elements
                            if (style.display === 'none' || style.visibility === 'hidden' ||
                                style.opacity === '0' || btn.offsetWidth === 0 || btn.offsetHeight === 0) {
                                continue;
                            }

                            // Check for "Kirim" related text
                            if (text.includes('Kirim') || text.includes('Post') || text.includes('Bagikan') ||
                                text.includes('Share') || ariaLabel.includes('Kirim') ||
                                ariaLabel.includes('Post') || ariaLabel.includes('Bagikan') ||
                                ariaLabel.includes('Share')) {

                                const rect = btn.getBoundingClientRect();
                                const x = rect.left + rect.width / 2;
                                const y = rect.top + rect.height / 2;

                                // Hanya kandidat yang terlihat di viewport
                                if (rect.bottom > 0 && rect.right > 0 &&
                                    rect.top < window.innerHeight && rect.left < window.innerWidth &&
                                    x > 0 && y > 0) { // Pastikan koordinat positif

                                    candidates.push({
                                        x: x,
                                        y: y,
                                        text: text,
                                        ariaLabel: ariaLabel,
                                        className: className,
                                        rect: rect
                                    });
                                }
                            }
                        }

                        console.log(`✅ Found ${candidates.length} valid "Kirim" button candidates`);

                        if (candidates.length > 0) {
                            // Pilih yang paling bawah/right (biasanya tombol utama)
                            const selected = candidates.sort((a, b) => b.y - a.y)[0];
                            console.log(`🎯 Selected: "${selected.text}" at (${Math.round(selected.x)}, ${Math.round(selected.y)})`);

                            return {
                                found: true,
                                coords: { x: selected.x, y: selected.y },
                                text: selected.text,
                                debug: `Selected from ${candidates.length} candidates`
                            };
                        }

                        // Fallback: cari semua tombol yang terlihat dan pilih yang kanan bawah
                        const allVisibleButtons = buttons
                            .filter(btn => {
                                const rect = btn.getBoundingClientRect();
                                const style = window.getComputedStyle(btn);
                                return rect.width > 0 && rect.height > 0 &&
                                       style.display !== 'none' &&
                                       style.visibility !== 'hidden' &&
                                       rect.bottom > 0 && rect.top < window.innerHeight &&
                                       rect.x > 0 && rect.y > 0; // Koordinat positif
                            })
                            .map(btn => ({
                                btn: btn,
                                rect: btn.getBoundingClientRect(),
                                text: btn.textContent?.trim() || '',
                                className: btn.className || ''
                            }))
                            .sort((a, b) => b.rect.left - a.rect.left); // Sort kanan ke kiri

                        if (allVisibleButtons.length > 0) {
                            const fallbackBtn = allVisibleButtons[0];
                            const rect = fallbackBtn.rect;
                            const x = rect.left + rect.width / 2;
                            const y = rect.top + rect.height / 2;

                            console.log(`🔄 Fallback: Using rightmost button "${fallbackBtn.text}"`);
                            console.log(`📍 Fallback coordinates: (${Math.round(x)}, ${Math.round(y)})`);

                            return {
                                found: true,
                                coords: { x, y },
                                text: fallbackBtn.text || 'rightmost button',
                                fallback: true
                            };
                        }

                        // Last resort: log semua yang ada untuk debugging
                        console.log('🔍 DEBUG: Semua buttons found:');
                        buttons.slice(0, 10).forEach((btn, i) => {
                            const rect = btn.getBoundingClientRect();
                            console.log(`${i}: "${btn.textContent?.trim()}" (${rect.left}, ${rect.top}) visible: ${rect.width > 0}`);
                        });

                        return { found: false };
                    });

                    if (!kirimResult.found) {
                        console.log('❌ Tombol "Kirim" tidak ditemukan!');
                        console.log('🛑 Test stopped - tidak bisa lanjut ke klik "Kirim"');
                        return;
                    }

                    console.log(`✅ Tombol "Kirim" ditemukan: "${kirimResult.text}"`);
                    console.log(`📍 Koordinat: (${Math.round(kirimResult.coords.x)}, ${Math.round(kirimResult.coords.y)})`);

                    // GUNAKAN KOORDINAT FIXING SEPERTI DIMINTA USER: await page.mouse.click(800, 550);
                    console.log('\n🖱️ MOUSE.CLICK untuk "KIRIM" - Menggunakan koordinat fixing 800, 550...');

                    const fixedX = 700;
                    const fixedY = 750;

                    console.log(`🎯 Using FIXED coordinates: (${fixedX}, ${fixedY}) - bisa diubah manual`);

                    // Add visual indicator SOLID (TIDAK FLASH) di lokasi fixed coordinates
                    await page.evaluate((x, y) => {
                        const indicator = document.createElement('div');
                        indicator.id = 'kirim-indicator-solid';
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
                        indicator.style.boxShadow = '0 0 20px rgba(0, 128, 0, 1)'; // Solid glow
                        indicator.style.color = 'white';
                        indicator.style.fontSize = '12px';
                        indicator.style.fontWeight = 'bold';
                        indicator.style.display = 'flex';
                        indicator.style.alignItems = 'center';
                        indicator.style.justifyContent = 'center';
                        indicator.style.transform = 'scale(1)'; // No flash scaling
                        indicator.style.opacity = '1'; // Full opacity
                        indicator.textContent = 'KIRIM';
                        document.body.appendChild(indicator);

                    console.log('🟢 KIRIM indicator added');
                    }, fixedX, fixedY);

                    // Clean click
                    console.log('Clicking "Kirim" button...');

                    console.log('⏳ Waiting for indicator...');
                    await page.waitForTimeout(7000);

                    console.log('🖱️ Clicking "Kirim" button once...');

                    await page.mouse.click(700, 750);

                    console.log('✅ Button clicked successfully!');

                    console.log('🎉 TEST COMPLETE!');
                    console.log('   ✅ "Berikutnya" clicked with element click');
                    console.log('   ✅ Caption inputted');
                    console.log('   ✅ "Kirim" clicked with mouse.click');

                    console.log('');
                    console.log('Check if test was successful:');
                    console.log('   - Red "BERIKUTNYA" circle flashes then disappears');
                    console.log('   - Green "KIRIM" circle flashes then disappears');
                    console.log('   - Browser processes the upload');

                    await page.waitForTimeout(2000);

                    console.log('Screenshot skipped');

                } else {
                    console.log('❌ FAILED: Could not click "Berikutnya" button');
                }

            } else {
                console.log('❌ Failed to find "Berikutnya" button');
            }

        } catch (error) {
            console.log('❌ Error during "Berikutnya" click:', error.message);
        }

        // SUCCESS: Keep browser open for verification
        console.log('\n🔍 Browser tetap terbuka untuk verifikasi!');
        console.log('📍 Jika "Berikutnya" berhasil diklik, Anda akan melihat form caption input');
        console.log('⏹️ Tekan Ctrl+C untuk menutup');

        // Keep browser open and wait indefinitely
        await new Promise(() => {});

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        // DON'T close browser here - user wants to verify
    }
}

if (require.main === module) {
    testBerikutnyaOnly().catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testBerikutnyaOnly };
