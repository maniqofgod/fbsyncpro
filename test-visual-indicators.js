const FacebookAutomation = require('./src/modules/facebook-automation');

async function testVideoPostVisualIndicators() {
    console.log('🧪 Testing Visual Indicators for Video Post Upload...');

    // Gunakan showBrowser: true agar terlihat
    const automation = new FacebookAutomation({
        showBrowser: true,
        headless: false
    });

    // Dummy upload data untuk test (ganti dengan yang valid)
    const testData = {
        cookie: 'c_user=1234567890; xs=ABCDEFGH123456789; datr=HIJKLMNOP; sb=QWERTYUI; fr=ASDFGHJKL;',
        pageId: '123456789',
        videoPath: './uploads/1761717422298-826214373.mp4', // File pertama yang ada
        caption: 'Test upload dengan visual indicators'
    };

    try {
        console.log('📹 Starting video post upload test...');
        console.log('📍 Upload data:', {
            videoPath: testData.videoPath,
            pageId: testData.pageId,
            caption: testData.caption
        });

        const result = await automation.uploadAsPost(testData);

        console.log('✅ Test completed');
        console.log('📊 Result:', result);

        // Jangan tutup browser otomatis - biarkan user melihat hasil

    } catch (error) {
        console.error('❌ Test failed:', error.message);

        // Jangan tutup browser agar bisa di-debug

    } finally {
        console.log('🎯 Browser tetap terbuka untuk verifikasi manual');
        console.log('⏹️ Katakan "sukses" jika ingin menutup browser');
        console.log('🔄 Atau tekan Ctrl+C untuk force close');
    }
}

// Jalankan test jika file ini dijalankan langsung
if (require.main === module) {
    testVideoPostVisualIndicators();
}

module.exports = testVideoPostVisualIndicators;
