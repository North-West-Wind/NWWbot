const cheerio = require("cheerio");
const Discord = require("discord.js");
const fetch = require("fetch-retry")(require("node-fetch"), { retries: 5, retryDelay: attempt => Math.pow(2, attempt) * 1000 });
const { createEmbedScrolling } = require("../function.js");
const config = {
  BASE_URL: "http://knowyourmeme.com",
  SEARCH_URL: "/search?q=",
  RANDOM_URL: "/random",
  USER_AGENT:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36"
};

const getSearchURL = (term) => (config.BASE_URL + config.SEARCH_URL + term.split(" ").map(s => encodeURIComponent(s)).join("+"));
const makeRequest = (url) => new Promise(async (resolve, reject) => {
  const res = await fetch(url, { headers: { "User-Agent": config.USER_AGENT } });
  if(res.statusCode && res.statusCode != 200) reject(new Error("Received HTTP Status Code: " + res.statusCode));
  resolve(await res.text());
});

async function findAllSearchResult(term) {
  let body;
  try {
    body = await makeRequest(getSearchURL(term));
  } catch (e) {
    throw e;
  }
  if (body.includes("Sorry, but there were no results for")) throw new Error("No results found.");
  const $ = cheerio.load(body);
  const grid = $(".entry-grid-body");
  const searchItem = grid.find("tr td a");
  const items = Array.from(searchItem).filter(
    item =>
      item.attribs &&
      item.attribs.href &&
      item.attribs.href.startsWith("/memes/")
  );
  return new Set(items.map(item => config.BASE_URL + item.attribs.href));
}

function childrenToText(children) {
  var text = "";
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === "text") {
      if (!/^\s*\[\d+]\s*$/.test(child.data)) text += child.data;
      continue;
    }
    text += childrenToText(child.children);
  }
  return text;
}

function parseMemeBody(url, body) {
  const $ = cheerio.load(body);

  const name = $(".info h1 a")[0].children[0].data;
  const bodycopy = $(".bodycopy");
  const header = $("header.rel.c");
  const photo = header.find($(".photo"));
  const image = photo[0] && photo[0].children[0] && photo[0].children[0].attribs && photo[0].children[0].attribs["data-src"] ? photo[0].children[0].attribs["data-src"] : null;

  const children = Array.from(bodycopy.children());
  let about = [];
  let origin = [];
  let spread = [];
  let reaction = [];
  let impact = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.attribs.id === "about") while (children[i + 1] && children[i + 1].name === "p") {
      if (/[a-zA-Z]/g.test(childrenToText(children[i + 1].children))) about.push(childrenToText(children[i + 1].children));
      i++;
    }
    else if (child.attribs.id === "origin") while (children[i + 1] && children[i + 1].name === "p") {
      if (/[a-zA-Z]/g.test(childrenToText(children[i + 1].children))) origin.push(childrenToText(children[i + 1].children));
      i++;
    }
    else if (child.attribs.id === "spread") while (children[i + 1] && children[i + 1].name === "p") {
      if (/[a-zA-Z]/g.test(childrenToText(children[i + 1].children))) spread.push(childrenToText(children[i + 1].children));
      i++;
    }
    else if (child.attribs.id === "reaction") while (children[i + 1] && children[i + 1].name === "p") {
      if (/[a-zA-Z]/g.test(childrenToText(children[i + 1].children))) reaction.push(childrenToText(children[i + 1].children));
      i++;
    }
    else if (child.attribs.id === "impact") while (children[i + 1] && children[i + 1].name === "p") {
      if (/[a-zA-Z]/g.test(childrenToText(children[i + 1].children))) impact.push(childrenToText(children[i + 1].children));
      i++;
    }
  }
  return { name, url, image, about, origin, spread, reaction, impact };
}

async function doSearch(term) {
  let resultUrls;
  try {
    resultUrls = await findAllSearchResult(term);
  } catch (e) {
    throw e;
  }
  const memes = [];
  for (const result of resultUrls) {
    let body;
    try {
      body = await makeRequest(result);
    } catch (e) {
      throw e;
    }
    memes.push(parseMemeBody(result, body));
  }
  return memes;
}

module.exports = {
  name: "knowyourmeme",
  description: "Display meme information from Know Your Meme.",
  usage: "[keywords]",
  aliases: ["kym"],
  category: 7,
  async execute(message, args) {
    if (!args[0]) return message.channel.send("Please provide at least 1 keyword!" + ` Usage: ${message.prefix}${this.name} ${this.usage}`);
    var msg = await message.channel.send("Loading the memes...");
    msg.channel.startTyping();
    var results = await doSearch(args.join(" "));
    const allEmbeds = [];
    let num = 0;
    for (const result of results) {
      const em = new Discord.MessageEmbed()
        .setColor(console.color())
        .setThumbnail(result.image ? result.image : undefined)
        .setTitle(result.name)
        .setURL(result.url)
        .setDescription(result.about.join("\n\n").length > 2048 ? result.about.join("\n\n").slice(0, 2045) + "..." : result.about.join("\n\n"))
        .setTimestamp()
        .setFooter(`Page ${++num} out of ${results.length}`, message.client.user.displayAvatarURL());
      if (result.origin.length > 0) em.addField("Origin", result.origin.join("\n\n").length > 1024 ? result.origin.join("\n\n").slice(0, 1021) + "..." : result.origin.join("\n\n"));
      if (result.spread.length > 0) em.addField("Spread", result.spread.join("\n\n").length > 1024 ? result.spread.join("\n\n").slice(0, 1021) + "..." : result.spread.join("\n\n"));
      if (result.reaction.length > 0) em.addField("Reaction", result.reaction.join("\n\n").length > 1024 ? result.reaction.join("\n\n").slice(0, 1021) + "..." : result.reaction.join("\n\n"));
      if (result.impact.length > 0) em.addField("Impact", result.impact.join("\n\n").length > 1024 ? result.impact.join("\n\n").slice(0, 1021) + "..." : result.impact.join("\n\n"));
      allEmbeds.push(em);
    }
    await createEmbedScrolling(message, allEmbeds);
  }
};
