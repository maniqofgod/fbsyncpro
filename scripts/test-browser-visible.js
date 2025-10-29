/**
 * Test script to verify browser is visible when showBrowser=true
 */

const FacebookAutomation = require('../src/modules/facebook-automation');

async function testVisibleBrowser() {
    console.log('🧪 Testing visible browser mode...\n');

    try {
        // Create FacebookAutomation with showBrowser=true
        console.log('Creating FacebookAutomation with showBrowser: true');
        const fbAuto = new FacebookAutomation({ showBrowser: true });

        console.log('Options:', fbAuto.options);

        // Initialize browser
        console.log('Initializing browser...');
        await fbAuto.initialize();

        console.log('✅ Browser should now be visible!');

        // Wait 10 seconds to see the browser
        console.log('📝 Browser window should appear. Waiting 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Clean up
        console.log('Cleaning up...');
        await fbAuto.close();

        console.log('✅ Test completed successfully');

    } catch (error) {
        console.error('❌ Error in test:', error);
    }
}

// Run test if called directly
if (require.main === module) {
    testVisibleBrowser().then(() => {
        console.log('🎉 Test script finished');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
}

module.exports = testVisibleBrowser;
