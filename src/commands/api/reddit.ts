import RedditAPI, { API } from "reddit-wrapper-v2";
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { validImgurURL, color } from "../../function.js";
import * as Discord from "discord.js";
import { globalClient as client } from "../../common.js";

let redditConn: { api: API };

const def = ["memes", "dankmemes", "meme"];

class RedditCommand implements FullCommand {
    name = "reddit"
    description = "Fetches memes from Reddit."
    usage = "[subreddits]"
    aliases = ["meme"]
    category = 7
    options = [{
        name: "subreddit",
        description: "The subreddits to find memes from.",
        required: false,
        type: "STRING"
    }];

    constructor() {
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

    async getPost(custom: string[], retry = 0) {
        if (retry >= 3) return null;
        let subreddits;
        if (custom[0]) subreddits = custom;
        else subreddits = def;
        const chosen = subreddits[Math.floor(Math.random() * subreddits.length)];

        const response = await redditConn.api.get(`/r/${chosen}/hot`, { limit: 100 }).catch(console.error);
        if (!response[1]?.data?.children[0]?.data?.url) return await this.getPost(custom, ++retry);
        const data = response[1].data.children[Math.floor(Math.random() * response[1].data.children.length)].data;
        if (!data?.url || (!data.url.endsWith(".jpg") && !data.url.endsWith(".png") && !data.url.endsWith(".gif") && !validImgurURL(data.url))) return await this.getPost(custom, ++retry);

        const em = new Discord.EmbedBuilder()
            .setTitle(`${data.title.substring(0, 256)}`)
            .setURL(`https://reddit.com${data.permalink}`)
            .setImage(data.url)
            .setColor(color())
            .setFooter({ text: `${data.ups} 👍 | ${data.downs} 👎 | ${data.num_comments} 🗨`, iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        return em;
    }
}

const cmd = new RedditCommand();
export default cmd;