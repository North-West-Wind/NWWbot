const Discord = require("discord.js");
const { createCanvas, Image, loadImage } = require("canvas");
const { findMember, replaceMsgContent } = require("../function.js");

module.exports = {
  name: "welcome",
  description: "Test the welcome message and image.",
  category: 6,
  usage: "[user | user ID]",
  async execute(message, args) {
    var member = message.member;
    if (args[0]) {
      member = await findMember(message, args[0]);
      if (!member) member = message.author;
    }
    const guild = message.guild;
    const id = message.client.id;
    const con = await pool.getConnection();
    var [result] = await con.query(`SELECT welcome, wel_channel, wel_img, autorole FROM servers WHERE id = '${guild.id}'`);
    if (!result[0] || !result[0].wel_channel || !result[0].welcome) {
      if (!result[0]) {
        var [res] = await con.query(`SELECT * FROM servers WHERE id = '${guild.id}'`);
        if (res.length > 0) console.log("Found row inserted for this server before. Cancelling row insert...");
        else {
          await con.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '🎉')`);
          console.log("Inserted record for " + guild.name);
        }
      }
      await message.channel.send("Channel is missing!");
    } else {
      const channel = guild.channels.resolve(result[0].wel_channel);
      if (!channel || !channel.permissionsFor(guild.me).has(18432)) return await message.channel.send(`Cannot find channel/Missing permissions (Require \`${new Discord.Permissions(18432).toArray().join("`, `")}\`)`);
      const welcomeMessage = replaceMsgContent(result[0].welcome, guild, message.client, member);
      if (result[0].welcome) try {
        await message.channel.send(welcomeMessage);
      } catch (err) {
        console.error(err);
      }
      if (result[0].wel_img) {
        var img = new Image();
        img.onload = async () => {
          var height = img.height;
          var width = img.width;
          const canvas = createCanvas(width, height);
          const ctx = canvas.getContext("2d");
          const applyText = (canvas, text) => {
            const ctx = canvas.getContext("2d");
            let fontSize = canvas.width / 12;
            do {
              ctx.font = `regular ${(fontSize -= 5)}px "NotoSans", "free-sans", Arial`;
            } while (ctx.measureText(text).width > canvas.width * 9 / 10);
            return ctx.font;
          };
          const welcomeText = (canvas, text) => {
            const ctx = canvas.getContext("2d");
            let fontSize = canvas.width / 24;
            do {
              ctx.font = `regular ${(fontSize -= 5)}px "NotoSans", "free-sans", Arial`;
            } while (ctx.measureText(text).width > canvas.width * 3 / 4);
            return ctx.font;
          };
          const avatar = await loadImage(member.user.displayAvatarURL({ format: "png" }));
          ctx.drawImage(img, 0, 0, width, height);
          const txt = member.user.tag;
          ctx.font = applyText(canvas, txt);
          ctx.strokeStyle = "black";
          ctx.lineWidth = canvas.width / 102.4;
          ctx.strokeText(txt, canvas.width / 2 - ctx.measureText(txt).width / 2, (canvas.height * 3) / 4);
          ctx.fillStyle = "#ffffff";
          ctx.fillText(txt, canvas.width / 2 - ctx.measureText(txt).width / 2, (canvas.height * 3) / 4);
          const welcome = "Welcome to the server!";
          ctx.font = welcomeText(canvas, welcome);
          ctx.strokeStyle = "black";
          ctx.lineWidth = canvas.width / 204.8;
          ctx.strokeText(welcome, canvas.width / 2 - ctx.measureText(welcome).width / 2, (canvas.height * 6) / 7);
          ctx.fillStyle = "#ffffff";
          ctx.fillText(welcome, canvas.width / 2 - ctx.measureText(welcome).width / 2, (canvas.height * 6) / 7);
          ctx.beginPath();
          ctx.lineWidth = canvas.width / 51.2;
          ctx.arc(canvas.width / 2, canvas.height / 3, canvas.height / 5, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.strokeStyle = "#dfdfdf";
          ctx.stroke();
          ctx.clip();
          ctx.drawImage(avatar, canvas.width / 2 - canvas.height / 5, canvas.height / 3 - canvas.height / 5, canvas.height / 2.5, canvas.height / 2.5);
          var attachment = new Discord.MessageAttachment(canvas.toBuffer(), "welcome-image.png");
          try {
            if (id === 1) await message.channel.send(new Discord.MessageAttachment("https://cdn.discordapp.com/attachments/707639765607907358/737859171269214208/welcome.png"));
            await message.channel.send(attachment);
          } catch (err) {
            console.error(err);
          }
        };
        var url = result[0].wel_img;
        try {
          let urls = JSON.parse(result[0].wel_img);
          if (Array.isArray(urls)) url = urls[Math.floor(Math.random() * urls.length)];
        } catch (err) { }
        img.src = url;
      }
    }
    con.release();
  }
};
