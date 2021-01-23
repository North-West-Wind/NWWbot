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
    try {
      const welcome = console.guilds[guild.id]?.welcome;
      if (!welcome?.channel) {
        if (console.guilds[guild.id]) return;
        await message.pool.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '🎉')`);
        console.log("Inserted record for " + guild.name);
      } else {
        if (!welcome.channel) return;
        const channel = guild.channels.resolve(welcome.channel);
        if (!channel || !channel.permissionsFor(guild.me).has(18432)) return;
        if (welcome.message) try {
          const welcomeMessage = replaceMsgContent(welcome.message, guild, message.client, member, "welcome");
          await channel.send(welcomeMessage);
        } catch (err) {
          console.error(err);
        }
        if (welcome.image) {
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
              if (id === 1) await channel.send(new Discord.MessageAttachment("https://cdn.discordapp.com/attachments/707639765607907358/737859171269214208/welcome.png"));
              await channel.send(attachment);
            } catch (err) {
              console.error(err);
            }
          };
          var url = welcome.image;
          try {
            let urls = JSON.parse(welcome.img);
            if (Array.isArray(urls)) url = urls[Math.floor(Math.random() * urls.length)];
          } catch (err) { }
          img.src = url;
        }
      }
    } catch (err) { console.error(err) };
  }
};
