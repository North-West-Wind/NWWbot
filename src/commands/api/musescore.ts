import * as cheerio from 'cheerio';

import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { validMSURL, requestStream, findValueByPrefix, streamToString, color, requestYTDLStream } from "../../function";
import { run } from '../../helpers/puppeteer';
import muse from "musescore-metadata";
import * as Discord from "discord.js";
import sanitize from "sanitize-filename";
import rp from "request-promise-native";
import PDFKit from "pdfkit";
import fetch from "node-fetch";
import { globalClient as client } from "../../common";
const SVGtoPDF: any = require("svg-to-pdfkit");
function PNGtoPDF(doc: PDFKit.PDFDocument, url: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const res = <any>await fetch(url).then(res => res.body);
        const chunks = [];
        res.on("data", chunk => chunks.push(chunk));
        res.on("end", () => {
            try {
                doc.image(Buffer.concat(chunks), 0, 0, { width: doc.page.width, height: doc.page.height });
                resolve();
            } catch (err: any) {
                reject(err);
            }
        });
    })
};

export async function getMP3(url: string): Promise<{ error: boolean, url: string, message: string, timeTaken: number }> {
    return await run(async (page) => {
        var result = { error: true, url: undefined, message: undefined, timeTaken: 0 };
        const start = Date.now();
        try {
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (["image", "font", "stylesheet", "media"].includes(req.resourceType())) req.abort();
                else req.continue();
            });
            await page.goto(url, { waitUntil: "domcontentloaded" });
            await page.waitForSelector("button[title='Toggle Play']").then(el => el.click());
            const mp3 = await page.waitForRequest(req => req.url().startsWith("https://s3.ultimate-guitar.com/") || req.url().startsWith("https://www.youtube.com/embed/"));
            result.url = mp3.url();
            result.error = false;
        } catch (err: any) {
            result.message = err.message;
        } finally {
            result.timeTaken = Date.now() - start;
            return result;
        }
    })
}

class MusescoreCommand implements SlashCommand {
    name = "musescore";
    description = "Get information of a MuseScore link, or search the site, and download if requested.";
    usage = "<link | keywords>";
    category = 7;
    aliases = ["muse"];
    args = 1;
    options = [{
        name: "score",
        description: "The link or name of the score.",
        required: true,
        type: "STRING"
    }];

    async execute(interaction: NorthInteraction) {
        await interaction.deferReply();
        const score = interaction.options.getString("score");
        if (!validMSURL(score)) return await this.search(interaction, score, <Discord.Message> await interaction.fetchReply());
        await this.metadata(interaction, score, <Discord.Message> await interaction.fetchReply());
    }

    async run(message: NorthMessage, args: string[]) {
        if (!validMSURL(args.join(" "))) return await this.search(message, args.join(" "), await message.channel.send("Loading scores..."));
        await this.metadata(message, args.join(" "), await message.channel.send("Loading score..."));
    }

