
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { readableDateTime, color } from "../../function.js";
import * as Discord from "discord.js";

class PingCommand implements FullCommand {
  name = "ping"
  description = "Pings the bot and it will show you something interesting (not really)."
  category = 6
  
  async execute(interaction: NorthInteraction) {
      await interaction.reply("🏓");
  }

  async run(message: NorthMessage) {
    const msgDate = new Date(message.createdTimestamp);
    const msgTime = readableDateTime(msgDate)

    var currentDate = new Date();
    currentDate = new Date(currentDate.getTime() + currentDate.getTimezoneOffset() * 60000)
    const currentTime = readableDateTime(currentDate);

    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Ping")
      .addField("Message sent", "`" + msgTime + "`")
      .addField("Message received", "`" + currentTime + "`")
      .addField("Ping", "`" + (currentDate.getTime() - msgDate.getTime()) + "ms`")
      .setTimestamp()
      .setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
    await message.channel.send({embeds: [Embed]});
    await message.author.send("Pong! Don't question me. I'm online.")
  }
}

const cmd = new PingCommand();
export default cmd;