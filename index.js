const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('🌐 Navigating to AusTender...');
    await page.goto('https://www.tenders.gov.au/Search/AtmAdvancedSearch?Category=43', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForSelector('.search-results a.atm-title', { timeout: 20000 });
    console.log('✅ Page loaded');

    const tenders = await page.$$eval('.search-results a.atm-title', (links) => {
      return links.map(link => ({
        title: link.textContent.trim(),
        url: link.href
      }));
    });

    console.log(`🔗 Found ${tenders.length} tenders`);

    fs.writeFileSync('tenders.json', JSON.stringify(tenders, null, 2));
    console.log('✅ Saved all tenders to tenders.json');
    await browser.close();
    process.exit(0);

  } catch (err) {
    console.error('❌ Error occurred:', err);
    await browser.close();
    process.exit(1);
  }
})();
