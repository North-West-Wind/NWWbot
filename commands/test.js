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

const MojangAPI = require("mojang-api");


module.exports = {
  name: "test",
  description: "For test, really.",
  async execute(message, args, pool) {
    console.log(await message.guild.members.fetch("69420"));
  }
};
