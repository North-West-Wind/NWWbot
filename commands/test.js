const Discord = require("discord.js");
const ms = require("ms");
var color = Math.floor(Math.random() * 16777214) + 1;
const ytdl = require("ytdl-core");
const YouTube = require("simple-youtube-api");
const youtube = new YouTube(process.env.YT);
const Canvas = require("canvas");
const randomWords = require("random-words");
const neko = require("akaneko");
const { Image, createCanvas, loadImage } = require("canvas");
var fs = require("fs");
var SpotifyWebApi = require("spotify-web-api-node");
const { isGoodMusicVideoContent, validSPURL } = require("../function.js");
var search = require('youtube-search');
 
var opts = {
  maxResults: 1,
  key: process.env.YT2
};

// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTID,
  clientSecret: process.env.SPOTSECRET,
  redirectUri: "https://nwws.ml"
});

const MojangAPI = require("mojang-api");

module.exports = {
  name: "test",
  description: "For test, really.",
  async execute(message, args, pool) {
   var results = await search('surviv tavern music', opts);
    console.log(results);
  }
};
