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

    // 🔍 Find and click the search button manually
    const buttons = await page.$$('button');
    let searchClicked = false;

    for (const btn of buttons) {
      const text = await btn.innerText();
      if (text.includes('Search')) {
        await btn.click();
        console.log('🔍 Search button clicked');
        searchClicked = true;
        break;
      }
    }

    if (!searchClicked) throw new Error('❌ Could not find the Search button');

    // ⏳ Wait for tender result links to appear
    await page.waitForSelector('article h3 a', { timeout: 20000 });
    console.log('✅ Tender list loaded');

    // 🔗 Extract links
    const tenders = await page.$$eval('article h3 a', (links) =>
      links.map(link => ({
        title: link.textContent.trim(),
        url: link.href
      }))
    );

    console.log(`📦 Found ${tenders.length} tenders`);
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
