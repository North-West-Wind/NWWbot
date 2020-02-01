const Discord = require("discord.js");
const ms = require("ms");
var color = Math.floor(Math.random() * 16777214) + 1;
const ytdl = require("ytdl-core");
const YouTube = require("simple-youtube-api");
const youtube = new YouTube(process.env.YT);

const { Image, createCanvas, loadImage } = require("canvas");
var fs = require("fs");

function twoDigits(d) {
  if (0 <= d && d < 10) return "0" + d.toString();
  if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
  return d.toString();
}

module.exports = {
  name: "test",
  description: "For test, really.",
  execute(message, args, pool) {
    pool.getConnection(async function(err, con) {
      var time = await ms(args[0])
      console.log(time)
     if(time > 2147483647) {
       var i = await (time - 2147483647);
       console.log(i);
     }
    })
     
  }
};
