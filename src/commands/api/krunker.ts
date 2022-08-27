import * as Discord from "discord.js";
import { color, getFetch, milliToHumanDuration, msgOrRes, readableDateTime, roundTo, wait } from "../../function.js";
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { run } from "../../helpers/puppeteer.js";
import { Page } from "puppeteer-core";
import { globalClient as client } from "../../common.js";
import { Clan, Profile, Response } from "../../classes/Krunker.js";
import { ButtonStyle, MessageActionRowComponentBuilder, TextInputStyle } from "discord.js";

class KrunkerCommand implements FullCommand {
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

    async stats(message: Discord.Message | Discord.ChatInputCommandInteraction, username: string) {
        try {
            const res = await getFetch()("https://kr.vercel.app/api/profile?username=" + username);
            if (!res.ok) throw new Error();
            const json = <Response>await res.json();
            if (!json.success) throw new Error(json.error);
            const data = <Profile>json.data;
            const em = new Discord.EmbedBuilder()
                .setTitle(`${data.username} [${data.clan}]`)
                .setURL("https://krunker.io/social.html?p=profile&q=" + data.username)
                .setColor(color())
                .setDescription(`ID: **${data.id}**\nLevel: **${data.level}** | **${data.levelPercentage.percent}%**`)
                .addFields([
                    { name: "Kills / Deaths", value: `**${data.kills}** / **${data.deaths}**`, inline: true },
                    { name: "Wins / Losses", value: `**${data.wins}** / **${data.games - data.wins}**`, inline: true },
                    { name: "Score / Games", value: `**${data.score}** / **${data.games}**`, inline: true },
                    { name: "KDR / WLR", value: `**${roundTo(data.kills / data.deaths, 2)}** / **${roundTo(data.wins / (data.games - data.wins), 2)}**`, inline: true },
                    { name: "SPK / SPG", value: `**${roundTo(data.score / data.kills, 2)}** / **${roundTo(data.score / data.games, 2)}**`, inline: true },
                    { name: "KR", value: `**${data.funds}**`, inline: true },
                    { name: "Time Played", value: `**${milliToHumanDuration(data.timePlayed)}**`, inline: true },
                    { name: "Creation Date", value: `**${readableDateTime(new Date(data.createdAt))}**`, inline: true },
                    { name: "Followers / Following", value: `**${data.followers}** / **${data.following}**`, inline: true },
                    { name: "Hacker / Verified / Infected", value: `**${data.hacker ? "Y" : "N"}** / **${data.verified ? "Y" : "N"}** / **${data.infected ? "Y" : "N"}**`, inline: true },
                    { name: "Maps / Mods", value: `**${data.maps.length}** / **${data.mods.length}**`, inline: true },
                    { name: "Assets / Skins", value: `**${data.assets.length}** / **${data.skins.length}**`, inline: true }
                ])
                .setTimestamp()
                .setFooter({ text: "Made with hitthemoney's API", iconURL: message.client.user.displayAvatarURL() });
            await msgOrRes(message, em);
        } catch (err: any) {
            await msgOrRes(message, "Failed to acquire user stats!");
            if (err.message) console.error(err);
        }
    }

    async clan(message: Discord.Message | Discord.ChatInputCommandInteraction, name: string) {
        try {
            const res = await getFetch()("https://kr.vercel.app/api/clan?clan=" + name);
            if (!res.ok) throw new Error();
            const json = <Response>await res.json();
            if (!json.success) throw new Error(json.error);
            const data = <Clan>json.data;
            const em = new Discord.EmbedBuilder()
                .setTitle(`${data.name}`)
                .setURL("https://krunker.io/social.html?p=clan&q=" + data.name)
                .setColor(color())
                .setDescription(`ID: **${data.id}**\nLevel: **${data.level}**\nOwner: **${data.owner}**`)
                .addFields(
                    { name: "Members", value: `**${data.members.length}**`, inline: true },
                    { name: "Score", value: `**${data.score}**`, inline: true },
                    { name: "KR", value: `**${data.funds}**`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: "Made with hitthemoney's API", iconURL: message.client.user.displayAvatarURL() });
            if (data.discord) em.setDescription(em.data.description + `\nDiscord: [Join](https://discord.gg/${data.discord})`);
            await msgOrRes(message, em);
        } catch (err: any) {
            await msgOrRes(message, "Failed to acquire user stats!");
            if (err.message) console.error(err);
        }
    }

