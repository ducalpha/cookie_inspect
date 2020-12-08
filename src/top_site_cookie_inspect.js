/*  Inspect cookies of top sites.
 */
const fs = require('fs-extra');
const csv_parse = require('csv-parse/lib/sync')

require('dotenv').config({path: process.cwd() + '/../.env'});
const data_dir = process.env.DATA_DIR + '/top_site_cookie_inspect/'
fs.ensureDirSync(data_dir)

const filenamifyUrl = require('filenamify-url');

const puppeteer = require('puppeteer');

const top_site_file = process.env.DATA_DIR + '/similarweb_top_sites/combine_top_traffic_sites_us.tsv'
const timeoutMs = 20 * 1000;
const top_sites = csv_parse(fs.readFileSync(top_site_file), {delimiter: '\t', columns: true});
const site_list = top_sites.slice(0, 1000);
console.log("num website:" + site_list.length);

(async () => { // async wrapper to use await.
    for (i = 0; i < site_list.length; ++i) { // could not use sync function in forEach for await.
        domain = site_list[i]['Domain']; // [0]
        console.log(domain);

        url = 'https://' + domain;  // many domains not support https; erro network connection reset irs.gov.
        const use_headless = true;
        const browser = await puppeteer.launch({ headless: use_headless });

        const page = await browser.newPage();

        // Clear cookies to avoid interferences between domains.
        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCookies') // There was an error when putting in the try-catch block.

        try {
            response = await page.goto(url, { timeout: timeoutMs, waitUntil: 'networkidle2' });
            if (response.status() !== 200)
                continue;

            const all_browser_cookies = (await client.send('Network.getAllCookies')).cookies;
            website = response.url();
            cookie_data = {
                website: website,
                cookies: all_browser_cookies
            };
            out_file = data_dir + filenamifyUrl(website, {replacement: '_'}) + '.json'
            fs.writeJsonSync(out_file, cookie_data, {spaces: 4})
        } catch(e) {
            console.log("Error: " + e.toString());
            continue
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
    }
})();