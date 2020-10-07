const rp = require("request-promise-native");
const cheerio = require("cheerio");
const rs = require("request-stream");
const Discord = require("discord.js");
const { validMSURL } = require("../function.js");
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');

module.exports = {
    name: "musescore",
    description: "Get information of a MuseScore link, or search the site.",
    usage: "<link | keywords>",
    category: 7,
    aliases: ["muse"],
    async execute(message, args) {
        if (!args[0]) return message.channel.send("Please provide a link or a keyword." + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);
        if (!validMSURL(args.join(" "))) return await this.search(message, args);
        try {
            var response = await rp({ uri: args.join(" "), resolveWithFullResponse: true });
            if (Math.floor(response.statusCode / 100) !== 2) return message.channel.send(`Received HTTP status code ${response.statusCode} when fetching data.`);
            var body = response.body;
        } catch (err) {
            return message.reply("there was an error trying to fetch data of the score!");
        }
        var data = this.parseBody(body);
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
            .addField(`Tags [${data.tags.length}]`, data.tags.join(", "))
            .addField(`Parts [${data.parts.length}]`, data.parts.join(", "))
            .setTimestamp()
            .setFooter("Have a nice day! :)");
        const doc = new PDFDocument();
        for (let i = 0; i < data.pageCount; i++) {
            SVGtoPDF(doc, await rp(`https://musescore.com/static/musescore/scoredata/gen/${data.important}/score_${i}.svg`), 0, 0, { preserveAspectRatio: "xMinYMin meet" });
            if (i + 1 < data.pageCount) doc.addPage();
        }
        doc.end();
        rs(data.mp3, (err, res) => {
            if (err) return message.channel.send(em);
            const attachment = new Discord.MessageAttachment(res, `${data.title.replace(/ +/g, "_")}.mp3`);
            const pdf = new Discord.MessageAttachment(doc, `${data.title.replace(/ +/g, "_")}.pdf`);
            message.channel.send([attachment, pdf, em]);
        });
    },
    parseBody(body) {
        var $ = cheerio.load(body);
        var meta = $('meta[property="og:image"]')[0];
        var image = meta.attribs.content;
        var important = image.split("/").slice(7, 12).join("/");
        var mp3 = `https://nocdn.musescore.com/static/musescore/scoredata/gen/${important}/score.mp3`;
        var store = $('div.js-store')[0].attribs["data-content"];
        var data = JSON.parse(store).store.page.data;
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
        return { id, title, thumbnail, parts, url, user, duration, pageCount, created, updated, description, tags, mp3, important };
    },
    async search(message, args) {
        try {
            var response = await rp({ uri: `https://musescore.com/sheetmusic?text=${encodeURIComponent(args.join(" "))}`, resolveWithFullResponse: true });
            if (Math.floor(response.statusCode / 100) !== 2) return message.channel.send(`Received HTTP status code ${response.statusCode} when fetching data.`);
            var body = response.body;
        } catch (err) {
            return message.reply("there was an error trying to search for scores!");
        }
        var $ = cheerio.load(body);
        var store = $("div.js-store")[0].attribs["data-content"];
        var data = JSON.parse(store);
        const allEmbeds = [];
        const importants = [];
        const mp3s = [];
        var num = 0;
        var scores = data.store.page.data.scores;
        for (const score of scores) {
            try {
                var response = await rp({ uri: score.share.publicUrl, resolveWithFullResponse: true });
                if (Math.floor(response.statusCode / 100) !== 2) return message.channel.send(`Received HTTP status code ${response.statusCode} when fetching data.`);
                body = response.body;
            } catch (err) {
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
            importants.push({ important: data.important, pages: data.pageCount });
            mp3s.push(data.mp3);
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
        var msg = await message.channel.send(
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
                    const doc = new PDFDocument();
                    for (let i = 0; i < importants[s].pages; i++) {
                        SVGtoPDF(doc, await rp(`https://musescore.com/static/musescore/scoredata/gen/${importants[s].important}/score_${i}.svg`), 0, 0, { preserveAspectRatio: "xMinYMin meet" });
                        if (i + 1 < importants[s].pages) doc.addPage();
                    }
                    doc.end();
                    rs(mp3s[s], (err, res) => {
                        if (err) return message.channel.send("Failed to send attachments.");
                        const attachment = new Discord.MessageAttachment(res, `${allEmbeds[s].title.replace(/ +/g, "_")}.mp3`);
                        const pdf = new Discord.MessageAttachment(doc, `${allEmbeds[s].title.replace(/ +/g, "_")}.pdf`);
                        message.channel.send([attachment, pdf]);
                    });
                    break;
            }
        });
        collector.on("end", function () {
            msg.reactions.removeAll().catch(console.error);
        });
    }
}