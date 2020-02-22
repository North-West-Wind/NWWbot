const Discord = require("discord.js");
const ms = require("ms");
var color = Math.floor(Math.random() * 16777214) + 1;
const ytdl = require("ytdl-core");
const YouTube = require("simple-youtube-api");
const youtube = new YouTube(process.env.YT);
const Canvas = require("canvas");
const randomWords = require("random-words");
const { getData, getPreview } = require("spotify-url-info");

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
function validYTURL(str) {
  var pattern = new RegExp("^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+"
  ); // fragment locator
  return !!pattern.test(str);
}

module.exports = {
  name: "test",
  description: "For test, really.",
  async execute(message, args, pool) {
    const voiceChannel = message.member.voice.channel;
    if(!message.guild.me.voice.channel) {
            var connection = await voiceChannel.join();
          } else {
            var connection = message.guild.me.voice.connection;
          }
    console.log(connection)
  }
};
