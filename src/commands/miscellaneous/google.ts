
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import * as Discord from "discord.js";
import { color } from "../../function.js";
import { globalClient as client } from "../../common.js";
const googleIt: any = require("google-it");

class GoogleCommand implements SlashCommand {
  name = "google"
  description = "Google Search everything with Discord."
  usage = "<query>"
  args = 1
  category = 4
  options = [{
      name: "query",
      description: "The keywords to search for.",
      required: true,
      type: "STRING"
  }]
  
  async execute(interaction: NorthInteraction) {
    await interaction.deferReply();
    await interaction.editReply({embeds: [await this.getSearchEmbed(interaction.options.getString("query"))]});
  }

  async run(message: NorthMessage, args: string[]) {
    await message.channel.send({embeds: [await this.getSearchEmbed(args.join(" "))]});
  }

  async getSearchEmbed(query: string) {
    const results = [];
    var links = await googleIt({ limit: 10, query });
    var num = 0;
    for(var i = 0; i < links.length; i++) {
      try {results.push(`${++num}. **[${links[i].title}](${links[i].link})**`);}
      catch(err) {
        --num
      }
    }
    const Embed = new Discord.MessageEmbed()
    .setColor(color())
    .setTitle("Search results of " + query)
    .setDescription(results.join("\n"))
    .setTimestamp()
    .setFooter({ text: "Have a nice day! :)", iconURL: client.user.displayAvatarURL() });
    return Embed;
  }
}

const cmd = new GoogleCommand();
export default cmd;