    async metadata(message: NorthMessage | NorthInteraction, url: string, msg: Discord.Message) {
        try {
            var data = await muse(url);
        } catch (err: any) {
            console.error(err);
            return await msg.edit("There was an error trying to fetch data of the score!");
        }
        const em = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle(data.title)
            .setURL(data.url)
            .setThumbnail(data.thumbnail)
            .setDescription(`Description: **${data.description}**\n\nClick 📥 to download MP3 and PDF`)
            .addField("ID", data.id.toString(), true)
            .addField("Author", data.user.name, true)
            .addField("Duration", data.duration, true)
            .addField("Page Count", data.pageCount.toString(), true)
            .addField("Date Created", new Date(data.created * 1000).toLocaleString(), true)
            .addField("Date Updated", new Date(data.updated * 1000).toLocaleString(), true)
            .addField(`Tags [${data.tags.length}]`, data.tags.length > 0 ? (data.tags.join(", ").length > 1024 ? (data.tags.join(" ").slice(0, 1020) + "...") : data.tags.join(" ")) : "None")
            .addField(`Parts [${data.parts.length}]`, data.parts.length > 0 ? (data.parts.join(", ").length > 1024 ? (data.parts.join(" ").slice(0, 1020) + "...") : data.parts.join(" ")) : "None")
            .setTimestamp()
            .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
        msg = await msg.edit({ content: null, embeds: [em] });
        await msg.react("📥");
        const author = (message instanceof Discord.Message ? message.author : (message.member?.user ?? await message.client.users.fetch(message.channelId))).id;
        const collected = await msg.awaitReactions({ filter: (r, u) => r.emoji.name === "📥" && u.id === author,  max: 1, time: 30000 });
        await msg.reactions.removeAll().catch(() => { });
        if (collected && collected.first()) {
            try {
                try {
                    var mesg = await message.channel.send("Generating MP3...");
                    const mp3 = await getMP3(url);
                    try {
                        if (mp3.error) throw new Error(mp3.message);
                        var res;
                        if (mp3.url.startsWith("https://www.youtube.com/embed/")) {
                            const ytid = mp3.url.split("/").slice(-1)[0].split("?")[0];
                            res = await requestYTDLStream(`https://www.youtube.com/watch?v=${ytid}`, { highWaterMark: 1 << 25, filter: "audioonly", dlChunkSize: 0 });
                        } else res = (await requestStream(mp3.url)).data;
                        const att = new Discord.MessageAttachment(res, sanitize(`${data.title}.mp3`));
                        if (!res) throw new Error("Failed to get Readable Stream");
                        else if (res.statusCode && res.statusCode != 200) throw new Error("Received HTTP Status Code: " + res.statusCode);
                        else await message.channel.send({files:[att]});
                        await mesg.delete();
                    } catch (err: any) {
                        await mesg.edit(`Failed to generate MP3! \`${err.message}\``);
                    }
                    mesg = await message.channel.send("Generating PDF...");
                    const { doc, hasPDF, err } = await this.getPDF(url, data);
                    try {
                        if (!hasPDF) throw new Error(err ? err : "No PDF available");
                        const att = new Discord.MessageAttachment(doc, sanitize(`${data.title}.pdf`));
                        await message.channel.send({files:[att]});
                        await mesg.delete();
                    } catch (err: any) {
                        await mesg.edit(`Failed to generate PDF! \`${err.message}\``);
                    }
                    mesg = await message.channel.send("Generating MSCZ...");
                    const mscz = await this.getMSCZ(data);
                    try {
                        if (mscz.error) throw new Error(mscz.err);
                        const res = await requestStream(mscz.url);
                        if (!res) throw new Error("Failed to get Readable Stream");
                        else if (res.status && res.status != 200) throw new Error("Received HTTP Status Code: " + res.status);
                        const att = new Discord.MessageAttachment(res.data, sanitize(`${data.title}.mscz`));
                        await message.channel.send({files:[att]});
                        await mesg.delete();
                    } catch (err: any) {
                        await mesg.edit(`Failed to generate MSCZ! \`${err.message}\``);
                        await message.channel.send(`However, you may still be able to download it from this link:\n${mscz.url}`);
                    }
                } catch (err: any) {
                    console.error(err);
                    await message.reply("there was an error trying to send the files!");
                }
            } catch (err: any) {
                console.error(err);
                await message.channel.send("Failed to generate files!");
            }
        }
    }

