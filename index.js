const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.tenders.gov.au/Search/AtmAdvancedSearch?Category=43', {
      waitUntil: 'domcontentloaded'
    });

    console.log('✅ Page loaded');

    const tenders = await page.$$eval('article', articles =>
      articles.map(article => {
        const title = article.querySelector('p.lead')?.innerText.trim();
        const agency = article.querySelector('dd:nth-of-type(2)')?.innerText.trim();
        const category = article.querySelector('dd:nth-of-type(3)')?.innerText.trim();
        return { title, agency, category };
      })
    );

    console.log('📄 Extracted tenders:', JSON.stringify(tenders, null, 2));
    await browser.close();
    process.exit(0); // ✅ Success
  } catch (err) {
    console.error('❌ Error occurred:', err);
    process.exit(1); // ❌ Error
  }
})();
