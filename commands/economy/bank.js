const Discord = require("discord.js");
const { color } = require("../../function");
const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, InteractionResponse } = require("../../classes/Slash.js");

module.exports = {
  name: "bank",
  description: "Display your Discord Economy status. You can also deposit or withdraw money with this command.",
  category: 2,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports),
  async slash() {
    return InteractionResponse.sendMessage("Finding your account...");
  },
  async postSlash(client, interaction) {
    await InteractionResponse.deleteMessage(client, interaction);
    const message = await InteractionResponse.createFakeMessage(client, interaction);
    await this.execute(message);
  },
  async execute(message) {
    const con = await message.pool.getConnection();
    var [results] = await con.query(`SELECT * FROM currency WHERE user_id = '${message.author.id}' AND guild = '${message.guild.id}'`);
    if (results.length == 0) await message.channel.send("You don't have any bank account registered. Use `" + message.prefix + "work` to work and have an account registered!");
    else {
      var cash = results[0].currency;
      var bank = results[0].bank;
      const Embed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(message.author.tag)
        .setDescription("Economic status\n\n1️⃣Deposit\n2️⃣Withdraw")
        .addField("Bank", "$" + bank)
        .addField("Cash", "$" + cash)
        .setTimestamp()
        .setFooter(`You can try to "${message.prefix}${module.exports.name} deposit" or "${message.prefix}${module.exports.name} withdraw"!`, message.client.user.displayAvatarURL());
      var msg = await message.channel.send(Embed);
      await msg.react("1️⃣");
      await msg.react("2️⃣");
      await MainPage();
      async function MainPage() {
        var [newResults] = await con.query(`SELECT * FROM currency WHERE user_id = '${message.author.id}' AND guild = '${message.guild.id}'`);
        cash = newResults[0].currency;
        bank = newResults[0].bank;
        const embed = new Discord.MessageEmbed()
          .setColor(color())
          .setTitle(message.author.tag)
          .setDescription("Economic status\n\n1️⃣Deposit\n2️⃣Withdraw")
          .addField("Bank", "$" + bank)
          .addField("Cash", "$" + cash)
          .setTimestamp()
          .setFooter(`Have a nice day! :)`, message.client.user.displayAvatarURL());
        msg.edit(embed);
        await msg.react("1️⃣");
        await msg.react("2️⃣");
        const filter = (reaction, user) => ["1️⃣", "2️⃣"].includes(reaction.emoji.name) && user.id === message.author.id;
        var collected = await msg.awaitReactions(filter, { max: 1, time: 30000 });
        msg.reactions.removeAll().catch(NorthClient.storage.error);
        if (!collected || !collected.first()) return;
        const reaction = collected.first();
        if (reaction.emoji.name === "1️⃣") {
          var depositEmbed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle("Deposit")
            .setDescription("Please enter the amount you want to deposit.\n(Can also enter `all`, `half` or `quarter`)")
            .setTimestamp()
            .setFooter("Please enter within 60 seconds.", message.client.user.displayAvatarURL());
          await msg.edit(depositEmbed);
          async function depositNotValid() {
            const depositedEmbed = new Discord.MessageEmbed()
              .setColor(color())
              .setTitle("Deposition Failed")
              .setDescription("That is not a valid amount!")
              .setTimestamp()
              .setFooter("Returning to main page in 3 seconds...", message.client.user.displayAvatarURL());
            await msg.edit(depositedEmbed);
            setTimeout(() => MainPage(), 3000);
          }
          const amount = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000 });
          if (!amount.first() || !amount.first().content) return await depositNotValid();
          amount.first().delete().catch(() => { });
          var deposits = 0;
          if (isNaN(parseInt(amount.first().content))) {
            if (amount.first().content === "quarter") deposits = Math.round((Number(newResults[0].currency) / 4 + Number.EPSILON) * 100) / 100;
            else if (amount.first().content === "half") deposits = Math.round((Number(newResults[0].currency) / 2 + Number.EPSILON) * 100) / 100;
            else if (amount.first().content === "all") deposits = Math.round((Number(newResults[0].currency) + Number.EPSILON) * 100) / 100;
            else return await depositNotValid();
          } else deposits = Number(amount.first().content) > Number(newResults[0].currency) ? Number(newResults[0].currency) : Number(amount.first().content);
          const newCurrency = Number(newResults[0].currency) - deposits;
          const newBank = Number(newResults[0].bank) + deposits;
          try {
            await con.query(`UPDATE currency SET currency = '${newCurrency}', bank = '${newBank}' WHERE user_id = '${message.author.id}' AND guild = '${message.guild.id}'`);
            const depositedEmbed = new Discord.MessageEmbed()
              .setColor(color())
              .setTitle("Deposition Successful")
              .setDescription("Deposited **$" + deposits + "** into bank!")
              .setTimestamp()
              .setFooter("Returning to main page in 3 seconds...", message.client.user.displayAvatarURL());
            await msg.edit(depositedEmbed);
            setTimeout(() => MainPage(), 3000);
          } catch (err) {
            NorthClient.storage.error(err);
            message.reply("there was an error trying to fetch data from the database!");
          }
        } else {
          var withdrawEmbed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle("Withdrawal")
            .setDescription("Please enter the amount you want to withdraw.\n(Can also enter `all`, `half` or `quarter`)")
            .setTimestamp()
            .setFooter("Please enter within 60 seconds.", message.client.user.displayAvatarURL());
          await msg.edit(withdrawEmbed);
          async function withdrawNotValid() {
            const withdrawedEmbed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle("Withdrawal Failed")
            .setDescription("That is not a valid amount!")
            .setTimestamp()
            .setFooter("Returning to main page in 3 seconds...", message.client.user.displayAvatarURL());
            await msg.edit(withdrawedEmbed);
            setTimeout(() => MainPage(), 3000);
          }
          const amount = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000 });
          if (!amount.first() || !amount.first().content) return await withdrawNotValid();
          amount.first().delete().catch(() => { });
          var withdraws = 0;
          if (isNaN(parseInt(amount.first().content))) {
            if (amount.first().content === "quarter") withdraws = Math.round((Number(newResults[0].bank) / 4 + Number.EPSILON) * 100) / 100;
            else if (amount.first().content === "half") withdraws = Math.round((Number(newResults[0].bank) / 2 + Number.EPSILON) * 100) / 100;
            else if (amount.first().content === "all") withdraws = Math.round((Number(newResults[0].bank) + Number.EPSILON) * 100) / 100;
            else return await withdrawNotValid();
          } else withdraws = Number(amount.first().content) > Number(newResults[0].bank) ? Number(newResults[0].bank) : Number(amount.first().content);
          const newCurrency = Number(newResults[0].currency) + withdraws;
          const newBank = Number(newResults[0].bank) - withdraws;
          try {
            await con.query(`UPDATE currency SET currency = '${newCurrency}', bank = '${newBank}' WHERE user_id = '${message.author.id}' AND guild = '${message.guild.id}'`);
            const withdrawedEmbed = new Discord.MessageEmbed()
              .setColor(color())
              .setTitle("Withdrawal Successful")
              .setDescription("Withdrawed **$" + withdraws + "** from bank!")
              .setTimestamp()
              .setFooter("Returning to main page in 3 seconds...", message.client.user.displayAvatarURL());
            await msg.edit(withdrawedEmbed);
            setTimeout(() => MainPage(), 3000);
          } catch (err) {
            NorthClient.storage.error(err);
            message.reply("there was an error trying to fetch data from the database!");
          }
        }
      }
    }
    con.release();
  }
};
