import { Interaction } from "slashcord/dist/Index";
import { SlashCommand } from "../../classes/NorthClient";
import * as Discord from "discord.js";
import googleIt from "google-it";
import { color } from "../../function";
import { globalClient as client } from "../../common";

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
      type: 3
  }]
  
  async execute(obj: { interaction: Interaction, args: any[] }) {
    await obj.interaction.reply(await this.getSearchEmbed(obj.args[0].value));
  }

  async run(message, args) {
    await message.channel.send(await this.getSearchEmbed(args.join(" ")));
  }

  async getSearchEmbed(query) {
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
    .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
    return Embed;
  }
}

const cmd = new GoogleCommand();
export default cmd;