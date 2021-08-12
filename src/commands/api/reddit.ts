import RedditAPI, { API } from "reddit-wrapper-v2";
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { validImgurURL, color } from "../../function";
import * as Discord from "discord.js";
import { globalClient as client } from "../../common";

var redditConn: { api: API };

const def = ["memes", "dankmemes", "meme"];

class RedditCommand implements SlashCommand {
    name = "reddit"
    description = "Fetch memes from Reddit."
    usage = "[subreddits]"
    aliases = ["meme"]
    category = 7
    options = [{
        name: "subreddit",
        description: "The subreddits to find memes from.",
        required: false,
        type: "STRING"
    }];

    async execute(interaction: NorthInteraction) {
        await interaction.deferReply();
        const em = await this.getPost(interaction.options.getString("subreddit")?.split(/ +/) || []);
        if (!em) await interaction.editReply("Failed to fetch Reddit post!");
        else await interaction.editReply({ embeds: [em] });
    }

    async run(message: NorthMessage, args: string[]) {
        const em = await this.getPost(args);
        if (!em) await message.channel.send("Failed to fetch Reddit post!");
        else await message.channel.send({ embeds: [em] });
    }

    async getPost(custom: string[], retry: number = 0) {
        if (retry >= 3) return null;
        var subreddits;
        if (custom[0]) subreddits = custom;
        else subreddits = def;
        const chosen = subreddits[Math.floor(Math.random() * subreddits.length)];

        const response = await redditConn.api.get(`/r/${chosen}/hot`, { limit: 100 }).catch(console.error);
        if (!response[1]?.data?.children[0]?.data?.url) return await this.getPost(custom, ++retry);
        var data = response[1].data.children[Math.floor(Math.random() * response[1].data.children.length)].data;
        if (!data?.url || (!data.url.endsWith(".jpg") && !data.url.endsWith(".png") && !data.url.endsWith(".gif") && !validImgurURL(data.url))) return await this.getPost(custom, ++retry);

        const em = new Discord.MessageEmbed()
            .setTitle(`${data.title.substring(0, 256)}`)
            .setURL(`https://reddit.com${data.permalink}`)
            .setImage(data.url)
            .setColor(color())
            .setFooter(`${data.ups} 👍 | ${data.downs} 👎 | ${data.num_comments} 🗨`, client.user.displayAvatarURL())
            .setTimestamp();
        return em;
    }

    init() {
        redditConn = RedditAPI({
            username: process.env.RUSER,
            password: process.env.RPW,
            app_id: process.env.APPID,
            api_secret: process.env.APPSECRET,
            retry_on_wait: true,
            retry_on_server_error: 5,
            retry_delay: 1
        });
    }
};

const cmd = new RedditCommand();
export default cmd;