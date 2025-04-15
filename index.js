const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Go to AusTender ATM Search Page for Category 43
    await page.goto('https://www.tenders.gov.au/Search/AtmAdvancedSearch?Category=43', {
      waitUntil: 'domcontentloaded',
    });

    console.log('✅ Page loaded');

    // ✅ Correct selector to get all tender detail page links
    const tenderLinks = await page.$$eval('.search-results a.atm-title', links =>
      links.map(link => link.href)
    );

    console.log(`🔗 Found ${tenderLinks.length} tenders`);

    const tenders = [];

    // Limit to first 5 for testing
    for (const url of tenderLinks.slice(0, 5)) {
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

    // Save to file
    fs.writeFileSync('tenders.json', JSON.stringify(tenders, null, 2));
    console.log('✅ Saved all tenders to tenders.json');

    await browser.close();
    process.exit(0); // ✅ Success
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1); // ❌ Failure
  }
})();
