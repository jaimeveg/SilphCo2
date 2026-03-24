import { chromium } from 'playwright';
import * as cheerio from 'cheerio';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    
    await page.goto('https://rk9.gg/roster/CU02wOcwtjVNH6QdhfNE', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Check initial rows
    let $ = cheerio.load(await page.content());
    console.log('Initial Master rows:', $('tr').filter((_, el) => $(el).text().includes('Master')).length);
    
    try {
        // Find the length select
        const selects = await page.$$('select');
        for (const select of selects) {
            const name = await select.getAttribute('name');
            if (name && name.includes('length')) {
                console.log('Found length select:', name);
                await page.selectOption(`select[name="${name}"]`, '-1');
                console.log('Selected All (-1)');
                await page.waitForTimeout(3000); // Wait for DataTables to render everything
                break;
            }
        }
    } catch (e) {
        console.error('Error selecting all:', e);
    }
    
    $ = cheerio.load(await page.content());
    const allRows = $('tr').filter((_, el) => $(el).text().includes('Master')).toArray();
    console.log('Master rows after All:', allRows.length);
    
    const standingIdx = $('th').map((_, el) => $(el).text().trim()).get().findIndex(h => h.toLowerCase().includes('standing'));
    const firstIdx = $('th').map((_, el) => $(el).text().trim()).get().findIndex(h => h.toLowerCase().includes('first name'));
    const lastIdx = $('th').map((_, el) => $(el).text().trim()).get().findIndex(h => h.toLowerCase().includes('last name'));
    
    const parsed = allRows.map((el) => {
        const tr = $(el);
        const s = parseInt(tr.find('td').eq(standingIdx).text().trim(), 10);
        return {
            standing: s,
            name: tr.find('td').eq(firstIdx).text().trim() + ' ' + tr.find('td').eq(lastIdx).text().trim()
        };
    }).filter(p => p.standing >= 1 && p.standing <= 8).sort((a,b)=>a.standing - b.standing);
    
    console.log('Final Parsed Top 8:');
    parsed.slice(0, 8).forEach(p => console.log(`#${p.standing} - ${p.name}`));
    
    await browser.close();
})();
