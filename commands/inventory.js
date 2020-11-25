const Discord = require("discord.js");
const fs = require("fs");

module.exports = {
  name: "inventory",
  description: "Display your inventory.",
  aliases: ["e"],
  category: 2,
  async execute(message) {
    const con = await message.pool.getConnection();
    var [result] = await con.query(`SELECT * FROM inventory WHERE id = '${message.author.id}'`);
    var itemObject;
    if (result.length == 0) itemObject = {
      "1": 0,
      "2": 0
    };
    else itemObject = JSON.parse(unescape(result[0].items));
    var [IResult] = await con.query("SELECT * FROM shop");
    con.release();
    var item = IResult.map(x => `**${x.id}.** ${x.name} - **${itemObject[x.id.toString()]}**`);
    const em = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle(message.author.tag + "'s Inventory")
      .setDescription(item.join("\n"))
      .setTimestamp()
      .setFooter("Type the ID of the item you want to use or `0` to exit.", message.client.user.displayAvatarURL());
    const backupEm = em;
    backupEm.setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    var msg = await message.channel.send(em);
    const collected = await message.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] });
    em.setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    if (!collected.first()) return await msg.edit(em);
    await collected.first().delete();
    if (isNaN(parseInt(collected.first().content))) return await msg.edit(em);
    var wanted = IResult.find(x => x.id === parseInt(collected.first().content));
    if (!wanted) return;
    em.setTitle(wanted.name)
      .setDescription(`${wanted.description}\nQuantity: **${itemObject[wanted.id.toString()]}**\n\n1️⃣ Use\n2️⃣ Return`)
      .setFooter("Use item?", message.client.user.displayAvatarURL());
    await msg.edit(em);
    await msg.react("1️⃣");
    await msg.react("2️⃣");
    const collected2 = await msg.awaitReactions((reaction, user) => ["1️⃣", "2️⃣"].includes(reaction.emoji.name) && user.id === message.author.id, { max: 1, time: 30000, errors: ["time"] })
    msg.reactions.removeAll().catch(console.error);
    if (!collected2.first()) return msg.edit(backupEm);
    const r = collected2.first();
    if (r.emoji.name === "1️⃣") {
      if (itemObject[wanted.id.toString()] < 1) {
        msg.reactions.removeAll().catch(console.error);
        em.setDescription("You cannot use this item because you don't have any.").setFooter("You can't do this.", message.client.user.displayAvatarURL());
        return msg.edit(em);
      }
      const itemFiles = fs.readdirSync("../items").filter(file => file.endsWith(".js"));
      const itemFile = itemFiles.find(x => x.slice(0, -3) === wanted.name.replace(/ /g, ""));
      const { run } = require(`../items/${itemFile}`);
      await run(message, msg, em, itemObject);
    } else return await msg.edit(backupEm);
  }
};
