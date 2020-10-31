const Discord = require("discord.js");
const client = new Discord.Client();
const { createCanvas, Image, loadImage } = require("canvas");
const { findMember } = require("../function.js");

module.exports = {
  name: "welcome",
  description: "Test the welcome message and image.",
  category: 6,
  usage: "[user | user ID]",
  async execute(message, args, pool) {
    let member = message.member;
    if (args[0]) {
      member = await findMember(message, args[0]);
      if (!member) member = message.author;
    }
    const guild = message.guild;
    pool.getConnection(function (err, con) {
      if (err) return console.error(err);
      con.query(
        `SELECT welcome, wel_channel, wel_img, autorole FROM servers WHERE id = '${guild.id}'`,
        async function (err, result) {
          if (!result[0] || !result[0].wel_channel || !result[0].welcome) {
            if (!result[0]) {
              pool.getConnection(function (err, con) {
                if (err) return console.error(err);
                con.query(`SELECT * FROM servers WHERE id = '${guild.id}'`, (err, result) => {
                  if (err) return console.error(err);
                  if (result.length > 0) console.log("Found row inserted for this server before. Cancelling row insert...");
                  else con.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '🎉')`, (err) => {
                    if (err) return console.error(err);
                    console.log("Inserted record for " + guild.name);
                  });
                });
                if (err) return console.error(err);
                con.release();
              });
            }
          } else {
            const channel = guild.channels.resolve(result[0].wel_channel);
            if (!channel.permissionsFor(guild.me).has(18432)) return await message.channel.send(`Permissions are missing for sending Welcome Message/Image in <#${channel.id}>!`);
            const splitMessage = result[0].welcome.split(" ");
            const messageArray = [];
            for (const word of splitMessage) {
              if (word.startsWith("{#")) {
                const first = word.replace("{#", "");
                const second = first.replace("}", "");
                if (isNaN(parseInt(second))) {
                  const mentionedChannel = guild.channels.find(x => x.name === second);
                  if (!mentionedChannel) messageArray.push("#" + second);
                  else messageArray.push(mentionedChannel);
                } else {
                  const mentionedChannel = guild.channels.resolve(second);
                  if (!mentionedChannel) messageArray.push("<#" + second + ">");
                  else messageArray.push(mentionedChannel);
                }
              } else if (word.startsWith("{&")) {
                const first = word.replace("{&", "");
                const second = first.replace("}", "");
                if (isNaN(parseInt(second))) {
                  const mentionedRole = guild.roles.find(x => x.name === second);
                  if (!mentionedRole) messageArray.push("@" + second);
                  else messageArray.push(mentionedRole);
                } else {
                  const mentionedRole = guild.roles.get(second);
                  if (!mentionedRole) messageArray.push("<@&" + second + ">");
                  else messageArray.push(mentionedRole);
                }
              } else if (word.startsWith("{@")) {
                const first = word.replace("{@", "");
                const second = first.replace("}", "");
                if (isNaN(parseInt(second))) {
                  const mentionedUser = client.users.find(x => x.name === second);
                  if (!mentionedUser) messageArray.push("@" + second);
                  else messageArray.push(mentionedUser);
                } else {
                  const mentionedUser = client.users.get(second);
                  if (!mentionedUser) messageArray.push("<@" + second + ">");
                  else messageArray.push(mentionedUser);
                }
              } else messageArray.push(word);
            }
            const welcomeMessage = messageArray.join(" ").replace(/{user}/g, member);
            if (result[0].welcome) try {
              await message.channel.send(welcomeMessage);
            } catch (err) {
              console.error(err);
            }
            if (result[0].wel_img) {
              var img = new Image();
              img.onload = async function () {
                var height = img.height;
                var width = img.width;
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext("2d");
                const applyText = (canvas, text) => {
                  const ctx = canvas.getContext("2d");
                  let fontSize = canvas.width / 12;
                  do {
                    ctx.font = `regular ${(fontSize -= 5)}px "NotoSans", "free-sans", Arial`;
                  } while (ctx.measureText(text).width > canvas.width - canvas.width / 10);
                  return ctx.font;
                };
                const welcomeText = (canvas, text) => {
                  const ctx = canvas.getContext("2d");
                  let fontSize = canvas.width / 24;
                  do {
                    ctx.font = `regular ${(fontSize -= 5)}px "NotoSans", "free-sans", Arial`;
                  } while (ctx.measureText(text).width > canvas.width - canvas.width / 4);
                  return ctx.font;
                };
                const avatar = await loadImage(member.user.displayAvatarURL({ format: "png" }));
                ctx.drawImage(img, 0, 0, width, height);
                var txt = member.user.tag;
                ctx.font = applyText(canvas, txt);
                ctx.strokeStyle = "black";
                ctx.lineWidth = canvas.width / 102.4;
                ctx.strokeText(txt, canvas.width / 2 - ctx.measureText(txt).width / 2, (canvas.height * 3) / 4);
                ctx.fillStyle = "#ffffff";
                ctx.fillText(txt, canvas.width / 2 - ctx.measureText(txt).width / 2, (canvas.height * 3) / 4);
                var welcome = "Welcome to the server!";
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
                  await message.channel.send(attachment);
                } catch (err) {
                  console.error(err);
                }
              };
              var url = result[0].wel_img;
              try {
                let urls = JSON.parse(result[0].wel_img);
                if (Array.isArray(urls)) url = urls[Math.floor(Math.random() * urls.length)];
              } catch(err) {}
              img.src = url;
            }
          }
          if (result[0] && result[0].autorole !== "[]") {
            var roleArray = JSON.parse(result[0].autorole);
            for (var i = 0; i < roleArray.length; i++) {
              var roleID = roleArray[i];
              var role = undefined;
              if (isNaN(parseInt(roleID))) role = await guild.roles.find(x => x.name === roleID);
              else role = await guild.roles.fetch(roleID);
              if (!role) continue;
              try {
                await member.roles.add(roleID);
                console.log(`Added ${member.displayName} to ${role.name}`)
              } catch (err) {
                console.error(err);
              }
            }
          }
          con.release();
          if (err) return console.error(err);
        }
      );
    });
  }
};
