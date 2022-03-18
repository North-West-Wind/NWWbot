import * as Discord from "discord.js";
import { color, getFetch, msgOrRes, wait } from "../../function.js";
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { run } from "../../helpers/puppeteer.js";
import { Page } from "puppeteer-core";
import { globalClient as client } from "../../common.js";
const AbortController = globalThis.AbortController;

class KrunkerCommand implements SlashCommand {
    name = "krunker";
    description = "Connects to the Krunker.io API and display stats.";
    aliases = ["kr"];
    usage = "<subcommand>";
    args = 1;
    category = 7;
    subcommands = ["stats", "clan", "server", "changelog"];
    subdesc = ["Displays the stats of a Krunker player.", "Display the stats of a Krunker clan.", "Shows all available Krunker servers.", "Fetches the changelog of Krunker."];
    subusage = ["<subcommand> <username>", "<subcommand> <name>", "<subcommand> [search]", "<subcommand> [version]"];

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
            name: "clan",
            description: "Display the stats of a Krunker clan.",
            options: [
                {
                    type: "STRING",
                    name: "name",
                    description: "The name of the clan.",
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

    async execute(interaction: NorthInteraction) {
        await interaction.deferReply();
        const sub = interaction.options.getSubcommand();
        switch (interaction.options.getSubcommand()) {
            case "stats": return await this.stats(interaction, interaction.options.getString("username"));
            case "clan": return await this.clan(interaction, interaction.options.getString("name"));
            case "server": return await this.server(interaction, interaction.options.getString("search") || null, interaction.user);
            case "changelog": return await this.changelog(interaction, interaction.options.getString("version") || null, interaction.user);
        }
    }

    async run(message: NorthMessage, args: string[]) {
        switch (args[0]) {
            case "stats": return await this.stats(message, args.slice(1).join(" "));
            case "clan": return await this.clan(message, args.slice(1).join(" "));
            case "server": return await this.server(message, args.slice(1).join(" "), message.author);
            case "changelog": return await this.changelog(message, args.slice(1).join(" "), message.author);
            default: return await this.stats(message, args.join(" "));
        }
    }

    async stats(message: Discord.Message | Discord.CommandInteraction, username: string) {
        return await msgOrRes(message, "This feature is currently disabled.");
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, 10000);
        try {
            const res = await getFetch()("http://192.168.1.29:4269/api/krunker/profile/" + username, { signal: controller.signal });
            if (!res.ok) throw new Error();
            const json = <any> await res.json();
            if (!json.found) return await msgOrRes(message, "The user does not exist!");
            await msgOrRes(message, { files: [new Discord.MessageAttachment(json.url)] });
        } catch (err) {
            await msgOrRes(message, "Failed to acquire user stats!");
        } finally {
            clearTimeout(timeout);
        }
    }

    async clan(message: Discord.Message | Discord.CommandInteraction, name: string) {
        return await msgOrRes(message, "This feature is currently disabled.");
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, 10000);
        try {
            const res = await getFetch()("http://192.168.1.29:4269/api/krunker/clan/" + name, { signal: controller.signal });
            if (!res.ok) throw new Error();
            const json = <any> await res.json();
            if (!json.found) return await msgOrRes(message, "The clan does not exist!");
            await msgOrRes(message, { files: [new Discord.MessageAttachment(json.url)] });
        } catch (err) {
            await msgOrRes(message, "Failed to acquire clan stats!");
        } finally {
            clearTimeout(timeout);
        }
    }

