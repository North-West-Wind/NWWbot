import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { validMSURL, requestStream, nodeStreamToString, color, requestYTDLStream, createEmbedScrolling } from "../../function.js";
import { run } from "../../helpers/puppeteer.js";
import { muse, museSearch } from "musescore-metadata";
import * as Discord from "discord.js";
import sanitize from "sanitize-filename";
import PDFKit from "pdfkit";
import fetch from "node-fetch";
import { globalClient as client } from "../../common.js";
import { Page } from 'puppeteer-core';
import SVGtoPDF from "svg-to-pdfkit";
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
}

class MusescoreCommand implements FullCommand {
    name = "musescore";
    description = "Gets information of a MuseScore link, or searches the site, and downloads if requested.";
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
        if (!validMSURL(score)) return await this.search(interaction, score, <Discord.Message>await interaction.fetchReply());
        await this.metadata(interaction, score, <Discord.Message>await interaction.fetchReply());
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
        const em = new Discord.EmbedBuilder()
            .setColor(color())
            .setTitle(data.title)
            .setURL(data.url)
            .setThumbnail(data.thumbnails.original)
            .setDescription(`Description: **${data.description}**`)
            .addFields([
                { name: "ID", value: data.id.toString(), inline: true },
                { name: "Author", value: data.user.name, inline: true },
                { name: "Duration", value: data.duration, inline: true },
                { name: "Page Count", value: data.pages_count.toString(), inline: true },
                { name: "Date Created", value: new Date(data.date_created * 1000).toLocaleString(), inline: true },
                { name: "Date Updated", value: new Date(data.date_updated * 1000).toLocaleString(), inline: true },
                { name: `Tags [${data.tags.length}]`, value: data.tags.length > 0 ? (data.tags.join(", value: ").length > 1024 ? (data.tags.join(" ").slice(0, 1020) + "...") : data.tags.join(" ")) : "None" },
                { name: `Parts [${data.parts}]`, value: data.parts > 0 ? (data.parts_names.join(", value: ").length > 1024 ? (data.parts_names.join(" ").slice(0, 1020) + "...") : data.parts_names.join(" ")) : "None" }
            ])
            .setTimestamp()
            .setFooter({ text: "Have a nice day! :)", iconURL: client.user.displayAvatarURL() });
        //if (data.is_public_domain) em.setDescription(em.description + "\n\nClick 📥 to download **MP3/PDF/MIDI**\nFor **other formats (MSCZ/MXL)**, please use [Xmader's Musescore Downloader](https://github.com/LibreScore/dl-musescore)")
        msg = await msg.edit({ content: null, embeds: [em] });
        /*if (!data.is_public_domain)*/ return;
        await msg.react("📥");
        const author = (message.member?.user || await message.client.users.fetch(message.channelId)).id;
        const collected = await msg.awaitReactions({ filter: (r, u) => r.emoji.name === "📥" && u.id === author, max: 1, time: 30000 });
        await msg.reactions.removeAll().catch(() => { });
        if (collected && collected.first()) {
            try {
                try {
                    let mesg = await message.channel.send("Generating MP3...");
                    const mp3 = await this.getMP3(url);
                    try {
                        if (mp3.error) throw new Error(mp3.message);
                        let res;
                        if (mp3.url.startsWith("https://www.youtube.com/embed/")) {
                            const ytid = mp3.url.split("/").slice(-1)[0].split("?")[0];
                            res = await requestYTDLStream(`https://www.youtube.com/watch?v=${ytid}`, { highWaterMark: 1 << 25, filter: "audioonly", dlChunkSize: 0 });
                        } else res = (await requestStream(mp3.url)).data;
                        const att = new Discord.AttachmentBuilder(res).setName(sanitize(`${data.title}.mp3`));
                        if (!res) throw new Error("Failed to get Readable Stream");
                        else if (res.status && res.status != 200) throw new Error("Received HTTP Status Code: " + res.statusCode);
                        else await message.channel.send({ files: [att] });
                        await mesg.delete();
                    } catch (err: any) {
                        await mesg.edit(`Failed to generate MP3! \`${err.message}\``);
                    }
                    mesg = await message.channel.send("Generating PDF...");
                    const { doc, hasPDF, err } = await this.getPDF(url, data);
                    try {
                        if (!hasPDF) throw new Error(err ? err : "No PDF available");
                        const att = new Discord.AttachmentBuilder(doc).setName(sanitize(`${data.title}.pdf`));
                        await message.channel.send({ files: [att] });
                        await mesg.delete();
                    } catch (err: any) {
                        await mesg.edit(`Failed to generate PDF! \`${err.message}\``);
                    }
                    mesg = await message.channel.send("Generating MIDI...");
                    const midi = await this.getMIDI(url);
                    try {
                        if (midi.error) throw new Error(midi.err);
                        const res = await requestStream(midi.url);
                        if (!res) throw new Error("Failed to get Readable Stream");
                        else if (res.status && res.status != 200) throw new Error("Received HTTP Status Code: " + res.status);
                        const att = new Discord.AttachmentBuilder(res.data).setName(sanitize(`${data.title}.mid`));
                        await message.channel.send({ files: [att] });
                        await mesg.delete();
                    } catch (err: any) {
                        await mesg.edit(`Failed to generate MIDI! \`${err.message}\``);
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
        const results = await museSearch(args);
        let num = 0;
        const allEmbeds = [];
        for (const score of results.page.data.scores) {
            const em = new Discord.EmbedBuilder()
                .setColor(color())
                .setTitle(score.title)
                .setURL(score.url)
                .setThumbnail(score.thumbnails.original)
                .setDescription(`Description: **${score.description}**\n\nTo download, please copy the URL and use \`${message instanceof NorthMessage ? message.prefix : "/"}${this.name} <link>\``)
                .addFields([
                    { name: "ID", value: score.id.toString(), inline: true },
                    { name: "Author", value: score.user.name, inline: true },
                    { name: "Duration", value: score.duration, inline: true },
                    { name: "Page Count", value: score.pages_count.toString(), inline: true },
                    { name: "Date Created", value: new Date(score.date_created * 1000).toLocaleString(), inline: true },
                    { name: "Date Updated", value: new Date(score.date_updated * 1000).toLocaleString(), inline: true },
                    { name: `Tags [${score.tags.length}]`, value: score.tags.length > 0 ? score.tags.join(", ") : "None" },
                    { name: `Parts [${score.parts}]`, value: score.parts > 0 ? score.parts_names.join(", ") : "None" }
                ])
                .setTimestamp()
                .setFooter({ text: `Currently on page ${++num}/${results.page.data.scores.length}`, iconURL: client.user.displayAvatarURL() });
            allEmbeds.push(em);
        }
        if (allEmbeds.length < 1) return message.channel.send("No score was found!");
        await msg.delete();
        await createEmbedScrolling(message, allEmbeds);
    }

    async getMP3(url: string): Promise<{ error: boolean, url: string, message: string, timeTaken: number }> {
        return await run(async (page: Page) => {
            const result = { error: true, url: undefined, message: undefined, timeTaken: 0 };
            const start = Date.now();
            try {
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    if (["image", "font", "stylesheet", "media"].includes(req.resourceType())) req.abort();
                    else req.continue();
                });
                await page.goto(url, { waitUntil: "domcontentloaded" });
                await page.waitForSelector("circle, button[title='Toggle Play']").then(el => el.click());
                const mp3 = await page.waitForRequest(req => req.url()?.startsWith("https://s3.ultimate-guitar.com/") || req.url()?.startsWith("https://www.youtube.com/embed/"));
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

    async getMIDI(url: string) {
        return await run(async (page: Page) => {
            const result = { error: true, url: undefined, message: undefined, timeTaken: 0 };
            const start = Date.now();
            try {
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    if (["image", "font", "stylesheet", "media"].includes(req.resourceType())) req.abort();
                    else req.continue();
                });
                await page.goto(url, { waitUntil: "domcontentloaded" });
                await page.waitForSelector('button[title="Toggle Fullscreen"]').then(el => el.evaluate(ele => ele.parentElement?.parentElement?.querySelector("button")?.click()));
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
        if (!data) data = await muse(url);
        const result = { doc: null, hasPDF: false, err: null };
        let score = data.firstPage.replace(/png$/, "svg");
        var fetched = await fetch(score);
        if (!fetched.ok) {
            score = data.firstPage;
            var fetched = await fetch(score);
            if (!fetched.ok) {
                result.err = "Received Non-200 HTTP Status Code";
                return result;
            }
        }
        let pdf = [score];
        if (data.pageCount > 1) {
            const pdfapi = await run(async (page: Page) => {
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
                    const png = (<string>await (await thumb.getProperty("content")).jsonValue()).split("@")[0];
                    const svg = png.split(".").slice(0, -1).join(".") + ".svg";
                    let el;
                    try {
                        el = await page.waitForSelector(`img[src^="${svg}"]`, { timeout: 10000 });
                        pages.push(svg);
                    } catch (err: any) {
                        el = await page.waitForSelector(`img[src^="${png}"]`, { timeout: 10000 });
                        pages.push(png);
                    }
                    const height = (await el.boxModel()).height;
                    await el.hover();
                    let scrolled = 0;
                    while (pages.length < pageCount && scrolled <= pageCount) {
                        await page.mouse.wheel({ deltaY: height });
                        await page.waitForRequest(req => !!req.url().match(pattern));
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
        let hasPDF = true;
        for (let i = 0; i < pdf.length; i++) {
            const page = pdf[i];
            try {
                const ext = page.split("?")[0].split(".").slice(-1)[0];
                if (ext === "svg") try {
                    SVGtoPDF(doc, await nodeStreamToString((await requestStream(page)).data), 0, 0, { preserveAspectRatio: "xMinYMin meet" });
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
}

const cmd = new MusescoreCommand();
export default cmd;
