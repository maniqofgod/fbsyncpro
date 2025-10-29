/**
 * Test script to test browser visibility API endpoint
 */

async function testAPIBrowserVisibility() {
    console.log('🌐 Testing browser visibility via API...\n');

    try {
        // Test the API endpoint
        const response = await fetch('http://localhost:3000/api/debug/browser-visibility', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📡 API Response:', result);

        if (result.success) {
            console.log('✅ API test successful!');
            console.log('Settings:', result.settings);
            console.log('Headless mode:', result.headlessMode === false ? 'OFF (visible)' : 'ON (hidden)');
            console.log('Screenshot saved at:', result.screenshotSaved);
        } else {
            console.log('❌ API test failed:', result.error);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run test if script is executed directly
if (typeof window === 'undefined') { // Node.js environment
    if (require.main === module) {
        testAPIBrowserVisibility().then(() => {
            console.log('\n🎉 API test script finished');
        }).catch(error => {
            console.error('\n❌ API test failed:', error);
            process.exit(1);
        });
    }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.testAPIBrowserVisibility = testAPIBrowserVisibility;
}
