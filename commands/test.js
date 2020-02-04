const Discord = require("discord.js");
const ms = require("ms");
var color = Math.floor(Math.random() * 16777214) + 1;
const ytdl = require("ytdl-core");
const YouTube = require("simple-youtube-api");
const youtube = new YouTube(process.env.YT);
const Canvas = require("canvas");
const randomWords = require("random-words")

const { Image, createCanvas, loadImage } = require("canvas");
var fs = require("fs");

function twoDigits(d) {
  if (0 <= d && d < 10) return "0" + d.toString();
  if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
  return d.toString();
}
const applyText = (canvas, text) => {
                const ctx = canvas.getContext("2d");

                //calculate largest font size
                let fontSize = canvas.width / 12;

                //reduce font size loop
                do {
                  //reduce font size
                  ctx.font = `${(fontSize -= 5)}px sans-serif`;
                  // Compare pixel width of the text to the canvas minus the approximate avatar size
                } while (
                  ctx.measureText(text).width >
                  canvas.width - 100
                );

                // Return the result to use in the actual canvas
                return ctx.font;
              };

module.exports = {
  name: "test",
  description: "For test, really.",
  execute(message, args, pool) {
    const filter = x => x.author.id === message.author.id;
    pool.getConnection(async function(err, con) {
      var words = randomWords(1)
      var wordCanvas = await Canvas.createCanvas(720, 360);
            const ctx = await wordCanvas.getContext('2d');
            
            
            
            var image = await Canvas.loadImage("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2F59793522-watercolor-paper-texture-abstract-white-blank-paper.jpg?v=1580730663162")
            
             await ctx.drawImage(image, 0, 0, 720, 360);
            var txt = words[0];

              //draw font
              ctx.font = applyText(wordCanvas, txt);
              ctx.strokeStyle = "black";
              ctx.lineWidth = wordCanvas.width / 102.4;
              ctx.strokeText(
                txt,
                wordCanvas.width / 2 - ctx.measureText(txt).width / 2,
                (wordCanvas.height) / 2
              );
              ctx.fillStyle = "#ffffff";
              ctx.fillText(
                txt,
                wordCanvas.width / 2 - ctx.measureText(txt).width / 2,
                (wordCanvas.height) / 2
              );
      
      var attachment = new Discord.Attachment(
                wordCanvas.toBuffer(),
                "word-image.png"
              );
     message.channel.send(attachment);
    })
     
  }
};
