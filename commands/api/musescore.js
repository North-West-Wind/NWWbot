const rp = require("request-promise-native");
const fetch = require("fetch-retry")(require("node-fetch"), { retries: 5, retryDelay: attempt => Math.pow(2, attempt) * 1000 });
const cheerio = require("cheerio");
const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const sanitize = require("sanitize-filename");
const muse = require("musescore-metadata");
const { NorthClient } = require("../../classes/NorthClient.js");
const requestYTDLStream = (url, opts) => {
    const timeoutMS = opts.timeout && !isNaN(parseInt(opts.timeout)) ? parseInt(opts.timeout) : 30000;
    const timeout = new Promise((_resolve, reject) => setTimeout(() => reject(new Error(`YTDL video download timeout after ${timeoutMS}ms`)), timeoutMS));
    const getStream = new Promise((resolve, reject) => {
        const stream = ytdl(url, opts);
        stream.on("finish", () => resolve(stream)).on("error", err => reject(err));
    });
    return Promise.race([timeout, getStream]);
};
const { validMSURL, findValueByPrefix, streamToString, requestStream, color } = require("../../function.js");
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");
const PNGtoPDF = (doc, url) => new Promise(async (resolve, reject) => {
    const res = await fetch(url).then(res => res.body);
    const chunks = [];
    res.on("data", chunk => chunks.push(chunk));
    res.on("end", () => {
        try {
            doc.image(Buffer.concat(chunks), 0, 0, { width: doc.page.width, height: doc.page.height });
            resolve();
        } catch (err) {
            reject(err);
        }
    });
});

