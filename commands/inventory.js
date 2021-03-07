const Discord = require("discord.js");
const fs = require("fs");
const { wait, color } = require("../function.js");
const { NorthClient } = require("../classes/NorthClient.js");

module.exports = {
  name: "inventory",
  description: "Displays your inventory and allows you to use your purchased items.",
  aliases: ["e"],
  category: 2,
  async execute(message, _args, msg = undefined) {
    const con = await message.pool.getConnection();
    var [result] = await con.query(`SELECT * FROM inventory WHERE id = '${message.author.id}'`);
    var [IResult] = await con.query(`SELECT * FROM shop WHERE guild = '${message.guild?.id}' OR guild = ''`);
    var itemObject = {};
    for (const item of IResult) itemObject[item.id] = 0;
    if (result.length == 1) Object.assign(itemObject, JSON.parse(unescape(result[0].items)));
    con.release();
    let i = 0;
    const em = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(message.author.tag + "'s Inventory")
      .setDescription(IResult.map(x => `**${++i}.** ${x.name} - **${itemObject[x.id]}**`).join("\n"))
      .setTimestamp()
      .setFooter("Type the ID of the item you want to use or anything else to exit.", message.client.user.displayAvatarURL());
    msg = !!msg ? await msg.edit({
      embed: em,
      content: ""
    }) : await message.channel.send(em);
    const collected = await message.channel.awaitMessages(x => x.author.id === message.author.id, {
      max: 1,
      time: 30000
    });
    em.setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    if (!collected.first()) return await msg.edit(em);
    await collected.first().delete();
    const index = parseInt(collected.first().content);
    if (isNaN(index)) return await msg.edit(em);
    var wanted = IResult[index - 1];
    if (!wanted) return await msg.edit(em);;
    em.setTitle(wanted.name)
      .setDescription(`${wanted.description}\nQuantity: **${itemObject[wanted.id]}**\n\n1️⃣ Use\n2️⃣ Return`)
      .setFooter("Use item?", message.client.user.displayAvatarURL());
    await msg.edit(em);
    await msg.react("1️⃣");
    await msg.react("2️⃣");
    const collected2 = await msg.awaitReactions((reaction, user) => ["1️⃣", "2️⃣"].includes(reaction.emoji.name) && user.id === message.author.id, {
      max: 1,
      time: 30000
    })
    msg.reactions.removeAll().catch(NorthClient.storage.error);
    if (!collected2.first()) return msg.edit(em.setColor(color()).setTitle(message.author.tag + "'s Inventory").setDescription(IResult.map(x => `**${++i}.** ${x.name} - **${itemObject[x.id]}**`).join("\n")));
    const r = collected2.first();
    if (r.emoji.name === "1️⃣") {
      if (!itemObject[wanted.id]) itemObject[wanted.id] = 0;
      if (itemObject[wanted.id] < 1) {
        msg.reactions.removeAll().catch(NorthClient.storage.error);
        em.setDescription("You cannot use this item because you don't have any.").setFooter("You can't do this.", message.client.user.displayAvatarURL());
        return msg.edit(em);
      }
      if (itemObject[wanted.id].guild === "") {
        const itemFiles = fs.readdirSync("../items").filter(file => file.endsWith(".js"));
        const itemFile = itemFiles.find(x => x.slice(0, -3) === wanted.name.replace(/ /g, ""));
        const {
          run
        } = require(`../items/${itemFile}`);
        await run(message, msg, em, itemObject);
      } else {
        em.setFooter("Using item...", message.client.user.displayAvatarURL());
        const requiredArgs = wanted.args.split(/ +/).filter(s => s != "");
        var args = [];
        if (requiredArgs.length > 0) {
          em.setDescription(`Please input the following arguments and separate them by line breaks:\n**${requiredArgs.join(" ")}**`);
          await msg.edit(em);
          const collected = await message.channel.awaitMessages(x => x.author.id === message.author.id, {
            max: 1,
            time: 120000
          });
          if (collected.first()) await collected.first().delete();
          if (!collected.first()?.content) {
            em.setDescription(`You didn't input the arguments in time! Preserving item...`)
              .setFooter("Returning to main menu in 3 seconds...", message.client.user.displayAvatarURL());
            await msg.edit(em);
            await wait(3000);
            return await this.execute(message, _args, msg);
          }
          args = collected.first().content.split(/ +/);
          if (args.length < requiredArgs.length) {
            em.setDescription(`The input arguments are less than the required arguments! Preserving item...`)
              .setFooter("Returning to main menu in 3 seconds...", message.client.user.displayAvatarURL());
            await msg.edit(em);
            await wait(3000);
            return await this.execute(message, _args, msg);
          }
        }
        var run = wanted.run;
        run = run.replace(/{args}/ig, args.join(" "));
        const replaceArgs = run.match(/{( +)?args( +)?\[( +)?\d+( +)?\]( +)?}/ig);
        if (replaceArgs)
          for (const replaceArg of replaceArgs) {
            const index = parseInt(replaceArg.match(/\d+/)[0]);
            const newArg = args[index];
            run = run.replace(replaceArg, newArg);
          }
        run = run.replace(/{user}/ig, `<@${message.author.id}>`);
        run = run.replace(/{channel}/ig, `<#${message.channel.id}>`);
        const commands = run.match(/{( +)?command +.+( +)?}/ig);
        if (commands)
          for (const command of commands) {
            const spliced = command.replace(/({( +)?command( +)|})/ig, "");
            const cArgs = spliced.split(/ +/);
            const commandName = cArgs.shift().toLowerCase();
            const c = NorthClient.storage.commands.get(commandName) || NorthClient.storage.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
            if (!c) {
              em.setDescription(`Failed to use the item! Please ask your server managers to fix this! Preserving item...`)
                .setFooter("Returning to main menu in 3 seconds...", message.client.user.displayAvatarURL());
              await msg.edit(em);
              await wait(3000);
              return await this.execute(message, _args, msg);
            }
            try {
              if (c.category === 8) throw new Error("Do NOT run music command with items.");
              else await c.execute(message, cArgs);
            } catch (error) {
              NorthClient.storage.error(error);
              em.setDescription(`Failed to use the item! Please contact NorthWestWind#1885 to fix this! Preserving item...`)
                .setFooter("Returning to main menu in 3 seconds...", message.client.user.displayAvatarURL());
              await msg.edit(em);
              await wait(3000);
              return await this.execute(message, _args, msg);
            }
            run = run.replace(command, "");
          }
        if (run.length > 0) await message.channel.send(run);
        itemObject[wanted.id] -= 1;
        await message.pool.query(`UPDATE inventory SET items = '${JSON.stringify(itemObject)}' WHERE id =  '${message.author.id}'`);
        em.setTitle(`Used ${wanted.name}`)
          .setDescription("Returning to main menu in 3 seconds...")
          .setFooter("Please be patient.", message.client.user.displayAvatarURL());
        await msg.edit(em);
        await wait(3000);
        return await this.execute(message, _args, msg);
      }
    } else return await this.execute(message, _args, msg);
  }
};
