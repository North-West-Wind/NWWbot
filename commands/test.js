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
    if(message.author.id !== process.env.DC) return message.channel.send("You can't use this.");
    var guilds = message.client.guilds;
    for(const guild of guilds.cache.values()) {
      console.log(guild.id + " - " + guild.name);
    }
    var d = await spotifyApi.clientCredentialsGrant();

        await spotifyApi.setAccessToken(d.body.access_token);
        await spotifyApi.setRefreshToken(process.env.SPOTREFRESH);

        var refreshed = await spotifyApi
          .refreshAccessToken()
          .catch(console.error);

        console.log("The access token has been refreshed!");

        // Save the access token so that it's used in future calls
        await spotifyApi.setAccessToken(refreshed.body.access_token);
    
    var data = await spotifyApi
              .getAlbums(["3Gt7rOjcZQoHCfnKl5AkK7"])
              .catch(err => console.log("Something went wrong!", err));
    
    console.log(data.body);
  }
};
