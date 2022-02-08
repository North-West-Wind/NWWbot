import wiki from "wikijs";
import * as Discord from "discord.js";
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";

import { color } from "../../function.js";

class WikiCommand implements SlashCommand {
    name = "wiki"
    description = "Searches Wikipedia for stuff."
    usage = "<query>"
    aliases = ["wikipedia"]
    args = 1
    category = 7
    options = [{
        name: "query",
        description: "The thing to lookup.",
        required: true,
        type: "STRING"
    }];

    async execute(interaction: NorthInteraction) {
        await interaction.deferReply();
        await this.specialCollector(interaction, interaction.options.getString("query"));
    }

    async run(message: NorthMessage, args: string[]) {
        await this.specialCollector(message, args.join(" "));
    }

    async specialCollector(message: Discord.Message | NorthInteraction, query: string) {
        const data = await wiki({ apiUrl: 'https://en.wikipedia.org/w/api.php' }).search(query, 100);
        var num = 0;
        const allEmbeds = [];
        for (const result of data.results) {
            try {
                const page = await wiki({ headers: { 'User-Agent': 'N0rthWestW1nd/2.0.0 (https://www.nwws.ml; no_u@nwws.ml) wiki.js' }, apiUrl: 'https://en.wikipedia.org/w/api.php' }).page(result);
                const url = page.url();
                const summary = await page.summary();
                const em = new Discord.MessageEmbed()
                    .setColor(color())
                    .setTitle(`${++num}. ${result}`)
                    .setDescription(summary.length > 2048 ? (summary.slice(0, 2045) + "...") : summary)
                    .setTimestamp()
                    .setURL(url)
                    .setFooter({ text: "1️⃣, 2️⃣ and 3️⃣ are for navigating to 25th, 50th, iconURL: 75th result." });
                allEmbeds.push(em);
            } catch (err: any) {
                console.error(err);
                --num;
            }
        }

        const emojis = ["⏮", "◀", "▶", "⏭", "⏹"];
        if (allEmbeds[24]) emojis.push("1️⃣");
        if (allEmbeds[49]) emojis.push("2️⃣");
        if (allEmbeds[74]) emojis.push("3️⃣")

        var msg: Discord.Message, author;
        if (message instanceof Discord.Message) {
            msg = await message.channel.send({embeds: [allEmbeds[0]]});
            author = message.author.id;
        } else {
            msg = <Discord.Message> await message.editReply({embeds: [allEmbeds[0]]});
            author = message.user.id;
        }
        const filter = (reaction, user) => (emojis.includes(reaction.emoji.name) && user.id === author);

        var s = 0;
        for (const emoji of emojis) {
            msg.react(emoji);
        }
        var collector = msg.createReactionCollector({
            filter,
            idle: 60000
        });
        collector.on("collect", function (reaction, user) {
            reaction.users.remove(user.id).catch(() => {});
            switch (reaction.emoji.name) {
                case "⏮":
                    s = 0;
                    msg.edit({ embeds: [allEmbeds[s]] });
                    break;
                case "◀":
                    s -= 1;
                    if (s < 0) {
                        s = allEmbeds.length - 1;
                    }
                    msg.edit({ embeds: [allEmbeds[s]] });
                    break;
                case "▶":
                    s += 1;
                    if (s > allEmbeds.length - 1) {
                        s = 0;
                    }
                    msg.edit({ embeds: [allEmbeds[s]] });
                    break;
                case "⏭":
                    s = allEmbeds.length - 1;
                    msg.edit({ embeds: [allEmbeds[s]] });
                    break;
                case "⏹":
                    collector.emit("end");
                    break;
                case "1️⃣":
                    s = 24;
                    msg.edit({ embeds: [allEmbeds[s]] });
                    break;
                case "2️⃣":
                    s = 49;
                    msg.edit({ embeds: [allEmbeds[s]] });
                    break;
                case "3️⃣":
                    s = 74;
                    msg.edit({ embeds: [allEmbeds[s]] });
                    break;
            }
        });
        collector.on("end", function () {
            msg.reactions.removeAll().catch(() => {});
        });
    }
}

const cmd = new WikiCommand();
export default cmd;