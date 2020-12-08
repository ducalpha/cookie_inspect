/* Fetch and extract text or HTML from a URL.
 * Use a headless Chrome web browser. */
const fs = require('fs-extra');
const filenamifyUrl = require('filenamify-url');
const puppeteer = require('puppeteer');

require('dotenv').config({path: process.cwd() + '/../.env'})
const data_dir = process.env.DATA_DIR + '/tmp_crawl/';
console.log('outout to: ' + data_dir);
fs.ensureDirSync(data_dir);

const timeoutMs = 20 * 1000;

(async () => { // async wrapper to use await.
    url = 'https://pubmatic.com/legal/opt-out/';
    const use_headless = true;
    const browser = await puppeteer.launch({ headless: use_headless });

    const page = await browser.newPage();

    // Clear cookies to avoid interferences between domains.
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies') // There was an error when putting in the try-catch block.

    try {
        response = await page.goto(url, { timeout: timeoutMs, waitUntil: 'networkidle2' });
        if (response.status() !== 200)
            return;

        const html = await page.content();
        const website = response.url();
        const out_file = data_dir + filenamifyUrl(website, {replacement: '_'}) + '.html';
        fs.outputFileSync(out_file, html, 'utf8');

        // Save iframes.
        const iframes = page.mainFrame().childFrames();
        for (i = 0; i < iframes.length; ++i) {
            const iframe = iframes[i];
            const iframe_url = iframe.url();
            const out_file = data_dir + filenamifyUrl(website, {replacement: '_'}) + '_iframe_' + filenamifyUrl(iframe_url, {replacement: '_'}) + '.html';
            const iframe_html = await iframe.content();
            fs.outputFileSync(out_file, iframe_html, 'utf8');
        }
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
