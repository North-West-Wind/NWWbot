import { Message, EmbedBuilder } from "discord.js";

import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import * as Discord from "discord.js";
import { color } from "../../function.js";

const options = ["🖐", "✌", "👊"];

class RPSCommand implements FullCommand {
  name = "rps"
  description = "Play rock, paper, scissors with the randomizer."
  aliases = ["rockscissorspaper", "rockpaperscissors", "paperscissorsstone", "rsp", "pss"]
  category = 3
  
  async execute(interaction: NorthInteraction) {
    const em = new Discord.EmbedBuilder()
      .setColor(color())
      .setTitle("Rock Paper Scissors")
      .setDescription("**React** when you are ready!\n\n🖐 **Paper**\n✌ **Scissors**\n👊 **Rock**")
      .setTimestamp()
      .setFooter({ text: "I only have 30 seconds for you!", iconURL: interaction.client.user.displayAvatarURL() });
    const msg = <Message> await interaction.reply({ embeds: [em], fetchReply: true });
    await this.finishOff(interaction, msg, em);
  }
  
  async run(message: NorthMessage) {
    const em = new Discord.EmbedBuilder()
      .setColor(color())
      .setTitle("Rock Paper Scissors")
      .setDescription("**React** when you are ready!\n\n🖐 **Paper**\n✌ **Scissors**\n👊 **Rock**")
      .setTimestamp()
      .setFooter({ text: "I only have 30 seconds for you!", iconURL: message.client.user.displayAvatarURL() });
    const msg = await message.channel.send({embeds: [em]});
    await this.finishOff(message, msg, em);
  }

  async finishOff(message: NorthMessage | NorthInteraction, msg: Message, em: EmbedBuilder) {
    for(const option of options) await msg.react(option);
    const filter = (r, u) => options.includes(r.emoji.name) && u.id === (message instanceof Message ? message.author.id : message.user.id);
    const collected = await msg.awaitReactions({ filter, max: 1, time: 30000 });
    msg.reactions.removeAll().catch(() => {});
    em.setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
    if(!collected || !collected.first()) {
      em.setDescription("You didn't react in time!");
      return msg.edit({embeds: [em]});
    }
    const i = Math.floor(Math.random() * 3);
    const index = options.indexOf(collected.first().emoji.name);
    if(i === index) em.setDescription(`You: ${collected.first().emoji.name}\nMe: ${options[i]}\n\nThat's a draw!`);
    else if((i + 1) % 3 === index) em.setDescription(`You: ${collected.first().emoji.name}\nMe: ${options[i]}\n\nCongratulations! You beat me!`);
    else if(i === (index + 1) % 3) em.setDescription(`You: ${collected.first().emoji.name}\nMe: ${options[i]}\n\nYou lost! Better luck next time!`);
    else em.setDescription("Umm...What now?");
    msg.edit({embeds: [em]});
  }
}

const cmd = new RPSCommand();
export default cmd;