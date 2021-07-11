const puppeteer = require("puppeteer");
var browser, timeout;
async function getBrowser() {
    if (!browser) browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu', "--proxy-server='direct://'", '--proxy-bypass-list=*'],
      headless: false
    });
    return browser;
}

module.exports = {
    async run(cb) {
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        }
        const b = await getBrowser();
        const page = await b.newPage();
        const result = await cb(page);
        page.close();
        timeout = setTimeout(() => {
            browser.close();
            browser = undefined;
        }, 10000);
        return result;
    }
}