    async server(message: Discord.Message | Discord.CommandInteraction, search: string, author: Discord.User) {
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
            if (official.length < 1 && custom.length < 1) return await msgOrRes(message, "No server was found!");
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
            var s = 0;
            const row1 = new Discord.MessageActionRow()
                .addComponents(new Discord.MessageButton({ emoji: "⏮", customId: "first", style: "PRIMARY" }))
                .addComponents(new Discord.MessageButton({ emoji: "◀", customId: "previous", style: "PRIMARY" }))
                .addComponents(new Discord.MessageButton({ emoji: "▶", customId: "next", style: "PRIMARY" }))
                .addComponents(new Discord.MessageButton({ emoji: "⏭", customId: "last", style: "PRIMARY" }))
                .addComponents(new Discord.MessageButton({ emoji: "⏹", customId: "quit", style: "DANGER" }));
            const row2 = new Discord.MessageActionRow()
                .addComponents(new Discord.MessageButton({ label: "Random Game", emoji: "🎲", customId: "random", style: "SECONDARY" }))
                .addComponents(new Discord.MessageButton({ label: "Random Regional", emoji: "🔗", customId: "region", style: "SECONDARY" }))
                .addComponents(new Discord.MessageButton({ label: "Page Warp", emoji: "⏩", customId: "warp", style: "SECONDARY" }));
            const msg = await msgOrRes(message, { embeds: [allEmbeds[0]], components: [row1, row2] });
            var collector = msg.createMessageComponentCollector({
                filter: (interaction) => interaction.user.id === author.id,
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
            collector.on("collect", async function (interaction: Discord.MessageComponentInteraction) {
                switch (interaction.customId) {
                    case "random":
                        if (s > officialPage - 1) await message.channel.send(`https://krunker.io/?game=${custom[Math.floor(Math.random() * custom.length)][0]}`);
                        else await message.channel.send(`https://krunker.io/?game=${official[Math.floor(Math.random() * official.length)][0]}`);
                        break;
                    case "region":
                        var options = [];
                        if (s > officialPage - 1) options = Array.from(new Set(custom.map(x => x[0].split(":")[0])));
                        else options = Array.from(new Set(official.map(x => x[0].split(":")[0])));
                        linkEmbed.setDescription(`Available regions:\n**${options.join("\n")}**\n\nPlease type the region in the channel.`);
                        await interaction.update({ embeds: [linkEmbed], components: [] });
                        const collected = await message.channel.awaitMessages({ filter: m => m.author.id === author.id, max: 1, time: 30000 });
                        if (collected && collected.first()) await collected.first().delete();
                        if (collected.first().content && options.includes(collected.first().content.split(/ +/)[0].toUpperCase())) {
                            const region = options.find(x => x === collected.first().content.split(/ +/)[0].toUpperCase());
                            var games = [];
                            if (s > officialPage - 1) games = custom.filter(x => x[0].startsWith(region));
                            else games = official.filter(x => x[0].startsWith(region));
                            await message.channel.send(`https://krunker.io/?game=${games[Math.floor(Math.random() * games.length)][0]}`);
                        }
                        await msg.edit({ embeds: [allEmbeds[s]], components: [row1, row2] });
                        break;
                    case "warp":
                        await interaction.update({ embeds: [pageWarp], components: [] });
                        const collected1 = await msg.channel.awaitMessages({ filter: m => m.author.id === author.id, max: 1, time: 30000 });
                        if (collected1 && collected1.first()) await collected1.first().delete();
                        if (collected1.first().content && !isNaN(parseInt(collected1.first().content))) s = (parseInt(collected1.first().content) - 1) % allEmbeds.length;
                        await msg.edit({ embeds: [allEmbeds[s]], components: [row1, row2] });
                        break;
                    case "⏮":
                        s = 0;
                        await interaction.update({ embeds: [allEmbeds[s]] });
                        break;
                    case "◀":
                        s -= 1;
                        if (s < 0) s = allEmbeds.length - 1;
                        await interaction.update({ embeds: [allEmbeds[s]] });
                        break;
                    case "▶":
                        s += 1;
                        if (s > allEmbeds.length - 1) s = 0;
                        await interaction.update({ embeds: [allEmbeds[s]] });
                        break;
                    case "⏭":
                        s = allEmbeds.length - 1;
                        await interaction.update({ embeds: [allEmbeds[s]] });
                        break;
                    case "⏹":
                        collector.emit("end");
                        break;
                }
            });
            collector.on("end", async function () {
                try {
                    await msg.edit({ components: [] });
                    var random = "";
                    if (s > officialPage - 1) random = (`https://krunker.io/?game=${custom[Math.floor(Math.random() * custom.length)][0]}`);
                    else random = (`https://krunker.io/?game=${official[Math.floor(Math.random() * official.length)][0]}`);
                    if (random.endsWith("undefined")) random = "";
                    await wait(30000);
                    if (random.length) msg.edit(`Here's a random server:\n<${random}>`).catch(() => { });
                } catch (err) { }
            });
        } catch (err: any) {
            console.error(err);
            await msgOrRes(message, `There was an error trying to show you the games!`, true);
        }
    }

    async changelog(message: Discord.Message | Discord.CommandInteraction, version: string, author: Discord.User) {
        try {
            const changelogs = await this.getChangelog();
            if (changelogs.error) throw new Error(changelogs.message);
            var changelog = {};
            changelog[Object.keys(changelogs).find(x => x.includes("UPDATE"))] = changelogs[Object.keys(changelogs).find(x => x.includes("UPDATE"))];
            if (version) {
                const key = Object.keys(changelogs).find(x => x.includes(version.toUpperCase()));
                if (!key) return await msgOrRes(message, "Cannot find any changelog with the supplied string!");
                changelog = {};
                changelog[key] = changelogs[key];
            }
            await msgOrRes(message, `\`\`\`${Object.keys(changelog)[0]}\n${changelog[Object.keys(changelog)[0]].join("\n")}\`\`\``);
        } catch (err: any) {
            console.error(err);
            await msgOrRes(message, `There was an error trying to display the changelog!`, true);
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
                const text = <string>await (await element.getProperty("textContent")).jsonValue();
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
}

const cmd = new KrunkerCommand();
export default cmd;