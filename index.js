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

    // 👇 Manually trigger the search to load results
    const searchBtn = await page.$('button:has-text("Search")');
    if (searchBtn) {
      await searchBtn.click();
      console.log('🔍 Clicked Search button to load results...');
    } else {
      throw new Error('❌ Search button not found.');
    }

    // ✅ Wait for search results to load
    await page.waitForSelector('article h3 a', { timeout: 20000 });

    // ✅ Extract tender titles and URLs
    const tenders = await page.$$eval('article h3 a', (links) => {
      return links.map(link => ({
        title: link.textContent.trim(),
        url: link.href
      }));
    });

    console.log(`📦 Extracted ${tenders.length} tenders`);
    console.log('🔹 Sample:', tenders[0]);

    // Save to file
    fs.writeFileSync('tenders.json', JSON.stringify(tenders, null, 2));
    console.log('✅ Saved all tenders to tenders.json');

    await browser.close();
    process.exit(0);

  } catch (err) {
    console.error('❌ Error occurred:', err.message);
    await browser.close();
    process.exit(1);
  }
})();
