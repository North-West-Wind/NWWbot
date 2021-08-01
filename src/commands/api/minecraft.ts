import { CategoryList, SectionTypes, SortTypes } from "aio-mc-api/lib/typings/CurseForge/Constants";
import { Interaction } from "slashcord/dist/Index";
import { nameToUuid, profile, createEmbedScrolling, getKeyByValue, color, nameHistory, getFetch } from "../../function";
import { Message, MessageEmbed } from "discord.js";
import { curseforge, SimpleProject } from "aio-mc-api";
import { SlashCommand, NorthMessage } from "../../classes/NorthClient";
import { globalClient as client } from "../../common";

const fetch = getFetch();

class MinecraftCommand implements SlashCommand {
    name = "minecraft";
    description = "Connect to the Minecraft API and display information.";
    aliases = ["mc"];
    usage = "[subcommand] <username | UUID | IP>";
    subcommands = ["profile", "server", "history", "curseforge"];
    subaliases = ["pro", "srv", "his", "cf"];
    subdesc = ["Display the profile of a Minecraft player.", "Fetch information about a Minecraft server.", "Show the username history of a Minecraft player.", "Fetch projects from CurseForge Minecraft."];
    subusage = [null, "<subcommand> <IP>", null, "<subcommand> [section | category] [version] [sort] [keywords]"];
    category = 7;
    args = 1;
    options: any[];

    constructor() {
        const sortChoices = [];
        for (const sort in SortTypes) sortChoices.push({ name: sort.toLowerCase(), value: sort });

        this.options = [
            {
                name: this.subcommands[0],
                description: this.subdesc[0],
                type: 1,
                options: [{
                    name: "username",
                    description: "The username or UUID of the player.",
                    required: true,
                    type: 3
                }]
            },
            {
                name: this.subcommands[1],
                description: this.subdesc[1],
                type: 1,
                options: [{
                    name: "ip",
                    description: "The IP of the server.",
                    required: true,
                    type: 3
                }]
            },
            {
                name: this.subcommands[2],
                description: this.subdesc[2],
                type: 1,
                options: [{
                    name: "username",
                    description: "The username or UUID of the player.",
                    required: true,
                    type: 3
                }]
            },
            {
                name: this.subcommands[3],
                description: this.subdesc[3],
                type: 1,
                options: [
                    {
                        name: "category",
                        description: "The category of CurseForge project to search.",
                        required: false,
                        type: 3
                    },
                    {
                        name: "version",
                        description: "The version of the game.",
                        required: false,
                        type: 3
                    },
                    {
                        name: "sort",
                        description: "The way to sort projects.",
                        required: false,
                        type: 3,
                        choices: sortChoices
                    },
                    {
                        name: "keywords",
                        description: "The project to search for.",
                        required: false,
                        type: 3
                    }
                ]
            }
        ]
    }

    async execute(obj: { interaction: Interaction, args: any[] }) {
        console.log(obj.args);
        if (obj.args[0].name === this.subcommands[0]) {
            var str = obj.args[0].options[0].value;
            var r = await profile(str);
            if (!r) return await obj.interaction.reply("No player named **" + str + "** were found");
            const em = this.getProfileEmbed(r);
            await obj.interaction.reply(em);
        } else if (obj.args[0].name === this.subcommands[1]) {
            await obj.interaction.reply("Retrieving server information...");
            const url = `https://api.mcsrvstat.us/2/${obj.args[0].options[0].value}`;
            const res = await fetch(url);
            if (!res.ok) return await obj.interaction.edit("Received HTTP Status Code " + res.status);
            const body = await res.json();
            if (body.online) return await obj.interaction.edit({ embeds: [this.getServerEmbed(body, obj.args[0].options[0].value)[0]], content: "" });
            else await obj.interaction.edit({ content: "The server - **" + obj.args.slice(1).join(" ") + "** - is offline/under maintenance." });
        } else if (obj.args[0].name === this.subcommands[2]) {
            const res = await nameToUuid(obj.args[0].options[0].value);
            if (!res) await obj.interaction.reply("No player named **" + obj.args[0].options[0].value + "** were found");
            else await obj.interaction.reply(await this.getHistoryEmbed(<{ name: string, changedToAt: number }[]><unknown>await nameHistory(obj.args[0].options[0].value)));
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
            var r = await profile(str);
            if (!r) return await message.channel.send("No player named **" + str + "** were found");
            const em = this.getProfileEmbed(r);
            await message.channel.send(em);
        } else if (args[0] === "server" || args[0] === "srv") {
            const url = `https://api.mcsrvstat.us/2/${args.slice(1).join(" ")}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Received HTTP Status Code " + res.status);
            const body = await res.json();
            if (body.online) {
                const allEmbeds = this.getServerEmbed(body, args.slice(1).join(" "));
                if (allEmbeds.length < 2) await message.channel.send(allEmbeds[0]);
                else await createEmbedScrolling(message, allEmbeds);
            } else return message.channel.send("The server - **" + args.slice(1).join(" ") + "** - is offline/under maintenance.");
        } else if (args[0] === "history" || args[0] === "his") {
            const res = await profile(args[1]);
            if (!res) return message.channel.send("No player named **" + args[1] + "** were found");
            await message.channel.send(await this.getHistoryEmbed(<{ name: string, changedToAt: number }[]><unknown>await nameHistory(args[1])));
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

    getProfileEmbed(r) {
        let skin = "https://visage.surgeplay.com/full/256/" + r.id;
        const Embed = new MessageEmbed()
            .setColor(color())
            .setTitle(r.name)
            .addField("UUID", r.id, true)
            .addField("Username", r.name, true)
            .setImage(skin)
            .setTimestamp()
            .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
        return Embed;
    }

    getServerEmbed(body, name: string) {
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

    async getHistoryEmbed(history: { name: string, changedToAt?: number }[]) {
        const result = history;
        var names = [];
        var num = 0
        for (var i = result.length - 1; i > -1; i--) {
            ++num;
            if (num === 1) names.push("**" + num + ". " + result[i].name + "**");
            else names.push(num + ". " + result[i].name);
        }
        const Embed = new MessageEmbed()
            .setColor(color())
            .setTitle(history[0].name + "'s Username History")
            .setDescription(names.join("\n"))
            .setFooter("Last changed on " + new Date(result[result.length - 1].changedToAt), client.user.displayAvatarURL());
        return Embed;
    }
}

const cmd = new MinecraftCommand();
export default cmd;