    async search(message: NorthMessage | NorthInteraction, args: string, msg: Discord.Message) {
        try {
            const response = await rp({ uri: `https://musescore.com/sheetmusic?text=${encodeURIComponent(args)}`, resolveWithFullResponse: true });
            if (Math.floor(response.statusCode / 100) !== 2) return message.channel.send(`Received HTTP status code ${response.statusCode} when fetching data.`);
            var body = response.body;
        } catch (err: any) {
            console.error(err);
            return await message.reply("There was an error trying to search for scores!");
        }
        const author = (message instanceof Discord.Message ? message.author : (message.member?.user ?? await message.client.users.fetch(message.channelId))).id;
        var $ = cheerio.load(body);
        const stores = Array.from($('div[class^="js-"]'));
        const store = findValueByPrefix(stores.find((x: any) => x.attribs?.class?.match(/^js-\w+$/)), "data-");
        var data = JSON.parse(store);
        console.log(data);
        const allEmbeds = [];
        const importants = [];
        var num = 0;
        var scores = data.store.page.data.scores;
        for (const score of scores) {
            data = muse(score.share.publicUrl);
            const em = new Discord.MessageEmbed()
                .setColor(color())
                .setTitle(data.title)
                .setURL(data.url)
                .setThumbnail(data.thumbnail)
                .setDescription(`Description: **${data.description}**\n\nTo download, please copy the URL and use \`${message instanceof NorthMessage ? message.prefix : "/"}${this.name} <link>\``)
                .addField("ID", data.id, true)
                .addField("Author", data.user.name, true)
                .addField("Duration", data.duration, true)
                .addField("Page Count", data.pageCount, true)
                .addField("Date Created", new Date(data.created * 1000).toLocaleString(), true)
                .addField("Date Updated", new Date(data.updated * 1000).toLocaleString(), true)
                .addField(`Tags [${data.tags.length}]`, data.tags.length > 0 ? data.tags.join(", ") : "None")
                .addField(`Parts [${data.parts.length}]`, data.parts.length > 0 ? data.parts.join(", ") : "None")
                .setTimestamp()
                .setFooter(`Currently on page ${++num}/${scores.length}`, client.user.displayAvatarURL());
            allEmbeds.push(em);
            importants.push({ important: data.important, pages: data.pageCount, url: score.share.publicUrl, title: data.title, id: data.id });
        }
        if (allEmbeds.length < 1) return message.channel.send("No score was found!");
        const filter = (reaction, user) => (["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) && user.id === author);
        var s = 0;
        await msg.delete();
        msg = await message.channel.send({embeds: [allEmbeds[0]]});
        await msg.react("⏮");
        await msg.react("◀");
        await msg.react("▶");
        await msg.react("⏭");
        await msg.react("⏹");
        var collector = msg.createReactionCollector({ filter, idle: 60000 });

        collector.on("collect", async function (reaction, user) {
            reaction.users.remove(user.id);
            switch (reaction.emoji.name) {
                case "⏮":
                    s = 0;
                    msg.edit({embeds: [allEmbeds[s]]});
                    break;
                case "◀":
                    s -= 1;
                    if (s < 0) s = allEmbeds.length - 1;
                    msg.edit({embeds: [allEmbeds[s]]});
                    break;
                case "▶":
                    s += 1;
                    if (s > allEmbeds.length - 1) s = 0;
                    msg.edit({embeds: [allEmbeds[s]]});
                    break;
                case "⏭":
                    s = allEmbeds.length - 1;
                    msg.edit({embeds: [allEmbeds[s]]});
                    break;
                case "⏹":
                    collector.emit("end");
                    break;
            }
        });
        collector.on("end", function () {
            msg.reactions.removeAll().catch(() => { });
        });
    }

    async getMIDI(url) {
        return await run(async (page) => {
            var result = { error: true, url: undefined, message: undefined, timeTaken: 0 };
            const start = Date.now();
            try {
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    if (["image", "font", "stylesheet", "media"].includes(req.resourceType())) req.abort();
                    else req.continue();
                });
                await page.goto(url, { waitUntil: "domcontentloaded" });
                await page.waitForSelector("button[hasaccess]").then(el => el.click());
                const midi = await page.waitForResponse(res => {
                    const url = res.url();
                    return url.startsWith("https://musescore.com/api/jmuse") && url.includes("type=midi");
                });
                result.url = (await midi.json())?.info?.url;
                result.error = false;
            } catch (err: any) {
                result.message = err.message;
            } finally {
                result.timeTaken = Date.now() - start;
                return result;
            }
        })
    }

