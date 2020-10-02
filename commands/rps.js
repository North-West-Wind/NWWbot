const Discord = require("discord.js");
var color = Math.floor(Math.random() * Math.pow(255, 3));

module.exports = {
  name: "rps",
  description: "Play rock, scissors, paper with the bot!",
  aliases: ["rockscissorspaper", "rockpaperscissors", "paperscissorsstone", "rsp", "pss"],
  async execute(message) {
    const options = ["🖐", "✌", "👊"];
    var em = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle("Rock Paper Scissors")
      .setDescription("**React** when you are ready!\n\n🖐 **Paper**\n✌ **Scissors**\n👊 **Rock**")
      .setTimestamp()
      .setFooter("I only have 30 seconds for you!", message.client.user.displayAvatarURL());
    var msg = await message.channel.send(em);
    for(const option of options) await msg.react(option);
    const filter = (r, u) => options.includes(r.emoji.name) && u.id === message.author.id;
    var collected = await msg.awaitReactions(filter, { max: 1, time: 30000, errors: ["time"] });
    await msg.reactions.removeAll().catch(console.error);
    em.setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    if(!collected || !collected.first()) {
      em.setDescription("You didn't react in time!");
      return msg.edit(em);
    }
    let i = Math.floor(Math.random() * 3);
    const index = options.indexOf(collected.first().emoji.name);
    if(i === index) em.setDescription(`You: ${collected.first().emoji.name}\nMe: ${options[i]}\n\nThat's a draw!`);
    else if((i + 1) % 3 === index) em.setDescription(`You: ${collected.first().emoji.name}\nMe: ${options[i]}\n\nCongratulations! You beat me!`);
    else if(i === (index + 1) % 3) em.setDescription(`You: ${collected.first().emoji.name}\nMe: ${options[i]}\n\nYou lost! Better luck next time!`);
    else em.setDescription("Umm...What now?");
    msg.edit(em);
  }
}