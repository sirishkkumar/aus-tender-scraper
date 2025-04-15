const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('🌐 Navigating to AusTender...');
    await page.goto('https://www.tenders.gov.au/Search/AtmAdvancedSearch?Category=43', {
      waitUntil: 'domcontentloaded'
    });

    // Wait for tender results to load
    await page.waitForSelector('article h3 a', { timeout: 20000 });
    console.log('✅ Page loaded');

    // Extract tender links
    const tenderLinks = await page.$$eval('article h3 a', links =>
      links.map(link => ({
        url: link.href,
        title: link.textContent.trim()
      }))
    );

    console.log(`🔗 Found ${tenderLinks.length} tenders`);
    if (tenderLinks.length > 0) {
      console.log('📋 Sample:', tenderLinks[0]);
    }

    // Save to file
    fs.writeFileSync('tenders.json', JSON.stringify(tenderLinks, null, 2));
    console.log('✅ Saved all tenders to tenders.json');

    await browser.close();
    process.exit(0); // Success
  } catch (err) {
    console.error('❌ Error occurred:', err);
    process.exit(1); // Failure
  }
})();