module.exports = {
    name: "musescore",
    description: "Get information of a MuseScore link, or search the site, and download if requested.",
    usage: "<link | keywords>",
    category: 7,
    aliases: ["muse"],
    args: 1,
    slashInit: true,
    register: () => ApplicationCommand.createBasic(module.exports).setOptions([
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "score", "The link or name of the score.").setRequired(true)
    ]),
    async slash() {
        return InteractionResponse.ackknowledge();
    },
    async postSlash(client, interaction, args) {
        args = args?.map(x => x?.value).filter(x => !!x);
        const message = await InteractionResponse.createFakeMessage(client, interaction);
        await this.execute(message, args);
    },
    async execute(message, args) {
        if (!validMSURL(args.join(" "))) return await this.search(message, args);
        var msg = await message.channel.send("Loading score...");
        try {
            var data = await muse(args.join(" "));
        } catch (err) {
            console.error(err);
            return message.reply("there was an error trying to fetch data of the score!");
        }
        const em = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle(data.title)
            .setURL(data.url)
            .setThumbnail(data.thumbnail)
            .setDescription(`Description: **${data.description}**\n\nClick 📥 to download MP3 and PDF`)
            .addField("ID", data.id, true)
            .addField("Author", data.user.name, true)
            .addField("Duration", data.duration, true)
            .addField("Page Count", data.pageCount, true)
            .addField("Date Created", new Date(data.created * 1000).toLocaleString(), true)
            .addField("Date Updated", new Date(data.updated * 1000).toLocaleString(), true)
            .addField(`Tags [${data.tags.length}]`, data.tags.length > 0 ? (data.tags.join(", ").length > 1024 ? (data.tags.join(" ").slice(0, 1020) + "...") : data.tags.join(" ")) : "None")
            .addField(`Parts [${data.parts.length}]`, data.parts.length > 0 ? (data.parts.join(", ").length > 1024 ? (data.parts.join(" ").slice(0, 1020) + "...") : data.parts.join(" ")) : "None")
            .setTimestamp()
            .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
        msg = await msg.edit({ content: "", embed: em });
        await msg.react("📥");
        const collected = await msg.awaitReactions((r, u) => r.emoji.name === "📥" && u.id === message.author.id, { max: 1, time: 30000 });
        await msg.reactions.removeAll().catch(() => { });
        if (collected && collected.first()) {
            NorthClient.storage.log(`Downloading ${args.join(" ")} ${message.guild ? `in server ${message.guild.name}` : `for user ${message.author.name}`}...`);
            try {
                try {
                    var mesg = await message.channel.send("Generating MP3...");
                    const mp3 = await this.getMP3(args.join(" "));
                    try {
                        if (mp3.error) throw new Error(mp3.message);
                        if (mp3.url.startsWith("https://www.youtube.com/embed/")) {
                            const ytid = mp3.url.split("/").slice(-1)[0].split("?")[0];
                            var res = await requestYTDLStream(`https://www.youtube.com/watch?v=${ytid}`, { highWaterMark: 1 << 25, filter: "audioonly", dlChunkSize: 0, requestOptions: { headers: { cookie: process.env.COOKIE, 'x-youtube-identity-token': process.env.YT } } });
                        } else var res = await requestStream(mp3.url);
                        const att = new Discord.MessageAttachment(res, sanitize(`${data.title}.mp3`));
                        if (!res) throw new Error("Failed to get Readable Stream");
                        else if (res.statusCode && res.statusCode != 200) throw new Error("Received HTTP Status Code: " + res.statusCode);
                        else await message.channel.send(att);
                        await mesg.delete();
                    } catch (err) {
                        await mesg.edit(`Failed to generate MP3! \`${err.message}\``);
                    }
                    mesg = await message.channel.send("Generating PDF...");
                    const { doc, hasPDF, err, pages } = await this.getPDF(args.join(" "), data);
                    try {
                        if (!hasPDF) throw new Error(err ? err : "No PDF available");
                        const att = new Discord.MessageAttachment(doc, sanitize(`${data.title}.pdf`));
                        await message.channel.send(att);
                        await mesg.delete();
                    } catch (err) {
                        await mesg.edit(`Failed to generate PDF! \`${err.message}\``);
                        if (hasPDF) {
                            const r = await fetch("https://North-API.northwestwind.repl.co/upload", { method: "post", body: JSON.stringify({ pages }), headers: { 'Content-Type': 'application/json' } });
                            if (r.ok){
                                const { id } = await r.json();
                                await message.channel.send(`But this link might work:\nhttps://North-API.northwestwind.repl.co/download?id=${id}`);
                            }
                        }
                    }
                    mesg = await message.channel.send("Generating MSCZ...");
                    const mscz = await this.getMSCZ(data);
                    try {
                        if (mscz.error) throw new Error(mscz.message);
                        const res = await requestStream(mscz.url);
                        const att = new Discord.MessageAttachment(res, sanitize(`${data.title}.mscz`));
                        if (!res) throw new Error("Failed to get Readable Stream");
                        else if (res.statusCode && res.statusCode != 200) throw new Error("Received HTTP Status Code: " + res.statusCode);
                        else await message.channel.send(att);
                        await mesg.delete();
                    } catch (err) {
                        await mesg.edit(`Failed to generate MSCZ! \`${err.message}\``);
                        await message.channel.send(`However, you may still be able to download it from this link:\n${mscz.url}`);
                    }
                    NorthClient.storage.log(`Completed download ${args.join(" ")} ${message.guild ? `in server ${message.guild.name}` : `for user ${message.author.name}`}`);
                } catch (err) {
                    NorthClient.storage.log(`Failed download ${args.join(" ")} ${message.guild ? `in server ${message.guild.name}` : `for user ${message.author.name}`}`);
                    NorthClient.storage.error(err);
                    await message.reply("there was an error trying to send the files!");
                }
            } catch (err) {
                NorthClient.storage.log(`Failed download ${args.join(" ")} ${message.guild ? `in server ${message.guild.name}` : `for user ${message.author.name}`}`);
                NorthClient.storage.error(err);
                await message.channel.send("Failed to generate files!");
            }
        }
    },
    async search(message, args) {
        try {
            const response = await rp({ uri: `https://musescore.com/sheetmusic?text=${encodeURIComponent(args.join(" "))}`, resolveWithFullResponse: true });
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
            data = muse(score.share.publicUrl);
            const em = new Discord.MessageEmbed()
                .setColor(color())
                .setTitle(data.title)
                .setURL(data.url)
                .setThumbnail(data.thumbnail)
                .setDescription(`Description: **${data.description}**\n\nTo download, please copy the URL and use \`${message.prefix}${this.name} <link>\``)
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
            importants.push({ important: data.important, pages: data.pageCount, url: score.share.publicUrl, title: data.title, id: data.id });
        }
        if (allEmbeds.length < 1) return message.channel.send("No score was found!");
        const filter = (reaction, user) => (["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) && user.id === message.author.id);
        var s = 0;
        await msg.delete();
        msg = await message.channel.send(allEmbeds[0]);
        await msg.react("⏮");
        await msg.react("◀");
        await msg.react("▶");
        await msg.react("⏭");
        await msg.react("⏹");
        var collector = await msg.createReactionCollector(
            filter,
            { idle: 60000 }
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
                    if (s < 0) s = allEmbeds.length - 1;
                    msg.edit(allEmbeds[s]);
                    break;
                case "▶":
                    s += 1;
                    if (s > allEmbeds.length - 1) s = 0;
                    msg.edit(allEmbeds[s]);
                    break;
                case "⏭":
                    s = allEmbeds.length - 1;
                    msg.edit(allEmbeds[s]);
                    break;
                case "⏹":
                    collector.emit("end");
                    break;
            }
        });
        collector.on("end", function () {
            msg.reactions.removeAll().catch(() => { });
        });
    },
    getMP3: async (url) => await (Object.getPrototypeOf(async function () { }).constructor("fetch", "url", process.env.FUNCTION3))(fetch, encodeURIComponent(url)),
    getPDF: async (url, data) => {
        if (!data) data = muse(url);
        var result = { doc: null, hasPDF: false };
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
            const pdfapi = await (Object.getPrototypeOf(async function () { }).constructor("fetch", "url", "pageCount", process.env.FUNCTION4))(fetch, url, data.pageCount);
            if (pdfapi.error) return { doc: undefined, hasPDF: false };
            pdf = pdfapi.pdf;
        }
        const doc = new PDFDocument();
        var hasPDF = true;
        for (let i = 0; i < pdf.length; i++) {
            const page = pdf[i];
            try {
                const ext = page.split("?")[0].split(".").slice(-1)[0];
                if (ext === "svg") try {
                    SVGtoPDF(doc, await streamToString(await requestStream(page)), 0, 0, { preserveAspectRatio: "xMinYMin meet" });
                } catch (err) {
                    SVGtoPDF(doc, await fetch(page).then(res => res.text()), 0, 0, { preserveAspectRatio: "xMinYMin meet" });
                }
                else await PNGtoPDF(doc, page);
                if (i + 1 < data.pageCount) doc.addPage();
            } catch (err) {
                result.err = err.message;
                hasPDF = false;
                break;
            }
        }
        doc.end();
        return { doc: doc, hasPDF: hasPDF, pages: pdf };
    },
    getMSCZ: async (data) => {
        // Credit to Xmader/musescore-downloader
        const IPNS_KEY = 'QmSdXtvzC8v8iTTZuj5cVmiugnzbR1QATYRcGix4bBsioP';
        const IPNS_RS_URL = `https://ipfs.io/api/v0/dag/resolve?arg=/ipns/${IPNS_KEY}`;
        const r = await fetch(IPNS_RS_URL);
        if (!r.ok) return { error: true, err: "Received HTTP Status Code: " + r.status };
        const json = await r.json();
        const mainCid = json.Cid['/'];

        const url = `https://ipfs.infura.io:5001/api/v0/block/stat?arg=/ipfs/${mainCid}/${data.id % 20}/${data.id}.mscz`;
        const r0 = await fetch(url);
        if (!r0.ok) return { error: true, err: "Received HTTP Status Code: " + r.status };
        const cidRes = await r0.json();
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
