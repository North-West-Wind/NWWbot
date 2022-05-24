import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import * as Discord from "discord.js";
import { capitalize, color, xmlToJson, getFetch } from "../../function.js";

import { globalClient as client } from "../../common.js";

const fetch = getFetch();

class Rule34Command implements FullCommand {
    name = "rule34"
    description = "Displays Rule34 images. Add tags to filter. Requires NSFW channel."
    aliases = ["r34"]
    usage = "<tags>"
    category = 5
    args = 1
    options = [{
        name: "tags",
        description: "The tags of rule34 to search for.",
        required: true,
        type: "STRING"
    }];
    async execute(interaction: NorthInteraction) {
        const args = interaction.options.getString("tags").split(/ +/);
        await interaction.reply({embeds: [await this.getPost(args.map(x => x.split("_").map(y => encodeURIComponent(capitalize(y))).join("_")))]});
    }

    async run(message: NorthMessage, args: string[]) {
        await message.channel.send({embeds: [await this.getPost(args.map(x => x.split("_").map(y => encodeURIComponent(capitalize(y))).join("_")))]});
    }

    async getPost(tags: string[]) {
        async function pick() {
            try {
                const post = await fetch(`http://rule34.paheal.net/api/danbooru/find_posts/index.xml?tags=${tags.join("+")}&limit=100`);
                if (!post.ok) throw new Error("Received HTTP status: " + post.status);
                else {
                    const json = <any> (await post.text().then(str => xmlToJson(str)));
                    return json.posts.tag[Math.floor(Math.random() * json.posts.tag.length)].$;
                }
            } catch (err: any) {
                return { error: `there was an error trying to find rule34 with ${tags.length > 1 ? "these tags" : "this tag"}!`, embed: null };
            }
        }
        const post = await pick();
        if (post.error) return;
        const Embed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle("Searching tags: " + tags.join(", "))
            .setDescription("Tags: `" + post.tags.split(/ +/).join("`, `") + "`\nPlease be patient. Image will load soon...")
            .setTimestamp()
            .setFooter({ text: "From rule34.paheal.net", iconURL: client.user.displayAvatarURL() })
            .setImage(post.file_url);
        return Embed;
    }
}

const cmd = new Rule34Command();
export default cmd;