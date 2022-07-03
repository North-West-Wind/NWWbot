import { Message } from "discord.js";
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { globalClient as client } from "../../common.js";
import * as Discord from "discord.js";
import { color, msgOrRes, query, roundTo, wait } from "../../function.js";

class BankCommand implements FullCommand {
  name = "bank"
  description = "Display your Discord Economy status. You can also deposit or withdraw money with this command."
  category = 2

  async execute(interaction: NorthInteraction) {
    var results = await query(`SELECT * FROM users WHERE id = '${interaction.user.id}'`);
    if (results.length == 0) await interaction.reply("You don't have any bank account registered. Use `/work` to work and have an account registered!");
    else await this.useEmbeds(interaction, results[0]);
  }

  async run(message: NorthMessage) {
    var results = await query(`SELECT * FROM users WHERE id = '${message.author.id}'`);
    if (results.length == 0) await message.channel.send("You don't have any bank account registered. Use `" + message.prefix + "work` to work and have an account registered!");
    else await this.useEmbeds(message, results[0]);
  }

  async useEmbeds(message: NorthMessage | NorthInteraction, result: any) {
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
      var newResults = await query(`SELECT * FROM users WHERE id = '${author.id}'`);
      cash = newResults[0].currency;
      bank = newResults[0].bank;
      const embed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(author.tag)
        .addField("Bank", "$" + bank, true)
        .addField("Cash", "$" + cash, true)
        .setTimestamp()
        .setFooter({ text: `Have a nice day! :)`, iconURL: message.client.user.displayAvatarURL() });

      await msg.edit({
        embeds: [embed], components: [
          new Discord.MessageActionRow().addComponents(
            new Discord.MessageButton({ label: "Deposit", style: "SUCCESS", customId: "deposit" }),
            new Discord.MessageButton({ label: "Withdraw", style: "DANGER", customId: "withdraw" }),
          )]
      });
      var move: string, noun: string, past: string, multiplier: number;
      const filter = (int: Discord.Interaction) => int.user.id === author.id;
      const collected = await msg.awaitMessageComponent({ filter, time: 30000 }).catch(() => { });
      if (!collected) return;
      if (collected.customId === "deposit") move = "Deposit", noun = "Deposition", past = "Deposited", multiplier = 1;
      else if (collected.customId === "withdraw") move = "Withdraw", noun = "Withdrawal", past = "Withdrawed", multiplier = -1;
      var em = new Discord.MessageEmbed()
          .setColor(color())
          .setTitle(move)
          .setDescription(`Please enter the amount you want to ${move.toLowerCase()}.\n(Can also enter \`all\`, \`half\` or \`quarter\`)`)
          .setTimestamp()
          .setFooter({ text: "Please enter within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
        const menu = new Discord.MessageSelectMenu().setCustomId("predefined").addOptions(["All", "Half", "Quarter"].map(x => ({ label: x, value: x.toLowerCase() })));
        await msg.edit({ embeds: [em], components: [new Discord.MessageActionRow().addComponents(menu), new Discord.MessageActionRow().addComponents(new Discord.MessageButton({ label: "Custom Amount", style: "SECONDARY", customId: "custom" }))] });
        async function invalid(int?: Discord.MessageComponentInteraction | Discord.ModalSubmitInteraction) {
          em
            .setTitle(`${noun} Failed`)
            .setDescription("That is not a valid amount!")
            .setTimestamp()
            .setFooter({ text: "Returning to main page in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
          if (int) await int.update({ embeds: [em] });
          else await msg.edit({ embeds: [em] });
          await wait(3000);
          await MainPage();
        }
        const collected1 = await msg.awaitMessageComponent({ filter, time: 60000 }).catch(() => { });
        if (!collected1) return await invalid();
        var change = 0;
        if (collected1.isSelectMenu()) {
          if (collected1.values[0] === "quarter") change = roundTo(newResults[0].currency / 4, 2);
          else if (collected1.values[0] === "half") change = roundTo(newResults[0].currency / 2, 2);
          else if (collected1.values[0] === "all") change = roundTo(newResults[0].currency, 2);
        } else if (collected1.isButton()) {
          const modal = new Discord.Modal().setTitle(`${move} Custom Amount`);
          modal.addComponents(new Discord.MessageActionRow<Discord.TextInputComponent>().addComponents(new Discord.TextInputComponent().setCustomId("amount").setLabel("Amount")));
          await collected1.showModal(modal);
          const collected2 = await collected1.awaitModalSubmit({ filter, time: 60000 }).catch(() => { });
          if (!collected2) return await invalid();
          const parsed = parseInt(collected2.fields.getTextInputValue("amount"));
          if (isNaN(parsed)) return await invalid(collected2);
          else change = Math.min(newResults[0].currency, parsed);
        }
        change *= multiplier;
        const newCurrency = newResults[0].currency - change;
        const newBank = newResults[0].bank + change;
        try {
          await query(`UPDATE users SET currency = '${newCurrency}', bank = '${newBank}' WHERE id = '${author.id}'`);
          const depositedEmbed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle(`${noun} Successful`)
            .setDescription(`${past} **$${change}** into bank!`)
            .setTimestamp()
            .setFooter({ text: "Returning to main page in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
          await msg.edit({ embeds: [depositedEmbed] });
          await wait(3000);
          await MainPage();
        } catch (err: any) { }
    }
  }
};

const cmd = new BankCommand();
export default cmd;