const puppeteer = require("puppeteer");
var browser, lastRun;
async function getBrowser() {
    if (!browser) browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu', "--proxy-server='direct://'", '--proxy-bypass-list=*'],
      headless: false
    });
    lastRun = Date.now();
    setTimeout(() => {
        if (Date.now() - lastRun < 1800000) return;
        browser.close();
        browser = undefined;
    }, 1800000);
    return browser;
}

module.exports = {
    async run(cb) {
        const b = await getBrowser();
        const page = await b.newPage();
        const result = await cb(page);
        page.close();
        return result;
    }
}