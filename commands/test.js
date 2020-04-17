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
const { isGoodMusicVideoContent, validSPURL, validURL, decodeHtmlEntity, validImgurURL } = require("../function.js");
var search = require('youtube-search');
const Booru = require("booru");
const Gfycat = require('gfycat-sdk');
var gfycat = new Gfycat({clientId: process.env.GFYID, clientSecret: process.env.GFYSECRET});
const mm = require("music-metadata");
var request = require("request");
const ytsr = require("ytsr");
const ytpl = require("ytpl");
const moment = require("moment");
const formatSetup = require("moment-duration-format");
formatSetup(moment);

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
  async execute(message, args, pool, useless, hypixel, log) {
    if(message.author.id !== process.env.DC) return message.channel.send("You can't use this.");
    /*
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
    */
    
    /*
    var image = decodeHtmlEntity(`'&lt;iframe class="embedly-embed" ' +
      'src="https://cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fgfycat.com%2Fifr%2Facclaimedcornyglassfrog&amp;display_name=Gfycat&amp;url=https%3A%2F%2Fgfycat.com%2Facclaimedcornyglassfrog&amp;image=https%3A%2F%2Fthumbs.gfycat.com%2FAcclaimedCornyGlassfrog-size_restricted.gif&amp;key=ed8fa8699ce04833838e66ce79ba05f1&amp;type=text%2Fhtml&amp;schema=gfycat" ' +
      'width="600" height="338" scrolling="no" title="Gfycat embed" ' +
      'frameborder="0" allow="autoplay; fullscreen" ' +
      'allowfullscreen="true"&gt;&lt;/iframe&gt;'`).split("&").find(x => x.startsWith("image"));
      var arr = unescape(image).split("/");
    var id = arr[arr.length - 1].split("-")[0]; */
    }
};
