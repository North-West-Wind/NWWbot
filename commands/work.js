const randomWords = require("random-words");
const Canvas = require("canvas");
const Discord = require("discord.js");
const { getRandomNumber, applyText, jsDate2Mysql } = require("../function.js");

module.exports = {
  name: "work",
  description: "Work in the server and gain virtual money. By working more, you will gain experience and level up. That can make you gain more.",
  category: 2,
  async execute(message) {
    const currentDateSql = jsDate2Mysql(new Date());
    const con = await message.pool.getConnection();
    var [results] = await con.query(`SELECT * FROM currency WHERE user_id = '${message.author.id}'`);
    if (results.length == 0) {
      const gain = Math.round((getRandomNumber(1, 1.5) + Number.EPSILON) * 100) / 100;
      await con.query(`INSERT INTO currency (user_id, currency, worked, last_worked, bank) VALUES(${message.author.id}, ${gain}, 1, '${currentDateSql}', 0.00)`);
      message.channel.send(`<@${message.author.id}> worked and gained $${gain}!\nBut next time, you will need to do something to gain!`);
    } else {
      var failed = false;
      const lastDate = results[0].last_worked;
      if (new Date() - lastDate < 3600000) return message.channel.send("You can only work once an hour!");
      const worked = results[0].worked;
      const filter = x => x.author.id === message.author.id && x.content;
      const words = randomWords(Math.floor((11 * Math.E * Math.log(worked + 90) - 47.5 * Math.E) / 5) * 5);
      const gain = Math.round((getRandomNumber(Math.pow(2, worked / 20), 1.2 * Math.pow(2, worked / 20)) + Number.EPSILON) * 100) / 100;
      var num = 0;
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
        var msg = await message.channel.send(`Type the following word within 60 seconds:\n**Word ${++num}/${words.length}:**`, attachment);
        const collected = await message.channel.awaitMessages(filter, { time: 60000, max: 1, error: ["time"] });
        await msg.delete();
        if (!collected || !collected.first() || !collected.first().content || collected.first().content !== words[i]) {
          await con.query(`UPDATE currency SET last_worked = '${currentDateSql}' WHERE user_id = '${message.author.id}'`);
          if (collected && collected.first()) collected.first().delete();
          await message.channel.send("You didn't type the word within 60 seconds and failed your job. Better luck next time!");
          failed = true;
          return;
        }
      }
      if (failed) {
        var doubling = false;
        if (results[0].doubling && results[0].doubling - Date.now() > 0) doubling = true;
        var newCurrency = Math.round((Number(results[0].currency) + (doubling ? gain * 2 : gain) + Number.EPSILON) * 100) / 100;
        await con.query(`UPDATE currency SET currency = ${newCurrency}, worked = ${worked + 1}, last_worked = '${currentDateSql}'${(!doubling ? `, doubling = NULL` : "")} WHERE user_id = '${message.author.id}'`);
        await message.channel.send(`<@${message.author.id}> worked and gained **$${gain}**!${(doubling ? " The money you gained is doubled!" : "")}`);
      }
    }
    con.release();
  }
};
