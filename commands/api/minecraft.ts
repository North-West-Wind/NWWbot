import { SlashCommand } from "../../classes/Command";
import { CategoryList, SectionTypes, SortTypes } from "aio-mc-api/lib/typings/CurseForge/Constants";
import { Interaction } from "slashcord/dist/utilities/interaction";
import { nameToUuid, profile, createEmbedScrolling, getKeyByValue, color, nameHistory } from "../../function";
import { NorthMessage } from "../../classes/NorthMessage";
import { Client, Message, MessageEmbed } from "discord.js";
import { curseforge, SimpleProject } from "aio-mc-api";
import { ApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandOptionChoice } from "../../classes/Slash";

class MinecraftCommand implements SlashCommand {
    name: "minecraft";
    description: "Connect to the Minecraft API and display information.";
    aliases: ["mc"];
    usage: "[subcommand] <username | UUID | IP>";
    subcommands: ["profile", "server", "history", "curseforge"];
    subaliases: ["pro", "srv", "his", "cf"];
    subdesc: ["Display the profile of a Minecraft player.", "Fetch information about a Minecraft server.", "Show the username history of a Minecraft player.", "Fetch projects from CurseForge Minecraft."];
    subusage: [null, "<subcommand> <IP>", null, "<subcommand> [section | category] [version] [sort] [keywords]"];
    category: 7;
    args: 1;
    options: any[];

