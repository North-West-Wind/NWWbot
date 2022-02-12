import * as Discord from "discord.js";
import * as DCBots from "discord-user-bots";
import { color } from "../../function.js";
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { run } from "../../helpers/puppeteer.js";
import { Page } from "puppeteer-core";
import { globalClient as client } from "../../common.js";

var clientU: DCBots.Client;

class KrunkerCommand implements SlashCommand {
    name = "krunker";
    description = "Connects to the Krunker.io API and display stats.";
    aliases = ["kr"];
    usage = "<subcommand>";
    args = 1;
    category = 7;
    subcommands = ["stats", "server", "changelog"];
    subdesc = ["Displays the stats of a Krunker player.", "Shows all available Krunker servers.", "Fetches the changelog of Krunker."];
    subusage = ["<subcommand> <username>", "<subcommand> [search]", "<subcommand> [version]"];

    options = [
        {
            type: "SUB_COMMAND",
            name: "stats",
            description: "Display the stats of a Krunker player.",
            options: [
                {
                    type: "STRING",
                    name: "username",
                    description: "The username of the player.",
                    required: true
                }
            ]
        },
        {
            type: "SUB_COMMAND",
            name: "server",
            description: "Show all available Krunker servers.",
            options: [
                {
                    type: "STRING",
                    name: "search",
                    description: "The name of the game."
                }
            ]
        },
        {
            type: "SUB_COMMAND",
            name: "changelog",
            description: "Fetch the changelog of Krunker.",
            options: [
                {
                    type: "STRING",
                    name: "version",
                    description: "The version of changelog to fetch."
                }
            ]
        }
    ];

    constructor() {
        this.initClientU();
    }

    async execute(interaction: NorthInteraction) {
        const sub = interaction.options.getSubcommand();
        if (sub === "stats") {
            const msg = <Discord.Message> await interaction.reply({ content: "Loading servers...", fetchReply: true });
            await this.stats(msg, interaction.options.getString("username"));
        } else if (sub === "server") {
            const msg = <Discord.Message> await interaction.reply({ content: "Loading servers...", fetchReply: true });
            await this.server(msg, interaction.options.getString("search") || null, interaction.user);
        } else if (sub === "changelog") {
            const msg = <Discord.Message> await interaction.reply({ content: "Loading changelogs...",  fetchReply: true });
            await this.changelog(msg, interaction.options.getString("version") || null, interaction.user);
        }
    }

    async run(message: NorthMessage, args: string[]) {
        switch (args[0]) {
            case "stats":
                var msg = await message.channel.send("Loading stats...");
                await this.stats(msg, args.slice(1).join(" "));
                break;
            case "server":
                var msg = await message.channel.send("Loading servers...");
                await this.server(msg, args.slice(1).join(" "), message.author);
                break;
            case "changelog":
                var msg = await message.channel.send("Loading changelogs...");
                await this.changelog(msg, args.slice(1).join(" "), message.author);
                break;
            default:
                await this.stats(msg, args.join(" "));
        }
    }

    async stats(msg: Discord.Message, username: string) {
        await clientU.send(process.env.CHANNEL_U, { content: `${process.env.TOP_SECRET_STRING} ${username}` });
        const res = await (<Discord.TextChannel> await msg.client.channels.fetch(process.env.CHANNEL_U)).awaitMessages({ max: 1, time: 10000, filter: m => m.author.id == process.env.GBID });
        if (!res.first()) return await msg.edit("Failed to acquire user stats!");
        const mesg = res.first();
        msg.delete().catch(() => { });
        if (mesg.embeds?.length) return await msg.channel.send("The user does not exist!");
        if (!mesg.attachments?.size) return await msg.channel.send("Failed to acquire user stats!");
        await msg.channel.send({ attachments: [new Discord.MessageAttachment(mesg.attachments.first().url, `stats-${username}.png`)] });
    }

