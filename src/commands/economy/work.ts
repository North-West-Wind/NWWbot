import randomWords from "random-words";
import * as Canvas from "canvas";
import * as Discord from "discord.js";
import { getRandomNumber, applyText, jsDate2Mysql } from "../../function.js";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { Interaction } from "slashcord/dist/Index";
import { RowDataPacket } from "mysql2";

class WorkCommand implements SlashCommand {
  name = "work"
  description = "Work in the server and gain virtual money."
  category = 2

  async execute(obj: { interaction: Interaction, client: NorthClient }) {
    const currentDateSql = jsDate2Mysql(new Date());
    const con = await obj.client.pool.getConnection();
    var [results] = <RowDataPacket[][]> await con.query(`SELECT * FROM currency WHERE user_id = '${obj.interaction.member.id}' AND guild = '${obj.interaction.guild.id}'`);
    if (results.length == 0) await con.query(`INSERT INTO currency VALUES(NULL, '${obj.interaction.member.id}', ${gain}, 1, '${currentDateSql}', 0.00, NULL, '${obj.interaction.guild.id}')`);
    const lastDate = results[0].last_worked;
    if (Date.now() - lastDate < 3600000) return await obj.interaction.reply("You can only work once an hour!");
    obj.interaction.reply("Distributing work...");
    const worked = results[0].worked;
    var gain = Math.round((getRandomNumber(Math.pow(2, worked / 20), 1.2 * Math.pow(2, worked / 20)) + Number.EPSILON) * 100) / 100;
    obj.interaction.delete();
    const rate = await this.work(obj.interaction, worked);
    var doubling = false;
    if (results[0].doubling && results[0].doubling - Date.now() > 0) doubling = true;
    gain *= rate * (doubling ? 2 : 1);
    var newCurrency = Math.round((Number(results[0].currency) + gain + Number.EPSILON) * 100) / 100;
    await con.query(`UPDATE currency SET currency = ${newCurrency}, worked = ${worked + 1}, last_worked = '${currentDateSql}'${(!doubling ? `, doubling = NULL` : "")} WHERE user_id = '${obj.interaction.member.id}' AND guild = '${obj.interaction.guild.id}'`);
    await obj.interaction.channel.send(`<@${obj.interaction.member.id}> worked and gained **$${Math.round((gain + Number.EPSILON) * 100) / 100}**${rate < 1 ? ` (and it's multiplied by **${rate}**)` : ""}!${(doubling ? " The money you gained is doubled!" : "")}`);
    con.release();
  }

  async run(message: NorthMessage) {
    const currentDateSql = jsDate2Mysql(new Date());
    const con = await message.pool.getConnection();
    var [results] = <RowDataPacket[][]> await con.query(`SELECT * FROM currency WHERE user_id = '${message.author.id}' AND guild = '${message.guild.id}'`);
    if (results.length == 0) await con.query(`INSERT INTO currency VALUES(NULL, '${message.author.id}', ${gain}, 1, '${currentDateSql}', 0.00, NULL, '${message.guild.id}')`);
    const lastDate = results[0].last_worked;
    if (Date.now() - lastDate < 3600000) return message.channel.send("You can only work once an hour!");
    const worked = results[0].worked;
    var gain = Math.round((getRandomNumber(Math.pow(2, worked / 20), 1.2 * Math.pow(2, worked / 20)) + Number.EPSILON) * 100) / 100;
    const rate = await this.work(message, worked);
    var doubling = false;
    if (results[0].doubling && results[0].doubling - Date.now() > 0) doubling = true;
    gain *= rate * (doubling ? 2 : 1);
    var newCurrency = Math.round((Number(results[0].currency) + gain + Number.EPSILON) * 100) / 100;
    await con.query(`UPDATE currency SET currency = ${newCurrency}, worked = ${worked + 1}, last_worked = '${currentDateSql}'${(!doubling ? `, doubling = NULL` : "")} WHERE user_id = '${message.author.id}' AND guild = '${message.guild.id}'`);
    await message.channel.send(`<@${message.author.id}> worked and gained **$${Math.round((gain + Number.EPSILON) * 100) / 100}**${rate < 1 ? ` (and it's multiplied by **${rate}**)` : ""}!${(doubling ? " The money you gained is doubled!" : "")}`);
    con.release();
  }

  async work(message: NorthMessage | Interaction, worked: number) {
    var correct = 0;
    const words = randomWords(Math.floor((11 * Math.E * Math.log(worked + 90) - 47.5 * Math.E) / 5) * 5);
    const filter = x => x.author.id === (message instanceof Discord.Message ? message.author.id : (message.member?.id ?? message.channelID)) && x.content;
    for (let i = 0; i < words.length; i++) {
      const wordCanvas = Canvas.createCanvas(720, 360);
      const ctx = wordCanvas.getContext("2d");
      const txt = words[i];
      ctx.font = applyText(wordCanvas, txt);
      ctx.strokeStyle = "black";
      ctx.lineWidth = wordCanvas.width / 102.4;
      ctx.strokeText(txt, wordCanvas.width / 2 - ctx.measureText(txt).width / 2, wordCanvas.height / 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(txt, wordCanvas.width / 2 - ctx.measureText(txt).width / 2, wordCanvas.height / 2);
      const attachment = new Discord.MessageAttachment(wordCanvas.toBuffer(), "word-image.png");
      var msg = await message.channel.send(`Current correct rate: **${correct}/${i}**\n\nType the following word within 60 seconds:\n**Word ${i+1}/${words.length}:**`, attachment);
      const collected = await message.channel.awaitMessages(filter, { time: 60000, max: 1 });
      await msg.delete();
      if (collected && collected.first()) await collected.first().delete();
      if (!collected || !collected.first() || !collected.first().content) {
        await message.channel.send("You didn't type the word within 60 seconds and failed your job. Better luck next time!");
        return 0;
      } else if (collected.first().content === words[i]) correct += 1;
    }
    return correct / words.length;
  }
};

const cmd = new WorkCommand();
export default cmd;