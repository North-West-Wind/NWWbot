import { Interaction } from "slashcord";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { globalClient as client } from "../../common";
import * as Discord from "discord.js";
import { readableDateTime, color, readableDateTimeText } from "../../function";

class InfoCommand implements SlashCommand {
  name = "info"
  description = "Display information of the bot."
  category = 6
  
  async execute(obj: { interaction: Interaction, client: NorthClient }) {
      await obj.interaction.reply(this.getInfo());
  }

  async run(message: NorthMessage) {
    await message.channel.send(this.getInfo());
  }

  getInfo() {
    var lastReady = readableDateTime(client.readyAt);
    const infoEmbed = new Discord.MessageEmbed()
      .setTitle(client.user.tag)
      .setColor(color())
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(`Made by NorthWestWind!\nVersion: **[${client.version}](https://northwestwind.ml/news)**\n\nRunning on **${client.guilds.cache.size} servers**\nLast restart: **${lastReady}**\nUptime: **${readableDateTimeText(client.uptime)}**`)
      .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
      return infoEmbed;
  }
}

const cmd = new InfoCommand();
export default cmd;