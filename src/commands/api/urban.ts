import { Interaction } from "slashcord/dist/Index";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { color, createEmbedScrolling, getFetch } from "../../function";
import * as Discord from "discord.js";
import { globalClient as client } from "../../common";

const fetch = getFetch();

class UrbanCommand implements SlashCommand {
    name = "urban"
    description = "Search the Urban Dictionary on Discord."
    usage = "<query>"
    category = 7
    args = 1
    options = [{
        name: "query",
        description: "The thing to lookup.",
        required: true,
        type: 3
    }];

    async execute(obj: { args: any[], interaction: Interaction }) {
        const args = obj.args?.map(x => x?.value).filter(x => !!x);
        const allEmbeds = await this.getDictEmbed(args.join(" "));
        if (!allEmbeds) return await obj.interaction.reply(`No results found for **${args.join(" ")}**.`);
        await createEmbedScrolling(obj.interaction, allEmbeds);
    }

    async run(message: NorthMessage, args: string[]) {
        const allEmbeds = await this.getDictEmbed(args.join(" "));
        if (!allEmbeds) return await message.channel.send(`No results found for **${args.join(" ")}**.`);
        await createEmbedScrolling(message, allEmbeds);
    }

    async getDictEmbed(query: string) {
        const { list } = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(query)}`).then(response => response.json());
        if (!list.length) return null;
        const trim = (str, max) => str.length > max ? `${str.slice(0, max - 3)}...` : str;
        const allEmbeds = [];
        for (var i = 0; i < list.length; i++) {
            var answer = list[i];
            const embed = new Discord.MessageEmbed()
                .setColor(color())
                .setTitle(answer.word)
                .setURL(answer.permalink)
                .addField("Definition", trim(answer.definition, 1024))
                .addField("Example", trim(answer.example, 1024))
                .setTimestamp()
                .setFooter(`👍 ${answer.thumbs_up} | 👎 ${answer.thumbs_down}`, client.user.displayAvatarURL());
            allEmbeds.push(embed);
        }
    }
};

const cmd = new UrbanCommand();
export default cmd;