    async server(message: Discord.Message | Discord.ChatInputCommandInteraction, search: string, author: Discord.User) {
        try {
            const servers = await this.getServers();
            if (servers.error) throw new Error(servers.message);
            let official = [];
            let custom = [];
            if (!search) {
                official = servers.games.filter(x => !x[4].cs);
                custom = servers.games.filter(x => x[4].cs);
            } else {
                official = servers.games.filter(x => (x[4].i.includes(search) || x[0].includes(search)) && !x[4].cs);
                custom = servers.games.filter(x => (x[4].i.includes(search) || x[0].includes(search)) && x[4].cs);
            }
            if (official.length < 1 && custom.length < 1) return await msgOrRes(message, "No server was found!");
            official.sort(function (a, b) {
                const nameA = a[0];
                const nameB = b[0];
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
            custom.sort(function (a, b) {
                const nameA = a[0];
                const nameB = b[0];
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
                const em = new Discord.EmbedBuilder()
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
                const em = new Discord.EmbedBuilder()
                    .setTitle(`Custom Games (${i + 1}/${customPage})`)
                    .setColor(customColor)
                    .setDescription(str)
                    .setTimestamp()
                    .setFooter({ text: `There are ${customPage} pages for custom games.`, iconURL: client.user.displayAvatarURL() });
                allEmbeds.push(em);
            }
            let s = 0;
            const row1 = new Discord.ActionRowBuilder<MessageActionRowComponentBuilder>()
                .addComponents(new Discord.ButtonBuilder({ label: "<< First", customId: "first", style: ButtonStyle.Primary }))
                .addComponents(new Discord.ButtonBuilder({ label: "< Previous", customId: "previous", style: ButtonStyle.Primary }))
                .addComponents(new Discord.ButtonBuilder({ label: "> Next", customId: "next", style: ButtonStyle.Primary }))
                .addComponents(new Discord.ButtonBuilder({ label: ">> Last", customId: "last", style: ButtonStyle.Primary }))
                .addComponents(new Discord.ButtonBuilder({ label: "Stop", emoji: "✖️", customId: "stop", style: ButtonStyle.Danger }));
            const row2 = new Discord.ActionRowBuilder<MessageActionRowComponentBuilder>()
                .addComponents(new Discord.ButtonBuilder({ label: "Random Game", emoji: "🎲", customId: "random", style: ButtonStyle.Secondary }))
                .addComponents(new Discord.ButtonBuilder({ label: "Random Regional", emoji: "🔗", customId: "region", style: ButtonStyle.Secondary }))
                .addComponents(new Discord.ButtonBuilder({ label: "Page Warp", emoji: "⏩", customId: "warp", style: ButtonStyle.Secondary }));
            const msg = await msgOrRes(message, { embeds: [allEmbeds[0]], components: [row1, row2] });
            const collector = msg.createMessageComponentCollector({
                filter: (interaction) => interaction.user.id === author.id,
                idle: 60000
            });
            const linkEmbed = new Discord.EmbedBuilder()
                .setColor(color())
                .setTitle("Random Game Generator")
                .setTimestamp()
                .setFooter({ text: "Please decide within 30 seconds.", iconURL: client.user.displayAvatarURL() });
            const pageWarp = new Discord.EmbedBuilder()
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
                        const menu = new Discord.SelectMenuBuilder().setCustomId("region_menu").addOptions(options.map(x => ({ label: x, value: x })));
                        linkEmbed.setDescription(`Please choose a region in the menu.`);
                        await interaction.update({ embeds: [linkEmbed], components: [new Discord.ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu)] });
                        break;
                    case "region_menu":
                        const region = (<Discord.SelectMenuInteraction>interaction).values[0];
                        var games = [];
                        if (s > officialPage - 1) games = custom.filter(x => x[0].startsWith(region));
                        else games = official.filter(x => x[0].startsWith(region));
                        await message.channel.send(`https://krunker.io/?game=${games[Math.floor(Math.random() * games.length)][0]}`);
                        await interaction.update({ embeds: [allEmbeds[s]], components: [row1, row2] });
                        break;
                    case "warp":
                        await interaction.update({ embeds: [pageWarp] });
                        const modal = new Discord.ModalBuilder().setTitle("Page Select").addComponents(
                            new Discord.ActionRowBuilder<Discord.TextInputBuilder>().addComponents(
                                new Discord.TextInputBuilder()
                                    .setCustomId("page")
                                    .setLabel("Please enter the page number")
                                    .setStyle(TextInputStyle.Short)
                            ));
                        await interaction.showModal(modal);
                        const collected1 = await interaction.awaitModalSubmit({ filter: int => int.user.id === author.id, time: 30000 });
                        const parsed = parseInt(collected1.fields.getTextInputValue("page"));
                        s = (parsed - 1) % allEmbeds.length;
                        if (s < 0) s = 0;
                        await collected1.editReply({ embeds: [allEmbeds[s]], components: [row1, row2] });
                        break;
                    case "first":
                        s = 0;
                        await interaction.update({ embeds: [allEmbeds[s]] });
                        break;
                    case "previous":
                        s -= 1;
                        if (s < 0) s = allEmbeds.length - 1;
                        await interaction.update({ embeds: [allEmbeds[s]] });
                        break;
                    case "next":
                        s = (s + 1) % allEmbeds.length;
                        await interaction.update({ embeds: [allEmbeds[s]] });
                        break;
                    case "last":
                        s = allEmbeds.length - 1;
                        await interaction.update({ embeds: [allEmbeds[s]] });
                        break;
                    case "stop":
                        collector.emit("end");
                        break;
                }
            });
            collector.on("end", async function () {
                try {
                    await msg.edit({ components: [] });
                    let random = "";
                    if (s > officialPage - 1) random = (`https://krunker.io/?game=${custom[Math.floor(Math.random() * custom.length)][0]}`);
                    else random = (`https://krunker.io/?game=${official[Math.floor(Math.random() * official.length)][0]}`);
                    if (random.endsWith("undefined")) random = "";
                    await wait(30000);
                    if (random.length) msg.edit({ content: `Here's a random server:\n<${random}>`, embeds: [] }).catch(() => { });
                } catch (err) { }
            });
        } catch (err: any) {
            console.error(err);
            await msgOrRes(message, `There was an error trying to show you the games!`, true);
        }
    }

    async changelog(message: Discord.Message | Discord.ChatInputCommandInteraction, version: string, author: Discord.User) {
        try {
            const changelogs = await this.getChangelog();
            if (changelogs.error) throw new Error(changelogs.message);
            let changelog = {};
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
            let result = { error: true, message: null };
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
            const result = { error: true, message: null };
            const lines = {};
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