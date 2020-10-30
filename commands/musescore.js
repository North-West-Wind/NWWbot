const rp = require("request-promise-native");
const cheerio = require("cheerio");
const rs = require("request-stream");
const Discord = require("discord.js");
const { validMSURL, findValueByPrefix } = require("../function.js");
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const puppeteer = require("puppeteer");
const options = {
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't works in Windows
        '--disable-gpu'
    ],
    headless: true
};
async function getMP3(link) {
    const browser = await puppeteer.launch(options);
    var result = { error: true };
    try {
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() === 'font') request.abort();
            else request.continue();
        });
        await page.goto(link, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("button#playerBtnExprt");
        await page.$eval("button#playerBtnExprt", play => play.click());
        const mp3 = await page.waitForRequest(req => req.url().startsWith("https://s3.ultimate-guitar.com"));
        result.url = mp3.url();
        result.error = false;
    } catch (err) {
        result.message = err.message;
    } finally {
        await browser.close();
    }
    return result;
}

module.exports = {
    name: "musescore",
    description: "Get information of a MuseScore link, or search the site.",
    usage: "<link | keywords>",
    category: 7,
    aliases: ["muse"],
    args: 1,
    async execute(message, args) {
        if (!validMSURL(args.join(" "))) return await this.search(message, args);
        var msg = await message.channel.send("Loading score...");
        try {
            const response = await rp({ uri: args.join(" "), resolveWithFullResponse: true });
            if (Math.floor(response.statusCode / 100) !== 2) return message.channel.send(`Received HTTP status code ${response.statusCode} when fetching data.`);
            var data = this.parseBody(response.body);
        } catch (err) {
            console.realError(err);
            return message.reply("there was an error trying to fetch data of the score!");
        }
        const em = new Discord.MessageEmbed()
            .setColor(Math.floor(Math.random() * Math.pow(256, 3)))
            .setTitle(data.title)
            .setURL(data.url)
            .setThumbnail(data.thumbnail)
            .setDescription(`Description: **${data.description}**\n\nClick 📥 to download the sheetmusic`)
            .addField("ID", data.id, true)
            .addField("Author", data.user.name, true)
            .addField("Duration", data.duration, true)
            .addField("Page Count", data.pageCount, true)
            .addField("Date Created", new Date(data.created * 1000).toLocaleString(), true)
            .addField("Date Updated", new Date(data.updated * 1000).toLocaleString(), true)
            .addField(`Tags [${data.tags.length}]`, data.tags.length > 0 ? data.tags.join(", ") : "None")
            .addField(`Parts [${data.parts.length}]`, data.parts.length > 0 ? data.parts.join(", ") : "None")
            .setTimestamp()
            .setFooter("Have a nice day! :)");
        msg = await msg.edit({ content: "", embed: em });
        await msg.react("📥");
        const collected = await msg.awaitReactions((r, u) => r.emoji.name === "📥" && u.id === message.author.id, { max: 1, time: 30000, errors: ["time"] });
        msg.reactions.removeAll().catch(console.error);
        if (collected && collected.first()) {
            var mesg = await message.author.send("Generating files...");
            try {
                const doc = new PDFDocument();
                for (let i = 0; i < data.pageCount; i++) {
                    SVGtoPDF(doc, await rp(`https://musescore.com/static/musescore/scoredata/gen/${data.important}/score_${i}.svg`), 0, 0, { preserveAspectRatio: "xMinYMin meet" });
                    if (i + 1 < data.pageCount) doc.addPage();
                }
                doc.end();
                const mp3 = await getMP3(args.join(" "));
                if (mp3.error) throw new Error(mp3.message);
                rs(mp3.url, async (err, res) => {
                    if (err) return await mesg.edit("Failed to generate files!");
                    await mesg.delete();
                    const attachment = new Discord.MessageAttachment(res, `${data.title.replace(/ +/g, "_")}.mp3`);
                    const pdf = new Discord.MessageAttachment(doc, `${data.title.replace(/ +/g, "_")}.pdf`);
                    message.author.send([attachment, pdf]);
                });
            } catch (err) {
                console.error(err);
                await mesg.edit("Failed to generate files!");
            }
        }
    },
    parseBody(body) {
        const $ = cheerio.load(body);
        const meta = $('meta[property="og:image"]')[0];
        const image = meta.attribs.content;
        const important = image.split("/").slice(7, 12).join("/");
        const stores = Array.from($('div[class^="js-"]'));
        const found = stores.find(x => x.attribs && x.attribs.class && x.attribs.class.match(/^js-\w+$/) && findValueByPrefix(x.attribs, "data-"));
        console.realLog(found);
        const store = findValueByPrefix(found.attribs, "data-");
        const data = JSON.parse(store).store.page.data;
        const id = data.score.id;
        const title = data.score.title;
        const thumbnail = data.score.thumbnails.large;
        const parts = data.score.parts_names;
        const url = data.score.share.publicUrl;
        const user = data.score.user;
        const duration = data.score.duration;
        const pageCount = data.score.pages_count;
        const created = data.score.date_created;
        const updated = data.score.date_updated;
        const description = data.score.truncated_description;
        const tags = data.score.tags;
        return { id, title, thumbnail, parts, url, user, duration, pageCount, created, updated, description, tags, important };
    },
    async search(message, args) {
        try {
            var response = await rp({ uri: `https://musescore.com/sheetmusic?text=${encodeURIComponent(args.join(" "))}`, resolveWithFullResponse: true });
            if (Math.floor(response.statusCode / 100) !== 2) return message.channel.send(`Received HTTP status code ${response.statusCode} when fetching data.`);
            var body = response.body;
        } catch (err) {
            return message.reply("there was an error trying to search for scores!");
        }
        var msg = await message.channel.send("Loading scores...");
        var $ = cheerio.load(body);
        const stores = Array.from($('div[class^="js-"]'));
        const store = findValueByPrefix(stores.find(x => x.attribs && x.attribs.class && x.attribs.class.match(/^js-\w+$/)).attribs, "data-");
        var data = JSON.parse(store);
        const allEmbeds = [];
        const importants = [];
        var num = 0;
        var scores = data.store.page.data.scores;
        for (const score of scores) {
            try {
                var response = await rp({ uri: score.share.publicUrl, resolveWithFullResponse: true });
                if (Math.floor(response.statusCode / 100) !== 2) return message.channel.send(`Received HTTP status code ${response.statusCode} when fetching data.`);
                body = response.body;
            } catch (err) {
                await msg.delete();
                return message.reply("there was an error trying to fetch data of the score!");
            }
            data = this.parseBody(body);
            const em = new Discord.MessageEmbed()
                .setColor(Math.floor(Math.random() * Math.pow(256, 3)))
                .setTitle(data.title)
                .setURL(data.url)
                .setThumbnail(data.thumbnail)
                .setDescription(data.description)
                .addField("ID", data.id, true)
                .addField("Author", data.user.name, true)
                .addField("Duration", data.duration, true)
                .addField("Page Count", data.pageCount, true)
                .addField("Date Created", new Date(data.created * 1000).toLocaleString(), true)
                .addField("Date Updated", new Date(data.updated * 1000).toLocaleString(), true)
                .addField(`Tags [${data.tags.length}]`, data.tags.length > 0 ? data.tags.join(", ") : "None")
                .addField(`Parts [${data.parts.length}]`, data.parts.length > 0 ? data.parts.join(", ") : "None")
                .setTimestamp()
                .setFooter(`Currently on page ${++num}/${scores.length}`, message.client.user.displayAvatarURL());
            allEmbeds.push(em);
            importants.push({ important: data.important, pages: data.pageCount, url: score.share.publicUrl });
        }
        if (allEmbeds.length < 1) return message.channel.send("No score was found!");
        const filter = (reaction, user) => {
            return (
                ["◀", "▶", "⏮", "⏭", "⏹", "📥"].includes(
                    reaction.emoji.name
                ) && user.id === message.author.id
            );
        };

        var s = 0;
        await msg.delete();
        msg = await message.channel.send(
            allEmbeds[0]
        );

        await msg.react("📥");
        await msg.react("⏮");
        await msg.react("◀");
        await msg.react("▶");
        await msg.react("⏭");
        await msg.react("⏹");
        var collector = await msg.createReactionCollector(
            filter,
            { idle: 60000, errors: ["time"] }
        );

        collector.on("collect", async function (reaction, user) {
            reaction.users.remove(user.id);
            switch (reaction.emoji.name) {
                case "⏮":
                    s = 0;
                    msg.edit(allEmbeds[s]);
                    break;
                case "◀":
                    s -= 1;
                    if (s < 0) {
                        s = allEmbeds.length - 1;
                    }
                    msg.edit(allEmbeds[s]);
                    break;
                case "▶":
                    s += 1;
                    if (s > allEmbeds.length - 1) {
                        s = 0;
                    }
                    msg.edit(allEmbeds[s]);
                    break;
                case "⏭":
                    s = allEmbeds.length - 1;
                    msg.edit(allEmbeds[s]);
                    break;
                case "⏹":
                    collector.emit("end");
                    break;
                case "📥":
                    var mesg = await message.author.send("Generating files...");
                    try {
                        const doc = new PDFDocument();
                        for (let i = 0; i < importants[s].pages; i++) {
                            SVGtoPDF(doc, await rp(`https://musescore.com/static/musescore/scoredata/gen/${importants[s].important}/score_${i}.svg`), 0, 0, { preserveAspectRatio: "xMinYMin meet" });
                            if (i + 1 < importants[s].pages) doc.addPage();
                        }
                        doc.end();
                        const mp3 = await getMP3(importants[s].url);
                        if (mp3.error) throw new Error(mp3.message);
                        rs(mp3.url, async (err, res) => {
                            if (err) return await mesg.edit("Failed to generate files!");
                            const attachment = new Discord.MessageAttachment(res, `${allEmbeds[s].title.replace(/ +/g, "_")}.mp3`);
                            const pdf = new Discord.MessageAttachment(doc, `${allEmbeds[s].title.replace(/ +/g, "_")}.pdf`);
                            await mesg.delete();
                            message.author.send([attachment, pdf]);
                        });
                    } catch (err) {
                        await mesg.edit("Failed to generate files!");
                    }
                    break;
            }
        });
        collector.on("end", function () {
            msg.reactions.removeAll().catch(console.error);
        });
    },
    download: getMP3
}
