const Discord = require("discord.js");
const client = new Discord.Client();
const { createCanvas, Image, loadImage } = require("canvas");
const { findMember } = require("../function.js");

module.exports = {
  name: "welcome",
  description: "Test the welcome message and image.",
  async execute(message, args, pool) {
    let member = message.author;
    if(args[0]) {
      member = await findMember(args[0]);
      if(!member) member = message.author;
    }
    const guild = message.guild;
    pool.getConnection(function(err, con) {
      if (err) {
        console.error(err);
        return message.reply(
          "there was an error trying to connect to the database!"
        );
      }
      con.query(
        "SELECT welcome, wel_channel, wel_img, autorole FROM servers WHERE id=" +
          guild.id,
        function(err, result) {
          if (err) {
            console.error(err);
            return message.reply(
              "there was an error trying to fetch data from the database!"
            );
          }
          if (
            result[0].wel_channel === null ||
            result[0] === undefined ||
            result[0].welcome === null
          ) {
            return message.channel.send("No welcome message configured.");
          } else {
            //convert message into array
            const splitMessage = result[0].welcome.split(" ");
            const messageArray = [];

            splitMessage.forEach(word => {
              //check channel
              if (word.startsWith("{#")) {
                const first = word.replace("{#", "");
                const second = first.replace("}", "");
                if (isNaN(parseInt(second))) {
                  const mentionedChannel = guild.channels.find(
                    x => x.name === second
                  );
                  if (mentionedChannel === null) {
                    messageArray.push("#" + second);
                  } else {
                    messageArray.push(mentionedChannel);
                  }
                } else {
                  const mentionedChannel = guild.channels.get(second);
                  if (mentionedChannel === null) {
                    messageArray.push("<#" + second + ">");
                  } else {
                    messageArray.push(mentionedChannel);
                  }
                }
              }

              //check role
              else if (word.startsWith("{&")) {
                const first = word.replace("{&", "");
                const second = first.replace("}", "");
                if (isNaN(parseInt(second))) {
                  const mentionedRole = guild.roles.find(
                    x => x.name === second
                  );
                  if (mentionedRole === null) {
                    messageArray.push("@" + second);
                  } else {
                    messageArray.push(mentionedRole);
                  }
                } else {
                  const mentionedRole = guild.roles.get(second);
                  if (mentionedRole === null) {
                    messageArray.push("<@&" + second + ">");
                  } else {
                    messageArray.push(mentionedRole);
                  }
                }
              }

              //check mentioned users
              else if (word.startsWith("{@")) {
                const first = word.replace("{@", "");
                const second = first.replace("}", "");
                if (isNaN(parseInt(second))) {
                  const mentionedUser = client.users.find(
                    x => x.name === second
                  );
                  if (mentionedUser === null) {
                    messageArray.push("@" + second);
                  } else {
                    messageArray.push(mentionedUser);
                  }
                } else {
                  const mentionedUser = client.users.get(second);
                  if (mentionedUser === null) {
                    messageArray.push("<@" + second + ">");
                  } else {
                    messageArray.push(mentionedUser);
                  }
                }
              } else {
                messageArray.push(word);
              }
            });

            //construct message
            const welcomeMessage = messageArray
              .join(" ")
              .replace(/{user}/g, member);

            //send message only
            message.channel.send(welcomeMessage);

            //check image link
            if (result[0].wel_img === null) {
            } else {
              //canvas
              var img = new Image();

              //when image load
              img.onload = async function() {
                var height = img.height;
                var width = img.width;

                //create canvas + get context
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext("2d");

                //applyText function
                const applyText = (canvas, text) => {
                  const ctx = canvas.getContext("2d");

                  //calculate largest font size
                  let fontSize = canvas.width / 12;

                  //reduce font size loop
                  do {
                    //reduce font size
                    ctx.font = `${(fontSize -= 5)}px "free-sans", Arial`;
                    // Compare pixel width of the text to the canvas minus the approximate avatar size
                  } while (
                    ctx.measureText(text).width >
                    canvas.width - canvas.width / 10
                  );

                  // Return the result to use in the actual canvas
                  return ctx.font;
                };

                //welcomeText function
                const welcomeText = (canvas, text) => {
                  const ctx = canvas.getContext("2d");

                  //calculate largest font size
                  let fontSize = canvas.width / 24;

                  //reduce font size loop
                  do {
                    //reduce font size
                    ctx.font = `${(fontSize -= 5)}px "free-sans", Arial`;
                    // Compare pixel width of the text to the canvas minus the approximate avatar size
                  } while (
                    ctx.measureText(text).width >
                    canvas.width - canvas.width / 4
                  );

                  // Return the result to use in the actual canvas
                  return ctx.font;
                };

                //fetch the image
                const image = await loadImage(url);

                //fetch user avatar
                const avatar = await loadImage(
                  message.author.displayAvatarURL({ format: "png" })
                );

                //draw background
                ctx.drawImage(image, 0, 0, width, height);

                //declare the text
                var txt =
                  message.author.username + " #" + message.author.discriminator;

                //draw font
                ctx.font = applyText(canvas, txt);
                ctx.strokeStyle = "black";
                ctx.lineWidth = canvas.width / 102.4;
                ctx.strokeText(
                  txt,
                  canvas.width / 2 - ctx.measureText(txt).width / 2,
                  (canvas.height * 3) / 4
                );
                ctx.fillStyle = "#ffffff";
                ctx.fillText(
                  txt,
                  canvas.width / 2 - ctx.measureText(txt).width / 2,
                  (canvas.height * 3) / 4
                );

                //declare welcome message
                var welcome = "Welcome to the server!";

                //draw font
                ctx.font = welcomeText(canvas, welcome);
                ctx.strokeStyle = "black";
                ctx.lineWidth = canvas.width / 204.8;
                ctx.strokeText(
                  welcome,
                  canvas.width / 2 - ctx.measureText(welcome).width / 2,
                  (canvas.height * 6) / 7
                );
                ctx.fillStyle = "#ffffff";
                ctx.fillText(
                  welcome,
                  canvas.width / 2 - ctx.measureText(welcome).width / 2,
                  (canvas.height * 6) / 7
                );

                // Pick up the pen
                ctx.beginPath();
                //line width setting
                ctx.lineWidth = canvas.width / 51.2;
                // Start the arc to form a circle
                ctx.arc(
                  canvas.width / 2,
                  canvas.height / 3,
                  canvas.height / 5,
                  0,
                  Math.PI * 2,
                  true
                );
                // Put the pen down
                ctx.closePath();
                ctx.strokeStyle = "#dfdfdf";
                ctx.stroke();
                // Clip off the region you drew on
                ctx.clip();

                //draw avatar in circle
                ctx.drawImage(
                  avatar,
                  canvas.width / 2 - canvas.height / 5,
                  canvas.height / 3 - canvas.height / 5,
                  canvas.height / 2.5,
                  canvas.height / 2.5
                );

                //declare attachment
                var attachment = new Discord.MessageAttachment(
                  canvas.toBuffer(),
                  "welcome-image.png"
                );

                //send message
                message.channel.send("", attachment);
              };

              //image url
              var url = result[0].wel_img;

              //give source
              img.src = url;
            }
          }
        }
      );
      con.release();
    });
  }
};
