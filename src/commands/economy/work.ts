import randomWords from "@genzou/random-words";
import Canvas from "canvas";
import * as Discord from "discord.js";
import { getRandomNumber, applyText, jsDate2Mysql, query, roundTo } from "../../function.js";
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";

class WorkCommand implements FullCommand {
  name = "work"
  description = "Work in the server and gain virtual money."
  category = 2

  async execute(interaction: NorthInteraction) {
    const date = new Date();
    const currentDateSql = jsDate2Mysql(date.getTime() + date.getTimezoneOffset() * 60000);
    const results = await query(`SELECT * FROM users WHERE id = '${interaction.user.id}'`);
    if (results.length == 0) await query(`INSERT INTO users(id) VALUES('${interaction.user.id}')`);
    const lastDate = results[0]?.last_worked || new Date(0);
    if (Date.now() - lastDate < 3600000) return await interaction.reply("You can only work once an hour!");
    await interaction.reply("Distributing work...");
    const worked = results[0]?.worked || 0;
    let gain = roundTo(getRandomNumber(Math.pow(2, worked / 20), 1.2 * Math.pow(2, worked / 20)), 2)
    await interaction.deleteReply();
    const rate = await this.work(interaction, worked);
    let doubling = false;
    if (results[0]?.doubling && results[0].doubling - Date.now() > 0) doubling = true;
    gain *= rate * (doubling ? 2 : 1);
    const newCurrency = roundTo((results[0]?.currency || 0) + gain, 2);
    await query(`UPDATE users SET currency = ${newCurrency}, worked = ${worked + 1}, last_worked = '${currentDateSql}'${(!doubling ? ", doubling = NULL" : "")} WHERE id = '${interaction.user.id}'`);
    await interaction.channel.send(`<@${interaction.user.id}> worked and gained **$${roundTo(gain, 2)}**${rate < 1 ? ` (and it's multiplied by **${rate}**)` : ""}!${(doubling ? " The money you gained is doubled!" : "")}`);
  }

  async run(message: NorthMessage) {
    const date = new Date();
    const currentDateSql = jsDate2Mysql(date.getTime() + date.getTimezoneOffset() * 60000);
    const results = await query(`SELECT * FROM users WHERE id = '${message.author.id}'`);
    if (results.length == 0) await query(`INSERT INTO users(id) VALUES('${message.author.id}')`);
    const lastDate = results[0]?.last_worked || new Date(0);
    if (Date.now() - lastDate < 3600000) return message.channel.send("You can only work once an hour!");
    const worked = results[0]?.worked || 0;
    let gain = roundTo(getRandomNumber(Math.pow(2, worked / 20), 1.2 * Math.pow(2, worked / 20)), 2);
    const rate = await this.work(message, worked);
    let doubling = false;
    if (results[0]?.doubling && results[0].doubling - Date.now() > 0) doubling = true;
    gain *= rate * (doubling ? 2 : 1);
    const newCurrency = roundTo((results[0]?.currency || 0) + gain, 2);
    await query(`UPDATE users SET currency = ${newCurrency}, worked = ${worked + 1}, last_worked = '${currentDateSql}'${(!doubling ? ", doubling = NULL" : "")} WHERE id = '${message.author.id}'`);
    await message.channel.send(`<@${message.author.id}> worked and gained **$${roundTo(gain, 2)}**${rate < 1 ? ` (and it's multiplied by **${rate}**)` : ""}!${(doubling ? " The money you gained is doubled!" : "")}`);
  }

  async work(message: NorthMessage | NorthInteraction, worked: number) {
    let correct = 0;
    const words = randomWords(Math.floor((11 * Math.E * Math.log(worked + 90) - 47.5 * Math.E) / 5) * 5);
    const filter = x => x.author.id === (message instanceof Discord.Message ? message.author.id : message.user.id) && x.content;
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
      const attachment = new Discord.AttachmentBuilder(wordCanvas.toBuffer()).setName("word-image.png");
      const msg = await message.channel.send({ content: `Current correct rate: **${correct}/${i}**\n\nType the following word within 60 seconds:\n**Word ${i+1}/${words.length}:**`, files: [attachment]});
      const collected = await message.channel.awaitMessages({ filter, time: 60000, max: 1 });
      await msg.delete();
      if (collected && collected.first()) await collected.first().delete();
      if (!collected || !collected.first() || !collected.first().content) {
        await message.channel.send("You didn't type the word within 60 seconds and failed your job. Better luck next time!");
        return 0;
      } else if (collected.first().content === words[i]) correct += 1;
    }
    return correct / words.length;
  }
}

const cmd = new WorkCommand();
export default cmd;