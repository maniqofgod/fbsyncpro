/**
 * Test Upload As Post dengan Visual Indicators
 * Test klik "Berikutnya" dan "Kirim" dengan visual indicators
 */

const FacebookAutomation = require('../src/modules/facebook-automation');

async function testUploadAsPost() {
    console.log('🎯 Testing Upload As Post dengan Visual Indicators');
    console.log('=' .repeat(50));

    const automation = new FacebookAutomation({
        showBrowser: true // Browser terlihat
    });

    try {
        const videoPath = 'uploads/1761728183302-896147468.mp4'; // Path video yang ada
        const fs = require('fs');

        if (!fs.existsSync(videoPath)) {
            console.log('❌ Video file tidak ditemukan:', videoPath);
            return;
        }

        const uploadData = {
            cookie: '[{"domain":".facebook.com","expirationDate":1795163428.531776,"hostOnly":false,"httpOnly":true,"name":"sb","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaIJWm8hr_IHzgvIgaq6y"},{"domain":".facebook.com","expirationDate":1795163341.643106,"hostOnly":false,"httpOnly":true,"name":"datr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"zazwaLRagBmweA2C4FRuLUe3"},{"domain":".facebook.com","expirationDate":1792807164.444735,"hostOnly":false,"httpOnly":false,"name":"c_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"100003912046246"},{"domain":".facebook.com","expirationDate":1792139451.995713,"hostOnly":false,"httpOnly":false,"name":"i_user","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"61579915261071"},{"domain":".facebook.com","expirationDate":1795163454.827026,"hostOnly":false,"httpOnly":true,"name":"ps_l","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1795163454.827201,"hostOnly":false,"httpOnly":true,"name":"ps_n","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1"},{"domain":".facebook.com","expirationDate":1761877012,"hostOnly":false,"httpOnly":false,"name":"wd","path":"/","sameSite":"lax","secure":true,"session":false,"storeId":"0","value":"1718x1270"},{"domain":".facebook.com","expirationDate":1769047164.444835,"hostOnly":false,"httpOnly":true,"name":"fr","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"1g4V8qQgsdt1TDXir.AWd4ySb-AWJC_ua-09UJsdUgiLYpkhHpyyo0kdN1uZGgUjeWR-E.Bo-t18..AAA.0.0.Bo-t18.AWdbibHtNe4qfTG_Si_pLW4RUtg"},{"domain":".facebook.com","expirationDate":1792807164.444881,"hostOnly":false,"httpOnly":true,"name":"xs","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"33%3A1e_0HMbiYCiQVg%3A2%3A1760603427%3A-1%3A-1%3A%3AAcW8ZB0-1AjHWswnbdPBJR8w2DTr0CP0IUaHwg72gg"}]',
            pageId: '61579915261071',
            videoPath: videoPath,
            caption: 'Test upload sebagai post dengan visual indicators untuk klik Berikutnya dan Kirim'
        };

        console.log('🔄 Memulai upload sebagai post...');
        console.log(`📹 Video: ${videoPath}`);
        console.log(`📝 Caption: ${uploadData.caption}`);

        const result = await automation.uploadAsPost(uploadData);

        if (result.success) {
            console.log('\n🎉 SUCCESS! Upload berhasil!');
            console.log(`🔗 URL: ${result.url}`);
            console.log(`📝 Message: ${result.message}`);
        } else {
            console.log('\n❌ GAGAL! Upload gagal!');
            console.log(`🔗 URL akhir: ${result.url}`);
            console.log(`⚠️ Error: ${result.error}`);
        }

        // Browser tetap terbuka
        console.log('\n🔍 Browser tetap terbuka untuk verifikasi manual...');
        console.log('⏹️ Tekan Ctrl+C untuk menutup (jangan close browser sampai yakin benar)');

        // Keep browser open
        await new Promise(() => {});

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        // Jangan close browser di finally
        console.log('Browser tetap terbuka...');
    }
}

if (require.main === module) {
    testUploadAsPost().catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testUploadAsPost };
