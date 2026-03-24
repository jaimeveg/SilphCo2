const { chromium } = require('playwright');
const cheerio = require('cheerio');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    
    await page.goto('https://rk9.gg/roster/CU02wOcwtjVNH6QdhfNE', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    const headers = $('th').map((_, el) => $(el).text().trim()).get();
    console.log('HEADERS:', headers);
    
    const firstIdx = headers.findIndex(h => h.includes('First Name'));
    const lastIdx = headers.findIndex(h => h.includes('Last Name'));
    console.log('firstIdx:', firstIdx, 'lastIdx:', lastIdx);
    
    const rows = $('tr').filter((_, el) => $(el).text().includes('Master'));
    const topRows = rows.slice(0, 3);
    for (let i = 0; i < topRows.length; i++) {
        const row = topRows[i];
        console.log(`Row ${i} length of TDs:`, $(row).find('td').length);
        const cells = $(row).find('td').map((_, el) => $(el).text().replace(/\s+/g,' ').trim()).get();
        console.log(`Cells:`, cells);
        
        let playerName = '';
        if (firstIdx >= 0 && lastIdx >= 0) {
            playerName = `${cells[firstIdx]} ${cells[lastIdx]}`;
        }
        if (!playerName) {
            playerName = $(row).find('td').eq(0).text().replace('Master Division', '').trim();
        }
        console.log(`Final Player Name:`, playerName);
    }
    
    await browser.close();
})();
