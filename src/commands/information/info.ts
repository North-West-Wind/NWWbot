
import {  NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { globalClient as client } from "../../common.js";
import * as Discord from "discord.js";
import { readableDateTime, color, readableDateTimeText, checkTradeW1nd, getTradeW1ndStats } from "../../function.js";

class InfoCommand implements SlashCommand {
  name = "info"
  description = "Display information of the bot."
  category = 6
  
  async execute(interaction: NorthInteraction) {
      await interaction.reply({embeds: [await this.getInfo(interaction.guildId)]});
  }

  async run(message: NorthMessage) {
    await message.channel.send({embeds: [await this.getInfo(message.guildId)]});
  }

  async getInfo(guild: Discord.Snowflake) {
    var lastReady = readableDateTime(client.readyAt);
    var desc = `Made by NorthWestWind!\nVersion: **[${client.version}](https://northwestwind.ml/n0rthwestw1nd)**\n\nRunning on **${client.guilds.cache.size} servers**\nLast restart: **${lastReady}**\nUptime: **${readableDateTimeText(client.uptime)}**`;
    if (guild && await checkTradeW1nd(guild)) {
      const stats = await getTradeW1ndStats();
      desc += `\n\n*We also found **TradeW1nd**!*\nVersion: **[${stats.version}](https://top.gg/bot/895321877109690419)**\n\nRunning on **${stats.size} servers**\nLast restart: **${readableDateTime(new Date(stats.lastReady))}**\nUptime: **${readableDateTimeText(stats.uptime)}**`;
    }
    const infoEmbed = new Discord.MessageEmbed()
      .setTitle(client.user.tag)
      .setColor(color())
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(desc)
      .setFooter({ text: "Have a nice day! :)", iconURL: client.user.displayAvatarURL() });
      return infoEmbed;
  }
}

const cmd = new InfoCommand();
export default cmd;