    async getPDF(url, data) {
        if (!data) data = muse(url);
        var result = { doc: null, hasPDF: false, err: null };
        var score = data.firstPage.replace(/png$/, "svg");
        var fetched = await fetch(score);
        if (!fetched.ok) {
            score = data.firstPage;
            var fetched = await fetch(score);
            if (!fetched.ok) {
                result.err = "Received Non-200 HTTP Status Code";
                return result;
            }
        }
        var pdf = [score];
        if (data.pageCount > 1) {
            const pdfapi = await run(async (page) => {
                const result = { error: true, pdf: [], message: null, timeTaken: 0 };
                const start = Date.now();
                const pageCount = data.pageCount;
                try {
                    const pattern = /^(https?:\/\/)?s3\.ultimate-guitar\.com\/musescore\.scoredata\/g\/\w+\/score\_\d+\.svg/;
                    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
                    await page.setRequestInterception(true);
                    const pages = result.pdf ? result.pdf : [];
                    await page.setViewport({
                        width: 1280,
                        height: 720
                    });
                    page.on('request', (req) => {
                        req.continue();
                        if (req.url().match(pattern)) pages.push(req.url());
                    });
                    await page.goto(url, { waitUntil: "domcontentloaded" });
                    const thumb = await page.waitForSelector("meta[property='og:image']");
                    var png = (await (await thumb.getProperty("content")).jsonValue()).split("@")[0];
                    var svg = png.split(".").slice(0, -1).join(".") + ".svg";
                    var el;
                    try {
                        el = await page.waitForSelector(`img[src^="${svg}"]`, { timeout: 10000 });
                        pages.push(svg);
                    } catch (err: any) {
                        el = await page.waitForSelector(`img[src^="${png}"]`, { timeout: 10000 });
                        pages.push(png);
                    }
                    const height = (await el.boxModel()).height;
                    await el.hover();
                    var scrolled = 0;
                    while (pages.length < pageCount && scrolled <= pageCount) {
                        await page.mouse.wheel({ deltaY: height });
                        await page.waitForRequest(req => req.url().match(pattern));
                        scrolled++;
                    }
                    result.pdf = pages;
                    result.error = false;
                } catch (err: any) {
                    result.message = err.message;
                } finally {
                    result.timeTaken = Date.now() - start;
                    return result;
                }
            });
            if (pdfapi.error) return { doc: undefined, hasPDF: false, err: pdfapi.error };
            pdf = pdfapi.pdf;
        }
        const doc = new PDFKit();
        var hasPDF = true;
        for (let i = 0; i < pdf.length; i++) {
            const page = pdf[i];
            try {
                const ext = page.split("?")[0].split(".").slice(-1)[0];
                if (ext === "svg") try {
                    SVGtoPDF(doc, await streamToString(await requestStream(page)), 0, 0, { preserveAspectRatio: "xMinYMin meet" });
                } catch (err: any) {
                    SVGtoPDF(doc, await fetch(page).then(res => res.text()), 0, 0, { preserveAspectRatio: "xMinYMin meet" });
                }
                else await PNGtoPDF(doc, page);
                if (i + 1 < data.pageCount) doc.addPage();
            } catch (err: any) {
                result.err = err.message;
                hasPDF = false;
                break;
            }
        }
        doc.end();
        return { doc: doc, hasPDF: hasPDF, err: null };
    }
    async getMSCZ(data) {
        // Thank you to Xmader/musescore-downloader!
        const IPNS_KEY = 'QmSdXtvzC8v8iTTZuj5cVmiugnzbR1QATYRcGix4bBsioP';
        const IPNS_RS_URL = `https://ipfs.io/api/v0/dag/resolve?arg=/ipns/${IPNS_KEY}`;
        const r = await fetch(IPNS_RS_URL);
        if (!r.ok) return { error: true, err: "Received HTTP Status Code: " + r.status };
        const json = <any> await r.json();
        const mainCid = json.Cid['/'];

        const url = `https://ipfs.infura.io:5001/api/v0/block/stat?arg=/ipfs/${mainCid}/${data.id % 20}/${data.id}.mscz`;
        const r0 = await fetch(url);
        if (!r0.ok) return { error: true, err: "Received HTTP Status Code: " + r.status };
        const cidRes = <any> await r0.json();
        const cid = cidRes.Key
        if (!cid) {
            const err = cidRes.Message
            if (err.includes('no link named')) return { error: true, err: "Score not in dataset" };
            else return { error: true, err: err };
        }
        const msczUrl = `https://ipfs.infura.io/ipfs/${cid}`;
        const r1 = await fetch(msczUrl);
        if (!r1.ok) return { error: true, err: "Received HTTP Status Code: " + r.status };
        return { error: false, url: msczUrl };
    }
}

const cmd = new MusescoreCommand();
export default cmd;