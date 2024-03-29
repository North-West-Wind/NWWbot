
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

    const currentDate = new Date();
    const currentTime = readableDateTime(currentDate);

    const Embed = new Discord.EmbedBuilder()
      .setColor(color())
      .setTitle("Ping")
      .setDescription("Note: The ping is fake lol")
      .addFields([
        { name: "Message sent", value: "`" + msgTime + "`" },
        { name: "Message received", value: "`" + currentTime + "`" },
        { name: "Ping", value: "`" + (currentDate.getTime() - msgDate.getTime()) + "ms`" }
      ])
      .setTimestamp()
      .setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
    await message.channel.send({ embeds: [Embed] });
    await message.author.send("Pong! Don't question me. I'm online.")
  }
}

const cmd = new PingCommand();
export default cmd;