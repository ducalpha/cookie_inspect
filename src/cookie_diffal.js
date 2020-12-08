/* Fetch and extract text or HTML from a URL.
 * Use a headless Chrome web browser. */
const fs = require('fs-extra');
const filenamifyUrl = require('filenamify-url');
const puppeteer = require('puppeteer');

// require('dotenv').config({path: process.cwd() + '/../.env'})
const data_dir = './tmp_crawl/';
console.log('Outout to: ' + data_dir);
fs.ensureDirSync(data_dir);

const timeoutMs = 20 * 1000;

function delay(duration_ms) {
   return new Promise(function(resolve) { 
       setTimeout(resolve, duration_ms)
   });
}

(async () => { // async wrapper to use await.
    page_url = 'https://www.onaudience.com/opt-out'

    const use_headless = false; // true;
    const browser = await puppeteer.launch({ headless: use_headless });

    const page = await browser.newPage();

    // Clear cookies to avoid interferences between domains.
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies') // There was an error when putting in the try-catch block.

    try {
        // save pre-opt-out cookies.
        response = await page.goto(page_url, { timeout: timeoutMs, waitUntil: 'networkidle2' });
        if (response.status() !== 200)
            return;

        let all_browser_cookies = (await client.send('Network.getAllCookies')).cookies;
        website = response.url();
        cookie_data = {
            website: website,
            cookies: all_browser_cookies
        };
        out_file = data_dir + filenamifyUrl(website, {replacement: '_'}) + '_preopt.json'
        fs.writeJsonSync(out_file, cookie_data, {spaces: 4})

        // Actuate direct opt-out ctrl.
        // find the ctrl.
        opt_ctrl = await page.mainFrame().$('span[style="padding:15px 20px;"]');
        const elems = [opt_ctrl];
        // const elems = await page.mainFrame().$x('//*[@id="optOut"]/div/span/div/span');
        if (elems.length > 0) {
            opt_ctrl = elems[0];
            const text = await (await opt_ctrl.getProperty('textContent')).jsonValue();
            console.log(text);

            page.$eval('span[style="padding:15px 20px;"]', (el) => el.scrollIntoView({block: 'center'}))

            // const boundingBox = await opt_ctrl.boundingBox();
            // console.log(boundingBox);
            // await page.evaluate(() => window.scrollBy(boundingBox.x, boundingBox.y));

            await delay(5000);
            await opt_ctrl.click();
            console.log('Clicked on the opt-out control.')
            await delay(5000);
        } else {
            console.log('Opt out control not found.')
        }

        // save post-opt-out cookies.
        all_browser_cookies = (await client.send('Network.getAllCookies')).cookies;
        website = response.url();
        cookie_data = {
            website: website,
            cookies: all_browser_cookies
        };
        out_file = data_dir + filenamifyUrl(website, {replacement: '_'}) + '_postopt.json'
        fs.writeJsonSync(out_file, cookie_data, {spaces: 4})
    } catch(e) {
        console.log("Error: " + e.toString());
        return;
    } finally {
        let pages = await browser.pages();
        await Promise.all(pages.map(page =>page.close()));
        await browser.close();
    }

    // const current_url_cookies = await page.cookies();
    // const third_party_cookies = all_browser_cookies.filter(cookie => cookie.domain !== current_url_cookies[0].domain);
    // console.log(all_browser_cookies); // All Browser Cookies
    // console.log(current_url_cookies); // Current URL Cookies
    // console.log(third_party_cookies); // Third-Party Cookies
    // // Check status code.

    // if (response.status() === 200) {
    //     const title = await page.title();
    //     const html = await page.content();
    //     const renderedContent = await page.evaluate(() => new XMLSerializer().serializeToString(document.documentElement));

    //     const hrefs = await page.$$eval('a', as => as.map(a => a.href));

    //     /* Extract content */
    //     full_html = renderedContent
    //     result = {'full_html': full_html}

    //     // Parse and extract html.
    //     await mercury.parse(url, {
    //         html: Buffer.from(full_html), contentType: 'html'
    //     }).then(html_result => {
    //         result['links'] = hrefs;
    //         result['simple_html'] = html_result['content']
    //     }).catch(console.error)

    //     // Parse and extract text.
    //     await mercury.parse(url, {
    //         html: Buffer.from(full_html), contentType: 'text'
    //     }).then(text_result => {
    //         result['text_content'] = text_result['content']
    //     }).catch(console.error);

    //     console.log(JSON.stringify(result));
// } else {
//     console.log(JSON.stringify({"error": true, "message": `response code returned as ${response.status()}`}));
// }
})();
