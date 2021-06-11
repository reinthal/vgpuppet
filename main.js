// Dependencies
const puppeteer = require('puppeteer-extra');
const nodemailer = require('nodemailer');
const config = require("./config")


// Initialization
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());

// Configs
const liveWebPage = config.PAGE;

var mailOptions = {
    from: config.USER,
    to: config.USER,
    subject: '[VG Scraper Bot]',
    text: ''
};

const transporter = nodemailer.createTransport({
    host: config.HOST,
    port: config.PORT,
    auth: {
        user: config.USER,
        pass: config.PASSWORD
    }
});

(async() => {
    const browser = await puppeteer.launch(); //{ headless: false, slowMo: 500 }
    const page = await browser.newPage();
    await page.goto(liveWebPage);
    let bookableTimes = await page.waitForSelector(config.SELECTOR_BOOKABLE_TIMES)
    if (bookableTimes == null) {
        console.log(`[${now}]: Something went wrong when fetching webpage. Did layout Change?`)
    } else {

        const places = await page.$$eval("h3", elements => {
            return elements.map(item => item.textContent)
        });
        const links = await page.$$eval("h3", elements => {
            return elements.map(item => item.parentElement.nextElementSibling.firstElementChild.firstElementChild.href)
        });
        const availability = await page.$$eval("h3", elements => {
            return elements.map(item => item.parentElement.nextElementSibling.firstElementChild.lastElementChild.textContent)
        });

        if (places.length == 0) {
            console.log(`No available times found`)
        } else {

            for (var c = 0; c < places.length; c++) {
                mailOptions.text += `link: ${links[c]}\n`;
                mailOptions.text += `place: ${places[c]}\n`;
                mailOptions.text += `availability: ${availability[c]}\n`;
                mailOptions.text += "###\n";
            }
            transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });

        }
    }

    await browser.close();

})();