    async server(msg: Discord.Message, search: string, author: Discord.User) {
        try {
            const servers = await this.getServers();
            if (servers.error) throw new Error(servers.message);
            var official = [];
            var custom = [];
            if (!search) {
                official = servers.games.filter(x => !x[4].cs);
                custom = servers.games.filter(x => x[4].cs);
            } else {
                official = servers.games.filter(x => (x[4].i.includes(search) || x[0].includes(search)) && !x[4].cs);
                custom = servers.games.filter(x => (x[4].i.includes(search) || x[0].includes(search)) && x[4].cs);
            }
            if (official.length < 1 && custom.length < 1) return msg.edit("No server was found!");
            official.sort(function (a, b) {
                var nameA = a[0];
                var nameB = b[0];
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
            custom.sort(function (a, b) {
                var nameA = a[0];
                var nameB = b[0];
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
            const allEmbeds = [];
            const officialPage = Math.ceil(official.length / 25);
            const customPage = Math.ceil(custom.length / 25);
            const officialColor = color();
            const customColor = color();
            for (let i = 0; i < officialPage; i++) {
                var str = "";
                for (let j = i * 25; j < i * 25 + 25; j++) if (official[j]) str += `${j + 1}. **[${official[j][4].i}](https://krunker.io/?game=${official[j][0]})** - **${official[j][0].match(/(\b[A-Z][A-Z]+|\b[A-Z]\b)/g)[0]} ${official[j][2]}/${official[j][3]}**\n`
                str += `\nReact with 🎲 to get a random official game!\nReact with 🔗 to get a random official game in the specified region!\nReact with ⏩ to warp to a page!`
                const em = new Discord.MessageEmbed()
                    .setTitle(`Official Games (${i + 1}/${officialPage})`)
                    .setColor(officialColor)
                    .setDescription(str)
                    .setTimestamp()
                    .setFooter({ text: `There are ${officialPage} pages for official games.`, iconURL: client.user.displayAvatarURL() });
                allEmbeds.push(em);
            }
            for (let i = 0; i < customPage; i++) {
                var str = "";
                for (let j = i * 25; j < i * 25 + 25; j++) if (custom[j]) str += `${j + 1}. **[${custom[j][4].i}](https://krunker.io/?game=${custom[j][0]})** - **${custom[j][0].match(/(\b[A-Z][A-Z]+|\b[A-Z]\b)/g)[0]} ${custom[j][2]}/${custom[j][3]}**\n`
                str += `\nReact with 🎲 to get a random custom game!\nReact with 🔗 to get a random custom game in the specified region!\nReact with ⏩ to warp to a page!`
                const em = new Discord.MessageEmbed()
                    .setTitle(`Custom Games (${i + 1}/${customPage})`)
                    .setColor(customColor)
                    .setDescription(str)
                    .setTimestamp()
                    .setFooter({ text: `There are ${customPage} pages for custom games.`, iconURL: client.user.displayAvatarURL() });
                allEmbeds.push(em);
            }
            await msg.edit({ embeds: [allEmbeds[0]] });

            var s = 0;
            await msg.react("🎲");
            await msg.react("🔗");
            await msg.react("⏩");
            await msg.react("⏮");
            await msg.react("◀");
            await msg.react("▶");
            await msg.react("⏭");
            await msg.react("⏹");
            var collector = msg.createReactionCollector({
                filter: (reaction, user) => (["🎲", "🔗", "⏩", "◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) && user.id === author.id),
                idle: 60000
            });
            const linkEmbed = new Discord.MessageEmbed()
                .setColor(color())
                .setTitle("Random Game Generator")
                .setTimestamp()
                .setFooter({ text: "Please decide within 30 seconds.", iconURL: client.user.displayAvatarURL() });
            const pageWarp = new Discord.MessageEmbed()
                .setColor(color())
                .setTitle("Krunker Server Browser")
                .setDescription("Enter the page number to warp to that page.")
                .setTimestamp()
                .setFooter({ text: "Please decide within 30 seconds.", iconURL: client.user.displayAvatarURL() });
            collector.on("collect", async function (reaction, user) {
                reaction.users.remove(user.id).catch(() => {});
                switch (reaction.emoji.name) {
                    case "🎲":
                        if (s > officialPage - 1) msg.channel.send(`https://krunker.io/?game=${custom[Math.floor(Math.random() * custom.length)][0]}`);
                        else msg.channel.send(`https://krunker.io/?game=${official[Math.floor(Math.random() * official.length)][0]}`);
                        break;
                    case "🔗":
                        var options = [];
                        if (s > officialPage - 1) options = Array.from(new Set(custom.map(x => x[0].split(":")[0])));
                        else options = Array.from(new Set(official.map(x => x[0].split(":")[0])));
                        linkEmbed.setDescription(`Available regions:\n**${options.join("\n")}**\n\nPlease type the region in the channel.`);
                        await msg.edit({ embeds: [linkEmbed] });
                        const collected = await msg.channel.awaitMessages({ filter: m => m.author.id === author.id,  max: 1, time: 30000 });
                        if (collected && collected.first()) await collected.first().delete();
                        if (collected.first().content && options.includes(collected.first().content.split(/ +/)[0].toUpperCase())) {
                            const region = options.find(x => x === collected.first().content.split(/ +/)[0].toUpperCase());
                            var games = [];
                            if (s > officialPage - 1) games = custom.filter(x => x[0].startsWith(region));
                            else games = official.filter(x => x[0].startsWith(region));
                            msg.channel.send(`https://krunker.io/?game=${games[Math.floor(Math.random() * games.length)][0]}`);
                        }
                        await msg.edit({embeds: [allEmbeds[s]]});
                        break;
                    case "⏩":
                        await msg.edit({ embeds: [pageWarp] });
                        const collected1 = await msg.channel.awaitMessages({ filter: m => m.author.id === author.id,  max: 1, time: 30000 });
                        if (collected1 && collected1.first()) await collected1.first().delete();
                        if (collected1.first().content && !isNaN(parseInt(collected1.first().content))) s = (parseInt(collected1.first().content) - 1) % allEmbeds.length;
                        await msg.edit({embeds: [allEmbeds[s]]});
                        break;
                    case "⏮":
                        s = 0;
                        await msg.edit({embeds: [allEmbeds[s]]});
                        break;
                    case "◀":
                        s -= 1;
                        if (s < 0) s = allEmbeds.length - 1;
                        await msg.edit({embeds: [allEmbeds[s]]});
                        break;
                    case "▶":
                        s += 1;
                        if (s > allEmbeds.length - 1) s = 0;
                        await msg.edit({embeds: [allEmbeds[s]]});
                        break;
                    case "⏭":
                        s = allEmbeds.length - 1;
                        await msg.edit({embeds: [allEmbeds[s]]});
                        break;
                    case "⏹":
                        collector.emit("end");
                        break;
                }
            });
            collector.on("end", async function () {
                msg.reactions.removeAll().catch(() => {});
                var random = "";
                if (s > officialPage - 1) random = (`https://krunker.io/?game=${custom[Math.floor(Math.random() * custom.length)][0]}`);
                else random = (`https://krunker.io/?game=${official[Math.floor(Math.random() * official.length)][0]}`);
                if (random.endsWith("undefined")) random = "";
                setTimeout(() => msg.edit({ content: random.length > 0 ? `Here's a random server:\n${random}` : "No server was found!", embeds: [] }).catch(() => {}), 30000);
            });
        } catch (err: any) {
            console.error(err);
            msg.edit(`<@${author.id}>, there was an error trying to show you the games!`);
        }
    }

    async changelog(msg: Discord.Message, version: string, author: Discord.User) {
        try {
            const changelogs = await this.getChangelog();
            if (changelogs.error) throw new Error(changelogs.message);
            var changelog = {};
            changelog[Object.keys(changelogs).find(x => x.includes("UPDATE"))] = changelogs[Object.keys(changelogs).find(x => x.includes("UPDATE"))];
            if (version) {
                const key = Object.keys(changelogs).find(x => x.includes(version.toUpperCase()));
                if (!key) return await msg.channel.send("Cannot find any changelog with the supplied string!");
                changelog = {};
                changelog[key] = changelogs[key];
            }
            await msg.edit(`\`\`\`${Object.keys(changelog)[0]}\n${changelog[Object.keys(changelog)[0]].join("\n")}\`\`\``);
        } catch (err: any) {
            console.error(err);
            msg.edit(`<@${author.id}>, there was an error trying to display the changelog!`);
        }
    }

    async getServers() {
        return await run(async (page: Page) => {
            var result = { error: true, message: null };
            try {
                await page.goto("https://matchmaker.krunker.io/game-list?hostname=krunker.io");
                const element = await page.$("pre");
                const servers = JSON.parse(await (await element.getProperty('textContent')).jsonValue());
                servers.error = false;
                result = servers;
            } catch (err: any) {
                result.message = err.message;
            } finally {
                return result;
            }
        });
    }

    async getChangelog() {
        return await run(async (page: Page) => {
            var result = { error: true, message: null };
            var lines = {};
            try {
                await page.goto("https://krunker.io/docs/versions.txt");
                const element = await page.$("pre");
                const text = <string> await (await element.getProperty("textContent")).jsonValue();
                for (const x of text.split("\n\n")) {
                    const morelines = x.split("\n");
                    if (morelines[0] === "") morelines.shift();
                    lines[morelines[0]] = morelines.slice(1);
                }
            } catch (err: any) {
                result.message = err.message;
            } finally {
                return result.error ? result : lines;
            }
        })
    }

    initClientU() {
        clientU = new DCBots.Client(process.env.TOKEN_U);
    }
}

const cmd = new KrunkerCommand();
export default cmd;