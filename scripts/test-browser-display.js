/**
 * Test script to verify browser display functionality
 * Tests that showBrowser option correctly controls headless mode
 */

const FacebookAutomation = require('../src/modules/facebook-automation');

async function testBrowserDisplay() {
    console.log('🧪 Testing browser display functionality...\n');

    // Test 1: showBrowser = false (should be headless)
    console.log('Test 1: showBrowser = false (should run headless)');
    const fbAuto1 = new FacebookAutomation({ showBrowser: false });
    console.log('Options:', fbAuto1.options);

    if (fbAuto1.options.headless === "new") {
        console.log('✅ PASS: headless is "new" when showBrowser is false');
    } else {
        console.log('❌ FAIL: headless is not "new" when showBrowser is false');
    }

    // Test 2: showBrowser = true (should show browser)
    console.log('\nTest 2: showBrowser = true (should show browser)');
    const fbAuto2 = new FacebookAutomation({ showBrowser: true });
    console.log('Options:', fbAuto2.options);

    if (fbAuto2.options.headless === false) {
        console.log('✅ PASS: headless is false when showBrowser is true');
    } else {
        console.log('❌ FAIL: headless is not false when showBrowser is true');
    }

    // Test 3: updateOptions functionality
    console.log('\nTest 3: updateOptions functionality');
    const fbAuto3 = new FacebookAutomation({ showBrowser: false });
    console.log('Initial options:', fbAuto3.options);

    fbAuto3.updateOptions({ showBrowser: true });
    console.log('After update to showBrowser: true', fbAuto3.options);

    if (fbAuto3.options.showBrowser === true && fbAuto3.options.headless === false) {
        console.log('✅ PASS: updateOptions correctly sets showBrowser=true and headless=false');
    } else {
        console.log('❌ FAIL: updateOptions did not correctly update options');
    }

    // Test 4: updateOptions from true to false
    console.log('\nTest 4: updateOptions from showBrowser=true to false');
    fbAuto3.updateOptions({ showBrowser: false });
    console.log('After update to showBrowser: false', fbAuto3.options);

    if (fbAuto3.options.showBrowser === false && fbAuto3.options.headless === "new") {
        console.log('✅ PASS: updateOptions correctly sets showBrowser=false and headless="new"');
    } else {
        console.log('❌ FAIL: updateOptions did not correctly update from true to false');
    }

    console.log('\n🎉 Browser display tests completed!');
}

// Run the test
if (require.main === module) {
    testBrowserDisplay();
}

module.exports = testBrowserDisplay;
