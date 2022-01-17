
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { globalClient as client } from "../../common";
import { color, ms, msgOrRes } from "../../function";
import * as Discord from "discord.js";
const akaneko = require("akaneko");

class HentaiCommand implements SlashCommand {
    name = "hentai"
    description = "Returns something very NSFW. Requires NSFW channel."
    usage = "[tag | subcommand]"
    aliases = ["h"]
    subcommands = ["auto", "tags"]
    subaliases = ["a", "t"]
    subdesc = ["Automate Hentai images."]
    subusage = ["<subcommand> <amount> <interval> [reverse] [tags]", "<subcommand>"]
    tags = [
        "ass",
        "bdsm",
        "blowjob",
        "cum",
        "cumslut",
        "doujin",
        "feet",
        "femdom",
        "foxgirl",
        "gifs",
        "glasses",
        "hentai",
        "netorare",
        "maid",
        "masturbation",
        "orgy",
        "panties",
        "pussy",
        "school",
        "succubus",
        "tentacles",
        "thighs",
        "uglyBastard",
        "uniform",
        "yuri",
        "zettaiRyouiki",
        "neko"
    ]
    category = 5
    options = [
        {
            name: "single",
            description: "Displays a single Hentai.",
            type: "SUB_COMMAND",
            options: [{
                name: "tag",
                description: "The tag of Hentai to fetch.",
                required: false,
                type: "STRING"
            }]
        },
        {
            name: "auto",
            description: "Sends Hentai automatically with a give interval.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "amount",
                    description: "The amount of Hentai to fetch.",
                    required: true,
                    type: "INTEGER"
                },
                {
                    name: "interval",
                    description: "The interval between each fetch, with minimum 1 second and maximum 5 minutes",
                    required: true,
                    type: "STRING"
                },
                {
                    name: "exclude",
                    description: "Toggle tag excluding.",
                    required: false,
                    type: "BOOLEAN"
                },
                {
                    name: "tags",
                    description: "The tags to (not) fetch.",
                    required: false,
                    type: "STRING"
                }
            ]
        }
    ];

    async execute(interaction: NorthInteraction) {
        const sub = interaction.options.getSubcommand();
        if (sub === "single") {
            const t = interaction.options.getString("tag");
            var embed;
            if (t) {
                var tag = "random";
                const i = this.tags.findIndex(t => t.toLowerCase() === t);
                if (i !== -1) tag = this.tags[i];
                embed = await (t.toLowerCase() === "tags" ? this.tagsList() : this.tagged(tag));
            } else embed = await this.random();
            return await interaction.reply(embed);
        } else {
            const options = interaction.options;
            await this.auto(interaction, options.getInteger("amount"), ms(options.getString("interval")), options.getBoolean("exclude"), options.getString("tags").split(/ +/));
        }
    }

    async run(message: NorthMessage, args: string[]) {
        var tag = "random";
        if (args.length >= 1) {
            if (args[0].toLowerCase() === "tags") return await message.channel.send({embeds: [await this.tagsList()]});
            else if (["auto", "a"].includes(args[0].toLowerCase())) {
                const reverse = args[3] === "true";
                return await this.auto(message, args[1], args[2], reverse, args.slice(reverse ? 3 : 2));
            }
            const testTag = args[0];
            const i = this.tags.findIndex(t => testTag === t);
            if (i !== -1) tag = this.tags[i];
        }
        if (tag === "random") return await message.channel.send({embeds: [await this.random()]});
        await message.channel.send({embeds: [await this.tagged(tag)]});
    }
    async tagged(tag: string) {
        if (tag === "neko") var result = akaneko.lewdneko();
        else if (akaneko.nsfw[tag]) var result = await akaneko.nsfw[tag]();
        else return await this.random();
        const embed = new Discord.MessageEmbed()
            .setTitle("Tag: " + tag)
            .setColor(color())
            .setImage(result)
            .setTimestamp()
            .setFooter({ text: "Made with Akaneko", iconURL: client.user.displayAvatarURL() });
        return embed;
    }
    async random() {
        var index = Math.floor(Math.random() * this.tags.length);
        var tag = this.tags[index];
        if (tag === "neko") var result = akaneko.lewdNeko();
        else var result = await akaneko.nsfw[tag]();
        const embed = new Discord.MessageEmbed()
            .setTitle("Tag: " + tag)
            .setColor(color())
            .setImage(result)
            .setTimestamp()
            .setFooter({ text: "Made with Akaneko", iconURL: client.user.displayAvatarURL() });
        return embed;
    }
    async tagsList() {
        return new Discord.MessageEmbed()
            .setTitle("Tag list")
            .setColor(color())
            .setDescription("**" + this.tags.join("**\n**") + "**")
            .setFooter({ text: "Have a nice day! :)", iconURL: client.user.displayAvatarURL() });
    }
    async auto(message: NorthMessage | NorthInteraction, amount = undefined, interval = undefined, reverse = false, tags = []) {
        if (!amount) return await msgOrRes(message, "You didn't provide the amount of messages to be sent!");
        else if (!interval) return await msgOrRes(message, "You didn't provide the interval between each message!");
        if (isNaN(amount)) return await msgOrRes(message, "The amount of message is invalid!");
        else if (!interval) return await msgOrRes(message, "The interval is not valid!");
        else if (interval < 1000) return await msgOrRes(message, "The interval must be larger than 1 second!");
        else if (interval > 300000) return await msgOrRes(message, "The interval must be smaller than 5 minutes!");
        else if (amount < 1) return await msgOrRes(message, "The amount of message must be larger than 0!");
        else if (amount > 120) return await msgOrRes(message, "The amount of message must be smaller than 120!");
        await msgOrRes(message, `Auto-hentai initialized. **${amount} messages** with interval **${interval} milliseconds**`);
        if (reverse) tags = tags.filter(str => !this.tags.includes(str));
        else tags = tags.filter(str => this.tags.includes(str));
        var counter = 0;
        var i = setInterval(async () => {
            if (counter === amount) {
                await message.channel.send("Auto-hentai ended. Thank you for using that!");
                return clearInterval(i);
            }
            var embed;
            if (tags.length < 1) embed = await this.random();
            else embed = await this.tagged(tags[tags.length > 1 ? Math.floor(Math.random() * tags.length) : tags[0]]);
            await message.channel.send(embed);
            counter++;
        }, interval);
    }
};

const cmd = new HentaiCommand();
export default cmd;