    constructor() {
        const sortChoices = [];
        for (const sort in SortTypes) sortChoices.push(new ApplicationCommandOptionChoice(sort.toLowerCase(), sort));

        this.options = [
            new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), this.subcommands[0], this.subdesc[0]).setOptions([
                new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "username", "The username or UUID of the player.").setRequired(true)
            ]),
            new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), this.subcommands[1], this.subdesc[1]).setOptions([
                new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "ip", "The IP of the server.").setRequired(true)
            ]),
            new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), this.subcommands[2], this.subdesc[2]).setOptions([
                new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "username", "The username or UUID of the player.").setRequired(true)
            ]),
            new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), this.subcommands[3], this.subdesc[3]).setOptions([
                new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "category", "The category of CurseForge project to search."),
                new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "version", "The version of the game."),
                new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "sort", "The way to sort projects.").setChoices(sortChoices),
                new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "keywords", "The project to search for.")
            ])].map(x => JSON.parse(JSON.stringify(x)));
    }

    async execute(obj: { interaction: Interaction, args: any[] }) {
        if (obj.args[0].name === this.subcommands[0]) {
            var str = obj.args[0].options[0].value;
            var em;
            if (str.length <= 16) {
                const uuid = await nameToUuid(str);
                if (!uuid) return await obj.interaction.reply("No player named **" + str + "** were found");
                const r = await profile(uuid);
                em = this.getProfileEmbed(r, obj.interaction.client);
            } else {
                const res = await profile(str);
                em = this.getProfileEmbed(res, obj.interaction.client);
            }
            await obj.interaction.reply(em);
        } else if (obj.args[0].name === this.subcommands[1]) {
            await obj.interaction.reply("Retrieving server information...");
            const url = `https://api.mcsrvstat.us/2/${obj.args[0].options[0].value}`;
            const res = await fetch(url);
            if (!res.ok) return await obj.interaction.edit("Received HTTP Status Code " + res.status);
            const body = await res.json();
            if (body.online) return await obj.interaction.edit({ embeds: [this.getServerEmbed(body, obj.interaction.client, obj.args[0].options[0].value)[0]], content: "" });
            else await obj.interaction.edit({ content: "The server - **" + obj.args.slice(1).join(" ") + "** - is offline/under maintenance." });
        } else if (obj.args[0].name === this.subcommands[2]) {
            const res = await nameToUuid(obj.args[0].options[0].value, true);
            if (!res[0]) await obj.interaction.reply("No player named **" + obj.args[0].options[0].value + "** were found");
            else await obj.interaction.reply(await this.getHistoryEmbed(res, obj.interaction.client));
        } else if (obj.args[0].name === this.subcommands[3]) {
            await obj.interaction.reply("Fetching CurseForge projects...");
            const cArgs = ["curseforge"].concat(obj.args[0].options.filter(x => !!x).map(x => x.value));
            await this.cf(await obj.interaction.fetchReply(), cArgs);
            await obj.interaction.delete();
        }
    }

    async run(message: NorthMessage, args: string[]) {
        if (args[0] === "profile" || args[0] === "pro" || !args[1]) {
            var str = args[0];
            if (args[1]) str = args[1];
            var em;
            if (str.length <= 16) {
                const uuid = await nameToUuid(str);
                if (!uuid) return message.channel.send("No player named **" + str + "** were found")
                const r = await profile(uuid);
                em = this.getProfileEmbed(r, message.client);
            } else {
                const res = await profile(str);
                em = this.getProfileEmbed(res, message.client);
            }
            await message.channel.send(em);
        } else if (args[0] === "server" || args[0] === "srv") {
            const url = `https://api.mcsrvstat.us/2/${args.slice(1).join(" ")}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Received HTTP Status Code " + res.status);
            const body = await res.json();
            if (body.online) {
                const allEmbeds = this.getServerEmbed(body, message.client, args.slice(1).join(" "));
                if (allEmbeds.length < 2) await message.channel.send(allEmbeds[0]);
                else await createEmbedScrolling(message, allEmbeds);
            } else return message.channel.send("The server - **" + args.slice(1).join(" ") + "** - is offline/under maintenance.");
        } else if (args[0] === "history" || args[0] === "his") {
            const res = await nameToUuid(args[1], true);
            if (!res[0]) return message.channel.send("No player named **" + args[1] + "** were found");
            await message.channel.send(await this.getHistoryEmbed(res, message.client));
        } else if (args[0] === "curseforge" || args[0] === "cf") return await this.cf(message, args);
    }

    async cf(message: Message, args: string[]) {
        var category = SectionTypes.MOD;
        var version;
        var sort = "POPULARITY";
        var filter;
        if (SectionTypes[args[1].toUpperCase()] || CategoryList[args[1].toUpperCase()]) {
            category = SectionTypes[args[1].toUpperCase()] || CategoryList[args[1].toUpperCase()];
            if (args[2].match(/^[\d+\.?]+$/)) {
                version = args[2];
                if (SortTypes[args[3].toUpperCase()]) {
                    sort = args[3].toUpperCase();
                    if (args[4]) filter = args.slice(4).join(" ");
                } else {
                    if (args[3]) filter = args.slice(3).join(" ");
                }
            } else {
                if (SortTypes[args[2].toUpperCase()]) {
                    sort = args[2].toUpperCase();
                    if (args[3]) filter = args.slice(3).join(" ");
                } else {
                    if (args[2]) filter = args.slice(2).join(" ");
                }
            }
        } else {
            if (args[1].match(/^[\d+\.?]+$/)) {
                version = args[1];
                if (SortTypes[args[2].toUpperCase()]) {
                    sort = args[2].toUpperCase();
                    if (args[3]) filter = args.slice(3).join(" ");
                } else {
                    if (args[2]) filter = args.slice(2).join(" ");
                }
            } else {
                if (SortTypes[args[1].toUpperCase()]) {
                    sort = args[1].toUpperCase();
                    if (args[2]) filter = args.slice(2).join(" ");
                } else {
                    if (args[1]) filter = args.slice(1).join(" ");
                }
            }
        }
        const projects = <SimpleProject[]>await curseforge.searchProject({ category, gameVersion: version, sort: <keyof typeof SortTypes>sort, filter, pageSize: 100 });
        const allEmbeds = [];
        var categories = CategoryList;
        for (let i = 0; i < Math.ceil(projects.length / 10); i++) {
            const em = new MessageEmbed()
                .setColor(color())
                .setTitle(`CurseForge Minecraft - ${getKeyByValue(Object.assign(categories, SectionTypes), category)}`)
                .setDescription(`Sort by: **${getKeyByValue(SortTypes, sort)}**\nVersion: **${version ? version : "All"}**\nFilter: ${filter ? `**${filter}**` : "None"}\n\n`)
                .setTimestamp()
                .setFooter(`Page ${i + 1}/${Math.ceil(projects.length / 10)}`, message.client.user.displayAvatarURL());
            for (let u = 0; u < Math.min(10, projects.length - 10 * i); u++) {
                const project = projects[i * 10 + u];
                em.setDescription(em.description + `**[${project.section.name}: ${project.name} - ${project.authors.map(a => a.name).join(", ")}](${project.url})**\n`);
            }
            em.setDescription(em.description + "React with ◀, ▶, ⏮, ⏭ to turn the page.\nReact with ⏹ to exit.");
            allEmbeds.push(em);
        }
        await createEmbedScrolling(message, allEmbeds);
    }

    getProfileEmbed(r, client: Client) {
        let skin = "https://visage.surgeplay.com/full/256/" + r.id;
        const Embed = new MessageEmbed()
            .setColor(color())
            .setTitle(r.name)
            .setDescription("Profile:")
            .addField("UUID", r.id, true)
            .addField("Username", r.name, true)
            .setImage(skin)
            .setTimestamp()
            .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
        return Embed;
    }

    getServerEmbed(body, client: Client, name: string) {
        const ip = body.ip;
        const port = body.port;
        const player = body.players.online + " / " + body.players.max;
        const version = body.version;
        const hostname = body.hostname;
        const desc = body.motd.clean.join("\n");
        const spaceRemoved = desc.replace(/ +(?= )/g, '');
        const Embed = new MessageEmbed()
            .setTitle(name)
            .setColor(color())
            .addField("IP", "`" + ip + "`", true)
            .addField("Port", "`" + port + "`", true)
            .addField("Player/Max", "`" + player + "`", true)
            .addField("Version", "`" + version + "`", true)
            .addField("Hostname", "`" + hostname + "`", true)
            .addField("Description", "`" + spaceRemoved + "`")
            .setTimestamp()
            .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
        const allEmbeds = [Embed];
        if (body.players?.list) for (let i = 0; i < Math.ceil(body.players.list.length / 10); i++) {
            const em = new MessageEmbed()
                .setTitle("Online Players")
                .setTimestamp()
                .setFooter(`Page ${i + 1}/${Math.ceil(body.players.list.length / 10)}`, client.user.displayAvatarURL());
            const strs = [];
            for (let j = i * 10; j < body.players.list.length - i * 10; j++) strs.push(body.players.list[j]);
            em.setDescription(strs.join("\n"));
            allEmbeds.push(em);
        }
        return allEmbeds;
    }

    async getHistoryEmbed(res, client: Client) {
        const result = await nameHistory(res[0].id);
        var names = [];
        var num = 0
        for (var i = result.length - 1; i > -1; i--) {
            ++num;
            if (num === 1) names.push("**" + num + ". " + result[i].name + "**");
            else names.push(num + ". " + result[i].name);
        }
        const Embed = new MessageEmbed()
            .setColor(color())
            .setTitle(res[0].name + "'s Username History")
            .setDescription(names.join("\n"))
            .setFooter("Last changed on " + new Date(result[result.length - 1].changedToAt), client.user.displayAvatarURL());
        return Embed;
    }
}

const cmd = new MinecraftCommand();
module.exports = JSON.parse(JSON.stringify(cmd));