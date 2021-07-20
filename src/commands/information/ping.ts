import { Interaction } from "slashcord";
import { SlashCommand } from "../../classes/NorthClient";
import { readableDateTime, color } from "../../function";
import * as Discord from "discord.js";

class PingCommand implements SlashCommand {
  name = "ping"
  description = "Ping the bot and it will show you something interesting (not really)."
  category = 6
  
  async execute(obj: { interaction: Interaction }) {
      await obj.interaction.reply("🏓");
  }

  async run(message) {
    const msgDate = new Date(message.createdTimestamp).getTime();
    const msgTime = readableDateTime(msgDate)

    const currentDate = Date.now();
    const currentTime = readableDateTime(currentDate);

    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Ping")
      .addField("Message sent", "`" + msgTime + "`")
      .addField("Message received", "`" + currentTime + "`")
      .addField("Ping", "`" + (currentDate - msgDate) + "ms`")
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    await message.channel.send(Embed);
    await message.author.send("Pong! Don't question me. I'm online.")
  }
}

const cmd = new PingCommand();
export default cmd;