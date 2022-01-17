import { Message } from "discord.js";
import { RowDataPacket } from "mysql2";
import { Connection } from "mysql2/promise";

import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { globalClient as client } from "../../common";
import * as Discord from "discord.js";
import { color, msgOrRes, wait } from "../../function";

class BankCommand implements SlashCommand {
  name = "bank"
  description = "Display your Discord Economy status. You can also deposit or withdraw money with this command."
  category = 2
  
  async execute(interaction: NorthInteraction) {
    const con = await interaction.client.pool.getConnection();
    var [results] = <RowDataPacket[][]> await con.query(`SELECT * FROM users WHERE id = '${interaction.user.id}'`);
    if (results.length == 0) await interaction.reply("You don't have any bank account registered. Use `/work` to work and have an account registered!");
    else await this.useEmbeds(interaction, con, results[0]);
    con.release();
  }

  async run(message: NorthMessage) {
    const con = await message.pool.getConnection();
    var [results] = <RowDataPacket[][]> await con.query(`SELECT * FROM users WHERE id = '${message.author.id}'`);
    if (results.length == 0) await message.channel.send("You don't have any bank account registered. Use `" + message.prefix + "work` to work and have an account registered!");
    else await this.useEmbeds(message, con, results[0]);
    con.release();
  }

  async useEmbeds(message: NorthMessage | NorthInteraction, con: Connection, result: RowDataPacket) {
    var cash = result.currency;
    var bank = result.bank;
    const author = message instanceof Message ? message.author : message.user;
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(author.tag)
      .setDescription("Economic status\n\n1️⃣Deposit\n2️⃣Withdraw")
      .addField("Bank", "$" + bank)
      .addField("Cash", "$" + cash)
      .setTimestamp()
      .setFooter({ text: `React to navigate.`, iconURL: client.user.displayAvatarURL() });
    var msg = await msgOrRes(message, Embed);
    await msg.react("1️⃣");
    await msg.react("2️⃣");
    await MainPage();
    async function MainPage() {
      var [newResults] = await con.query(`SELECT * FROM users WHERE id = '${author.id}'`);
      cash = newResults[0].currency;
      bank = newResults[0].bank;
      const embed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(author.tag)
        .setDescription("Economic status\n\n1️⃣Deposit\n2️⃣Withdraw")
        .addField("Bank", "$" + bank)
        .addField("Cash", "$" + cash)
        .setTimestamp()
        .setFooter({ text: `Have a nice day! :)`, iconURL: message.client.user.displayAvatarURL() });
      await msg.edit({embeds: [embed]});
      await msg.react("1️⃣");
      await msg.react("2️⃣");
      const filter = (reaction, user) => ["1️⃣", "2️⃣"].includes(reaction.emoji.name) && user.id === author.id;
      var collected = await msg.awaitReactions({ filter, max: 1, time: 30000 });
      msg.reactions.removeAll().catch(() => {});
      if (!collected || !collected.first()) return;
      const reaction = collected.first();
      if (reaction.emoji.name === "1️⃣") {
        var depositEmbed = new Discord.MessageEmbed()
          .setColor(color())
          .setTitle("Deposit")
          .setDescription("Please enter the amount you want to deposit.\n(Can also enter `all`, `half` or `quarter`)")
          .setTimestamp()
          .setFooter({ text: "Please enter within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
        await msg.edit({embeds: [depositEmbed]});
        async function depositNotValid() {
          const depositedEmbed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle("Deposition Failed")
            .setDescription("That is not a valid amount!")
            .setTimestamp()
            .setFooter({ text: "Returning to main page in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
          await msg.edit({embeds: [depositedEmbed]});
          await wait(3000);
          await MainPage();
        }
        const amount = await msg.channel.awaitMessages({ filter: x => x.author.id === author.id,  max: 1, time: 30000 });
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
          await con.query(`UPDATE users SET currency = '${newCurrency}', bank = '${newBank}' WHERE id = '${author.id}'`);
          const depositedEmbed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle("Deposition Successful")
            .setDescription("Deposited **$" + deposits + "** into bank!")
            .setTimestamp()
            .setFooter({ text: "Returning to main page in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
          await msg.edit({embeds: [depositedEmbed]});
          await wait(3000);
          await MainPage();
        } catch (err: any) {
          console.error(err);
          message.channel.send("There was an error trying to fetch data from the database!");
        }
      } else {
        var withdrawEmbed = new Discord.MessageEmbed()
          .setColor(color())
          .setTitle("Withdrawal")
          .setDescription("Please enter the amount you want to withdraw.\n(Can also enter `all`, `half` or `quarter`)")
          .setTimestamp()
          .setFooter({ text: "Please enter within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
        await msg.edit({embeds: [withdrawEmbed]});
        async function withdrawNotValid() {
          const withdrawedEmbed = new Discord.MessageEmbed()
          .setColor(color())
          .setTitle("Withdrawal Failed")
          .setDescription("That is not a valid amount!")
          .setTimestamp()
          .setFooter({ text: "Returning to main page in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
          await msg.edit({embeds: [withdrawedEmbed]});
          await wait(3000);
          await MainPage();
        }
        const amount = await msg.channel.awaitMessages({ filter: x => x.author.id === author.id,  max: 1, time: 30000 });
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
          await con.query(`UPDATE users SET currency = '${newCurrency}', bank = '${newBank}' WHERE id = '${author.id}'`);
          const withdrawedEmbed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle("Withdrawal Successful")
            .setDescription("Withdrawed **$" + withdraws + "** from bank!")
            .setTimestamp()
            .setFooter({ text: "Returning to main page in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
          await msg.edit({embeds: [withdrawedEmbed]});
          await wait(3000);
          await MainPage();
        } catch (err: any) {
          console.error(err);
          message.reply("there was an error trying to fetch data from the database!");
        }
      }
    }
  }
};

const cmd = new BankCommand();
export default cmd;