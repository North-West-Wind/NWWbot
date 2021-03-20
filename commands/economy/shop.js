const Discord = require("discord.js");
const { wait, ID, genPermMsg, color } = require("../../function.js");
const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");

module.exports = {
  name: "shop",
  description: "Spend the money you gained from work on the server shop.",
  usage: "[subcommand]",
  category: 2,
  permissions: 32,
  subcommands: ["add"],
  subdesc: ["Adds a new item to the server shop."],
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "menu", "View the shop menu."),
    new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "add", "Adds a new item to the server shop.")
  ]),
  async slash() {
    return InteractionResponse.sendMessage("Opening shop...");
  },
  async postSlash(client, interaction, args) {
    await InteractionResponse.deleteMessage(client, interaction);
    const message = await InteractionResponse.createFakeMessage(client, interaction);
    await this.execute(message, args[0].name === "add" ? args[0].name : undefined);
  },
  async execute(message, args) {
    if (args[0] && args[0] == "add") return await this.add(message);
    const c = color();
    const pool = message.pool;
    mainMenu();
    async function mainMenu(msg = undefined) {
      var mesg = msg;
      var [results] = await pool.query(`SELECT * FROM currency WHERE user_id = '${message.author.id}' AND guild = '${message.guild.id}'`);
      var cash = 0;
      if (results.length == 1) cash = results[0].currency;
      const shop = new Discord.MessageEmbed()
        .setTimestamp()
        .setColor(c)
        .setTitle("Welcome to the shop!")
        .setDescription("Choose an action:\n\n1️⃣ Shop\n2️⃣ Leave")
        .setFooter("You have $" + cash, message.author.displayAvatarURL());

      const leave = new Discord.MessageEmbed()
        .setTimestamp()
        .setColor(c)
        .setTitle("You were told to leave.")
        .setDescription("The staff waited too long and told you to leave.")
        .setFooter("You have $" + cash, message.author.displayAvatarURL());

      if (!mesg) var msg = await message.channel.send(shop);
      else var msg = await mesg.edit(shop);

      await msg.react("1️⃣");
      await msg.react("2️⃣");

      const filter = (reaction, user) => ["1️⃣", "2️⃣"].includes(reaction.emoji.name) && user.id === message.author.id;
      const collected = await msg.awaitReactions(filter, { max: 1, idle: 60000, error: ["time"] });
      const reaction = collected.first();
      msg.reactions.removeAll().catch(NorthClient.storage.error);
      if (!reaction) return await msg.edit(leave);

      async function shopMenu() {
        const allItems = [];
        var [results] = await pool.query(`SELECT * FROM shop WHERE guild = '${message.guild.id}' OR guild = ''`);
        for (let i = 0; i < results.length; i++) allItems.push(`**${i + 1}.** ${results[i].name} - **\$${results[i].buy_price}** : **${results[i].stock_limit > -1 ? results[i].stock_limit : "∞"}**`);

        const menu = new Discord.MessageEmbed()
          .setColor(c)
          .setTitle("Shop Menu")
          .setDescription("Type the ID to buy or `0` to cancel.\n\n" + allItems.join("\n"))
          .setTimestamp()
          .setFooter("You have $" + cash, message.author.displayAvatarURL());
        await msg.edit(menu);
        var collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000 });
        if (!collected.first()) {
          menu.setDescription("30 seconds passed. Returning to main menu in 3 seconds...")
            .setFooter("Please be patient.", message.client.user.displayAvatarURL());
          await msg.edit(menu);
          return setTimeout(() => mainMenu(msg), 3000);
        }
        collected.first().delete();
        const index = parseInt(collected.first().content);
        if (isNaN(index)) {
          menu.setDescription("Invalid number. Returning to main menu in 3 seconds...")
            .setFooter("Please be patient.", message.client.user.displayAvatarURL());
          await msg.edit(menu);
          return setTimeout(() => mainMenu(msg), 3000);
        }
        if (index === 0) {
          menu.setDescription("Cancelled action. Returning to main menu in 3 seconds...")
            .setFooter("Please be patient.", message.client.user.displayAvatarURL());
          await msg.edit(menu);
          return setTimeout(() => mainMenu(msg), 3000);
        }
        viewItem(msg, results[index - 1]?.id);
      }

      async function viewItem(msg, id) {
        var [result] = await pool.query("SELECT * FROM shop WHERE id = '" + id + "'");
        if (result.length == 0) {
          var itemEmbed = new Discord.MessageEmbed()
            .setTimestamp()
            .setColor(c)
            .setTitle("No item found!")
            .setDescription("Returning to main menu in 3 seconds...")
            .setFooter("Please be patient.", message.client.user.displayAvatarURL());
          await msg.edit(itemEmbed);
          return setTimeout(() => mainMenu(msg), 3000);
        } else {
          var itemEmbed = new Discord.MessageEmbed()
            .setTimestamp()
            .setColor(c)
            .setTitle(result[0].name)
            .setDescription(`Buy Price: **$${result[0].buy_price}**\n${result[0].description}\nStock: **${result[0].stock_limit > -1 ? result[0].stock_limit : "∞"}**\n\n1️⃣ Buy\n2️⃣ Return`)
            .setFooter("Please answer within 30 seconds.", message.client.user.displayAvatarURL());

          await msg.edit(itemEmbed);
          await msg.react("1️⃣");
          await msg.react("2️⃣");

          var collected = await msg.awaitReactions(filter, { max: 1, idle: 30000 });
          const reaction = collected.first();
          if (!reaction) {
            itemEmbed.setTitle("Please leave if you are not buying stuff!")
              .setDescription("Returning to main menu in 3 seconds...")
              .setFooter("Please be patient.", message.client.user.displayAvatarURL());
            await msg.edit(itemEmbed);
            setTimeout(() => mainMenu(msg), 3000);
          }
          msg.reactions.removeAll().catch(NorthClient.storage.error);

          if (reaction.emoji.name === "1️⃣") {
            if (result[0].stock_limit == 0) {
              itemEmbed.setTitle(`${result[0].name} is out of stock!`)
                .setDescription("Returning to main menu in 3 seconds...")
                .setFooter("Please be patient.", message.client.user.displayAvatarURL());
              await msg.edit(itemEmbed);
              await wait(3000);
              return await mainMenu(msg);
            }
            if (Number(cash) < Number(result[0].buy_price)) {
              itemEmbed.setTitle("You don't have enough money to buy " + result[0].name + "!")
                .setDescription("Returning to main menu in 3 seconds...")
                .setFooter("Please be patient.", message.client.user.displayAvatarURL());
              await msg.edit(itemEmbed);
              setTimeout(() => mainMenu(msg), 3000);
            } else {
              itemEmbed.setTitle("You bought " + result[0].name + "!")
                .setDescription("Returning to main menu in 3 seconds...")
                .setFooter("Please be patient.", message.client.user.displayAvatarURL());
              const [IResult] = await pool.query(`SELECT * FROM inventory WHERE id = '${message.author.id}'`);
              if (IResult.length == 1 && result[0].buy_limit > 0) {
                const items = JSON.parse(unescape(IResult[0].items));
                if (!items[result[0].id]) items[result[0].id] = 0;
                items[result[0].id] += 1;
                if (items[result[0].id] > result[0].buy_limit) {
                  itemEmbed.setTitle(`You can only get ${result[0].buy_limit} of this item!`)
                    .setDescription("Returning to main menu in 3 seconds...")
                    .setFooter("Please be patient.", message.client.user.displayAvatarURL());
                  await msg.edit(itemEmbed);
                  await wait(3000);
                  return await mainMenu(msg);
                }
              }
              if (result[0].must_use) {
                itemEmbed.setDescription("However, you must use this item immediately.")
                  .setFooter("Running in 3 seconds...", message.client.user.displayAvatarURL());
                await msg.edit(itemEmbed);
                await wait(3000);
                itemEmbed.setFooter("Using item...", message.client.user.displayAvatarURL());
                const requiredArgs = result[0].args.split(/ +/).filter(s => s != "");;
                var args = [];
                if (requiredArgs.length > 0) {
                  itemEmbed.setDescription(`Please input the following arguments and separate them by line breaks:\n**${requiredArgs.join(" ")}**`);
                  await msg.edit(itemEmbed);
                  const collected = await message.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 120000 });
                  if (collected.first()) await collected.first().delete();
                  if (!collected.first()?.content) {
                    itemEmbed.setDescription(`You didn't input the arguments in time! Cancelling purchase...`)
                      .setFooter("Returning to main menu in 3 seconds...", message.client.user.displayAvatarURL());
                    await msg.edit(itemEmbed);
                    await wait(3000);
                    return await mainMenu(msg);
                  }
                  args = collected.first().content.split(/ +/);
                  if (args.length < requiredArgs.length) {
                    itemEmbed.setDescription(`The input arguments are less than the required arguments! Cancelling purchase...`)
                      .setFooter("Returning to main menu in 3 seconds...", message.client.user.displayAvatarURL());
                    await msg.edit(itemEmbed);
                    await wait(3000);
                    return await mainMenu(msg);
                  }
                }
                var run = result[0].run;
                run = run.replace(/{user}/ig, `<@${message.author.id}>`);
                run = run.replace(/{channel}/ig, `<#${message.channel.id}>`);
                run = run.replace(/{args}/ig, args.join(" "));
                const replaceArgs = run.match(/{( +)?args( +)?\[( +)?\d+( +)?\]( +)?}/ig);
                if (replaceArgs) for (const replaceArg of replaceArgs) {
                  const index = parseInt(replaceArg.match(/\d+/)[0]);
                  const newArg = args[index];
                  run = run.replace(replaceArg, newArg);
                }
                const commands = run.match(/{( +)?command +.+( +)?}/ig);
                if (commands) for (const command of commands) {
                  const spliced = command.replace(/({( +)?command( +)|})/ig, "");
                  const cArgs = spliced.split(/ +/);
                  const commandName = cArgs.shift().toLowerCase();
                  const c = NorthClient.storage.commands.get(commandName) || NorthClient.storage.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
                  if (!c) {
                    itemEmbed.setDescription(`Failed to use the item! Cancelling purchase...`)
                      .setFooter("Returning to main menu in 3 seconds...", message.client.user.displayAvatarURL());
                    await msg.edit(itemEmbed);
                    await wait(3000);
                    return await mainMenu(msg);
                  }
                  try {
                    await c.execute(message, cArgs);
                  } catch (error) {
                    NorthClient.storage.error(error);
                    itemEmbed.setDescription(`Failed to use the item! Cancelling purchase...`)
                      .setFooter("Returning to main menu in 3 seconds...", message.client.user.displayAvatarURL());
                    await msg.edit(itemEmbed);
                    await wait(3000);
                    return await mainMenu(msg);
                  }
                  run = run.replace(command, "");
                }
                if (run.length > 0) await message.channel.send(run);
              }
              var paid = cash - result[0].buy_price;
              const con = await pool.getConnection();
              try {
                await con.query(`UPDATE currency SET currency = ${paid} WHERE user_id = '${message.author.id}' AND guild = '${message.guild.id}'`);
                if (!result[0].must_use) {
                  if (IResult.length === 0) {
                    const items = {};
                    items[result[0].id] = 0;
                    items[result[0].id] += 1;
                    await con.query(`INSERT INTO inventory VALUES('${message.author.id}', '${escape(JSON.stringify(items))}')`);
                  } else {
                    const items = JSON.parse(unescape(IResult[0].items));
                    if (!items[result[0].id]) items[result[0].id] = 0;
                    items[result[0].id] += 1;
                    await con.query(`UPDATE inventory SET items = '${escape(JSON.stringify(items))}' WHERE id = '${message.author.id}'`);
                  }
                }
              } catch (err) {
                NorthClient.storage.error(err);
                itemEmbed.setTitle("Failed to purchase!");
              }
              await msg.edit(itemEmbed);
              setTimeout(() => mainMenu(msg), 3000);
              con.release();
            }
          } else if (reaction.emoji.name === "2️⃣") {
            itemEmbed.setTitle("You want to look at the menu again.")
              .setDescription("Returning to main menu in 3 seconds...")
              .setFooter("Please be patient.", message.client.user.displayAvatarURL());
            await msg.edit(itemEmbed);
            setTimeout(() => mainMenu(msg), 3000);
          }
        }
      }

      const manualLeave = new Discord.MessageEmbed()
        .setTimestamp()
        .setColor(c)
        .setTitle("Goodbye!")
        .setDescription("said the staff.")
        .setFooter("You have $" + cash, message.author.displayAvatarURL());
      if (!reaction) {
        msg.reactions.removeAll().catch(() => { });
        return await msg.edit(leave);
      }
      if (reaction.emoji.name === "1️⃣") shopMenu();
      else if (reaction.emoji.name === "2️⃣") msg.edit(manualLeave);
    }
  },
  async add(message) {
    if (!message.guild) return await message.channel.send("Please don't use this in Direct Message.");
    if (!message.member.permissions.has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 0));
    var msg = await message.channel.send("Please enter the name and the description of the item. (Break a line to separate them) (Description can be multi-line)");
    const collected = await message.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 120000 });
    if (collected.first()) await collected.first().delete();
    if (!collected.first()?.content) return await msg.edit("I cannot read the message!");
    if (collected.first().content.toLowerCase() == "cancel") return await msg.edit("Action cancelled.");
    const name = collected.first().content.split("\n")[0];
    const description = collected.first().content.split("\n").slice(1).join("\n");
    await msg.edit(`Received item with the name **${name}**.\nNow, please enter the buying and selling price of the item. (Use space to separate them) (Both should not have more than 2 decimal places)`);
    const collected1 = await message.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 60000 });
    if (collected1.first()) await collected1.first().delete();
    if (!collected1.first()?.content) return await msg.edit("I cannot read the message!");
    if (collected1.first().content.toLowerCase() == "cancel") return await msg.edit("Action cancelled.");
    const prices = collected1.first().content.split(/ +/);
    const buyPrice = Math.round((Number(prices[0]) + Number.EPSILON) * 100) / 100;
    if (isNaN(buyPrice)) return await msg.edit("The buying price entered is not valid.");
    var sellPrice = buyPrice;
    if (prices.length < 2) await msg.edit("Selling price missing. I'll assume that it equals to the buying price.");
    else sellPrice = Math.round((Number(prices[1]) + Number.EPSILON) * 100) / 100;
    if (isNaN(sellPrice)) return await msg.edit("The selling price entered is not valid.");
    await msg.edit(`**${name}** will be able to be bought with **$${buyPrice}** and sold at **$${sellPrice}**.\nNext, please enter the purchase limit and the stock limit of it. (Use space to separate them) (negative number for infinity)`);
    const collected2 = await message.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000 });
    if (collected2.first()) await collected2.first().delete();
    if (!collected2.first()?.content) return await msg.edit("I cannot read the message!");
    if (collected2.first().content.toLowerCase() == "cancel") return await msg.edit("Action cancelled.");
    const limits = collected2.first().content.split(/ +/);
    var limit = 0;
    if (isNaN(parseInt(limits[0]))) await msg.edit("The purchase limit entered is not valid. I'll take that as limitless.").then(() => wait(3000));
    else limit = parseInt(limits[0]);
    var stock = -1;
    if (!limits[1] || isNaN(parseInt(limits[1]))) await msg.edit("The stock limit entered is not valid. I'll take that as limitless.").then(() => wait(3000));
    else stock = parseInt(limits[1]);
    await msg.edit(`All users will be able to purchase **${limit < 1 ? "limitlessly" : `${limit} ${name}${limit > 1 ? "s" : ""}`}** and there will be **${stock < 0 ? "infinite stocks" : `${stock} in stock`}**.\nTo finish up, please enter the arguments required ("nothing" for no arguments) and what to do when the user uses this item. (Use line break to separate them) (The code can be multi-line) (You may refer to https://northwestwind.ml/shop_help.php)`);
    const collected3 = await message.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 300000 });
    if (collected3.first()) await collected3.first().delete();
    if (!collected3.first()?.content) return await msg.edit("I cannot read the message!");
    if (collected3.first().content.toLowerCase() == "cancel") return await msg.edit("Action cancelled.");
    const args = collected3.first().content.split("\n")[0].toLowerCase() === "nothing" ? "" : collected3.first().content.split("\n")[0];
    const command = collected3.first().content.split("\n").slice(1).join("\n");
    await msg.edit(`Code to run has been set.\nFinally, if the user must use the upon purchase, type \`1\` or any larger number.\nIf the user can hold the item in their inventory, type \`0\`.`);
    const collected4 = await message.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 300000 });
    if (collected4.first()) await collected4.first().delete();
    if (!collected4.first()?.content) return await msg.edit("I cannot read the message!");
    if (collected4.first().content.toLowerCase() == "cancel") return await msg.edit("Action cancelled.");
    const mustUse = !!parseInt(collected4.first().content);
    await msg.edit(`Added item **${name}** to the server shop for $${buyPrice}. Each user will be able to own ${limit < 1 ? "as many as they want" : `${limit} of them`}. Customers ${mustUse ? "must" : "will not have to"} use them upon purchase.`);
    try {
      await message.pool.query(`INSERT INTO shop VALUES('${await ID()}', '${message.guild.id}', '${name}', '${description}', ${buyPrice}, ${sellPrice}, ${limit}, ${stock}, ${mustUse ? 1 : 0}, '${command}', '${args}')`);
      await message.channel.send("Item added to database!");
    } catch (err) {
      NorthClient.storage.error(err);
      await message.reply("there was an error trying to add the item to the database!");
    }
  }
};
