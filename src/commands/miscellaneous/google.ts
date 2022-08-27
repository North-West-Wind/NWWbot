
import { NorthInteraction, NorthMessage, FullCommand, NorthClient } from "../../classes/NorthClient.js";
import * as Discord from "discord.js";
import { color } from "../../function.js";
import { globalClient as client } from "../../common.js";
import google from "googlethis";

class GoogleCommand implements FullCommand {
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
    await interaction.editReply({ embeds: [await this.getSearchEmbed(interaction.options.getString("query"), !interaction.guildId || NorthClient.storage.guilds[interaction.guildId].safe)] });
  }

  async run(message: NorthMessage, args: string[]) {
    await message.channel.send({ embeds: [await this.getSearchEmbed(args.join(" "), !message.guildId || NorthClient.storage.guilds[message.guildId].safe)] });
  }

  async getSearchEmbed(query: string, safe: boolean) {
    const { results } = await google.search(query, { page: 0, safe });
    let num = 0;
    const Embed = new Discord.EmbedBuilder()
      .setColor(color())
      .setTitle("Search results of " + query)
      .setDescription(results.map(result => `${++num}. **[${result.title}](${result.url})**`).join("\n"))
      .setTimestamp()
      .setFooter({ text: "Have a nice day! :)", iconURL: client.user.displayAvatarURL() });
    return Embed;
  }
}

const cmd = new GoogleCommand();
export default cmd;