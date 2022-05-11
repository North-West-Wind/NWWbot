import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { color, msgOrRes, query, wait } from "../../function.js";
import * as Discord from "discord.js";

import { globalClient as client } from "../../common.js";
import { RowDataPacket } from "mysql2";

class InventoryCommand implements SlashCommand {
  name = "inventory"
  description = "Displays your inventory and allows you to use your purchased items."
  aliases = ["e"]
  category = 2
  
  async execute(interaction: NorthInteraction) {
    this.navigate(interaction);
  }

  async run(message: NorthMessage) {
    this.navigate(message);
  }

  async navigate(message: NorthMessage | NorthInteraction, msg: Discord.Message = undefined) {
    const author = message instanceof Discord.Message ? message.author : message.user;
    var result = await query(`SELECT items FROM users WHERE id = '${author.id}'`);
    var IResult = await query(`SELECT * FROM shop WHERE guild = '${message.guild?.id}' OR guild = ''`);
    var itemObject = {};
    for (const item of IResult) itemObject[item.id] = 0;
    if (result.length == 1) Object.assign(itemObject, JSON.parse(result[0].items));
    let i = 0;
    const em = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(author.tag + "'s Inventory")
      .setDescription(IResult.map(x => `**${++i}.** ${x.name} - **${itemObject[x.id]}**`).join("\n"))
      .setTimestamp()
      .setFooter({ text: "Type the ID of the item you want to use or anything else to exit.", iconURL: client.user.displayAvatarURL() });
    if (msg) msg = await msg.edit({ embeds: [em], content: null });
    else msg = await msgOrRes(message, em);
    const collected = await message.channel.awaitMessages({
      filter: x => x.author.id === author.id,
      max: 1,
      time: 30000
    });
    em.setFooter({ text: "Have a nice day! :)", iconURL: client.user.displayAvatarURL() });
    if (!collected.first()) return await msg.edit({embeds: [em]});
    await collected.first().delete();
    const index = parseInt(collected.first().content);
    if (isNaN(index)) return await msg.edit({embeds: [em]});
    var wanted = IResult[index - 1];
    if (!wanted) return await msg.edit({embeds: [em]});
    em.setTitle(wanted.name)
      .setDescription(`${wanted.description}\nQuantity: **${itemObject[wanted.id]}**\n\n1️⃣ Use\n2️⃣ Return`)
      .setFooter({ text: "Use item?", iconURL: message.client.user.displayAvatarURL() });
    await msg.edit({embeds: [em]});
    await msg.react("1️⃣");
    await msg.react("2️⃣");
    const collected2 = await msg.awaitReactions({
      filter: (reaction, user) => ["1️⃣", "2️⃣"].includes(reaction.emoji.name) && user.id === author.id,
      max: 1,
      time: 30000
    })
    msg.reactions.removeAll().catch(() => {});
    if (!collected2.first()) return await msg.edit({embeds: [em.setColor(color()).setTitle(author.tag + "'s Inventory").setDescription(IResult.map(x => `**${++i}.** ${x.name} - **${itemObject[x.id]}**`).join("\n"))]});
    const r = collected2.first();
    if (r.emoji.name === "1️⃣") {
      if (!itemObject[wanted.id]) itemObject[wanted.id] = 0;
      if (itemObject[wanted.id] < 1) {
        msg.reactions.removeAll().catch(() => {});
        em.setDescription("You cannot use this item because you don't have any.").setFooter({ text: "You can't do this.", iconURL: message.client.user.displayAvatarURL() });
        return await msg.edit({embeds: [em]});
      }
      if (itemObject[wanted.id].guild === "") {
        await NorthClient.storage.items.get(wanted.id).run(message, msg, em, itemObject);
      } else {
        em.setFooter({ text: "Using item...", iconURL: message.client.user.displayAvatarURL() });
        const requiredArgs = wanted.args.split(/ +/).filter(s => s != "");
        var args = [];
        if (requiredArgs.length > 0) {
          em.setDescription(`Please input the following arguments and separate them by line breaks:\n**${requiredArgs.join(" ")}**`);
          await msg.edit({embeds: [em]});
          const collected = await message.channel.awaitMessages({
            filter: x => x.author.id === author.id,
            max: 1,
            time: 120000
          });
          if (collected.first()) await collected.first().delete();
          if (!collected.first()?.content) {
            em.setDescription(`You didn't input the arguments in time! Preserving item...`)
              .setFooter({ text: "Returning to main menu in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
              await msg.edit({embeds: [em]});
            await wait(3000);
            return await this.navigate(message, msg);
          }
          args = collected.first().content.split(/ +/);
          if (args.length < requiredArgs.length) {
            em.setDescription(`The input arguments are less than the required arguments! Preserving item...`)
              .setFooter({ text: "Returning to main menu in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
              await msg.edit({embeds: [em]});
            await wait(3000);
            return await this.navigate(message, msg);
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
        run = run.replace(/{user}/ig, `<@${author.id}>`);
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
                .setFooter({ text: "Returning to main menu in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
                await msg.edit({embeds: [em]});
              await wait(3000);
              return await this.navigate(message, msg);
            }
            try {
              if (c.category === 8) throw new Error("Do NOT run music command with items.");
              else {
                  if (message instanceof Discord.Message) await c.run(message, cArgs);
                  else throw new Error("This is a little too hard for slash.");
                }
            } catch (error: any) {
              console.error(error);
              em.setDescription(`Failed to use the item! Please contact NorthWestWind#1885 to fix this! Preserving item...\nError: \`${error.message}\``)
                .setFooter({ text: "Returning to main menu in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
              await msg.edit({embeds: [em]});
              await wait(3000);
              return await this.navigate(message, msg);
            }
            run = run.replace(command, "");
          }
        if (run.length > 0) await message.channel.send(run);
        itemObject[wanted.id] -= 1;
        await query(`UPDATE users SET items = '${JSON.stringify(itemObject)}' WHERE id =  '${author.id}'`);
        em.setTitle(`Used ${wanted.name}`)
          .setDescription("Returning to main menu in 3 seconds...")
          .setFooter({ text: "Please be patient.", iconURL: message.client.user.displayAvatarURL() });
        await msg.edit({embeds: [em]});
        await wait(3000);
        return await this.navigate(message, msg);
      }
    } else return await this.navigate(message, msg);
  }
};

const cmd = new InventoryCommand();
export default cmd;