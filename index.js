const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Go to AusTender Category 43 Search
    await page.goto('https://www.tenders.gov.au/Search/AtmAdvancedSearch?Category=43', {
      waitUntil: 'domcontentloaded',
    });

    // ✅ Wait for the tender list to fully appear
    await page.waitForSelector('.search-results a.atm-title', { timeout: 15000 });
    console.log('✅ Page loaded');

    // ✅ Get all tender URLs
    const tenderLinks = await page.$$eval('.search-results a.atm-title', links =>
      links.map(link => link.href)
    );

    console.log(`🔗 Found ${tenderLinks.length} tenders`);

    const tenders = [];

    for (const url of tenderLinks.slice(0, 5)) { // Only scrape 5 tenders for now
      const tenderPage = await browser.newPage();
      await tenderPage.goto(url, { waitUntil: 'domcontentloaded' });

      const getFieldText = async (label) => {
        const elHandle = await tenderPage.$(`xpath=//div[contains(., "${label}")]/following-sibling::div`);
        if (!elHandle) return '';
        return (await elHandle.textContent()).trim();
      };

      const tender = {
        url,
        title: await tenderPage.$eval('h1', el => el.textContent.trim()),
        atmId: await getFieldText('ATM ID:'),
        agency: await getFieldText('Agency:'),
        category: await getFieldText('Category:'),
        closeDate: await getFieldText('Close Date & Time:'),
        publishDate: await getFieldText('Publish Date:'),
        location: await getFieldText('Location:'),
      };

      console.log('📋 Extracted:', tender.title);
      tenders.push(tender);
      await tenderPage.close();
    }

    // Save to file (and print it in logs)
    const json = JSON.stringify(tenders, null, 2);
    fs.writeFileSync('tenders.json', json);
    console.log('📦 Final JSON:\n', json);
    console.log('✅ Saved all tenders to tenders.json');

    await browser.close();
    process.exit(0); // ✅ Done
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
