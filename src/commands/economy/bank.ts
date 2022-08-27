import { ButtonStyle, Message, MessageActionRowComponentBuilder } from "discord.js";
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { globalClient as client } from "../../common.js";
import * as Discord from "discord.js";
import { color, msgOrRes, query, roundTo, wait } from "../../function.js";

class BankCommand implements FullCommand {
  name = "bank"
  description = "Display your Discord Economy status. You can also deposit or withdraw money with this command."
  category = 2

  async execute(interaction: NorthInteraction) {
    const results = await query(`SELECT * FROM users WHERE id = '${interaction.user.id}'`);
    if (results.length == 0) await interaction.reply("You don't have any bank account registered. Use `/work` to work and have an account registered!");
    else await this.useEmbeds(interaction, results[0]);
  }

  async run(message: NorthMessage) {
    const results = await query(`SELECT * FROM users WHERE id = '${message.author.id}'`);
    if (results.length == 0) await message.channel.send("You don't have any bank account registered. Use `" + message.prefix + "work` to work and have an account registered!");
    else await this.useEmbeds(message, results[0]);
  }

  async useEmbeds(message: NorthMessage | NorthInteraction, result: any) {
    let cash = result.currency;
    let bank = result.bank;
    const author = message instanceof Message ? message.author : message.user;
    const Embed = new Discord.EmbedBuilder()
      .setColor(color())
      .setTitle(author.tag)
      .setDescription("Economic status\n\n1️⃣Deposit\n2️⃣Withdraw")
      .addFields([
        { name: "Bank", value: "$" + bank },
        { name: "Cash", value: "$" + cash }
      ])
      .setTimestamp()
      .setFooter({ text: `React to navigate.`, iconURL: client.user.displayAvatarURL() });
    const msg = await msgOrRes(message, Embed);
    await msg.react("1️⃣");
    await msg.react("2️⃣");
    await MainPage();
    async function MainPage() {
      const newResults = await query(`SELECT * FROM users WHERE id = '${author.id}'`);
      cash = newResults[0].currency;
      bank = newResults[0].bank;
      const embed = new Discord.EmbedBuilder()
        .setColor(color())
        .setTitle(author.tag)
        .addFields([
          { name: "Bank", value: "$" + bank, inline: true },
          { name: "Cash", value: "$" + cash, inline: true }
        ])
        .setTimestamp()
        .setFooter({ text: `Have a nice day! :)`, iconURL: message.client.user.displayAvatarURL() });

      await msg.edit({
        embeds: [embed], components: [
          new Discord.ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new Discord.ButtonBuilder({ label: "Deposit", style: ButtonStyle.Success, customId: "deposit" }),
            new Discord.ButtonBuilder({ label: "Withdraw", style: ButtonStyle.Danger, customId: "withdraw" }),
          )]
      });
      let move: string, noun: string, past: string, multiplier: number;
      const filter = (int: Discord.Interaction) => int.user.id === author.id;
      const collected = await msg.awaitMessageComponent({ filter, time: 30000 }).catch(() => { });
      if (!collected) return;
      if (collected.customId === "deposit") move = "Deposit", noun = "Deposition", past = "Deposited", multiplier = 1;
      else if (collected.customId === "withdraw") move = "Withdraw", noun = "Withdrawal", past = "Withdrawed", multiplier = -1;
      const em = new Discord.EmbedBuilder()
        .setColor(color())
        .setTitle(move)
        .setDescription(`Please enter the amount you want to ${move.toLowerCase()}.\n(Can also enter \`all\`, \`half\` or \`quarter\`)`)
        .setTimestamp()
        .setFooter({ text: "Please enter within 60 seconds.", iconURL: message.client.user.displayAvatarURL() });
      const menu = new Discord.SelectMenuBuilder().setCustomId("predefined").addOptions(["All", "Half", "Quarter"].map(x => ({ label: x, value: x.toLowerCase() })));
      await msg.edit({ embeds: [em], components: [new Discord.ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu), new Discord.ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(new Discord.ButtonBuilder({ label: "Custom Amount", style: ButtonStyle.Secondary, customId: "custom" }))] });
      async function invalid(int?: Discord.MessageComponentInteraction | Discord.ModalSubmitInteraction) {
        em
          .setTitle(`${noun} Failed`)
          .setDescription("That is not a valid amount!")
          .setTimestamp()
          .setFooter({ text: "Returning to main page in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
        if (int) await int.editReply({ embeds: [em] });
        else await msg.edit({ embeds: [em] });
        await wait(3000);
        await MainPage();
      }
      const collected1 = await msg.awaitMessageComponent({ filter, time: 60000 }).catch(() => { });
      if (!collected1) return await invalid();
      let change = 0;
      if (collected1.isSelectMenu()) {
        if (collected1.values[0] === "quarter") change = roundTo(newResults[0].currency / 4, 2);
        else if (collected1.values[0] === "half") change = roundTo(newResults[0].currency / 2, 2);
        else if (collected1.values[0] === "all") change = roundTo(newResults[0].currency, 2);
      } else if (collected1.isButton()) {
        const modal = new Discord.ModalBuilder().setTitle(`${move} Custom Amount`);
        modal.addComponents(new Discord.ActionRowBuilder<Discord.TextInputBuilder>().addComponents(new Discord.TextInputBuilder().setCustomId("amount").setLabel("Amount")));
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
        const depositedEmbed = new Discord.EmbedBuilder()
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
}

const cmd = new BankCommand();
export default cmd;