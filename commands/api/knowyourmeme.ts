import { SlashCommand } from "../../classes/Command";
import { Interaction } from "slashcord/dist/utilities/interaction";
import { color, createEmbedScrolling } from "../../function.js";
import * as Discord from "discord.js";
import cheerio from "cheerio";
import { NorthMessage } from "../../classes/NorthMessage";

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
  if (!res.ok) reject(new Error("Received Non-200 HTTP Status Code"));
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
  const items = Array.from(searchItem).filter(item => item?.attribs?.href?.startsWith("/memes/"));
  return Array.from(new Set(items.map(item => config.BASE_URL + item.attribs.href)));
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

  const name = (<any>$(".info h1 a")[0].children[0]).data;
  const bodycopy = $(".entry-section-container .entry-section");
  const header = $("header.rel.c");
  const photo = header.find($(".photo"));
  const image = (<any>photo[0]?.children[0])?.attribs["data-src"] ? (<any>photo[0].children[0]).attribs["data-src"] : null;

  const children = Array.from(bodycopy.find("h2"));
  let about = [];
  let origin = [];
  let spread = [];
  let reaction = [];
  let impact = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const sliced = child.parent.children.slice(2);
    if (child.attribs.id === "about" && child.parent.children) about.push(childrenToText(sliced));
    else if (child.attribs.id === "origin" && child.parent.children) origin.push(childrenToText(sliced));
    else if (child.attribs.id === "spread" && child.parent.children) spread.push(childrenToText(sliced));
    else if (child.attribs.id === "reaction" && child.parent.children) reaction.push(childrenToText(sliced));
    else if (child.attribs.id === "impact" && child.parent.children) impact.push(childrenToText(sliced));
  }
  return { name, url, image, about, origin, spread, reaction, impact };
}

async function doSearch(term) {
  let resultUrls;
  try { resultUrls = await findAllSearchResult(term); } catch (e) { throw e; }
  const memes = [];
  for (const result of resultUrls) {
    let body;
    try {
      body = await makeRequest(result);
    } catch (e) { throw e; }
    memes.push(parseMemeBody(result, body));
  }
  return memes;
}

class KnowYourMemeCommand implements SlashCommand {
  name: "knowyourmeme";
  description: "Display meme information from Know Your Meme.";
  usage: "<keywords>";
  args: 1;
  aliases: ["kym"];
  category: 7;
  options: [{
    name: "keywords",
    description: "The memes to search for.",
    required: true,
    type: 3
  }];
  async execute(obj: { interaction: Interaction, args: any[] }) {
    await obj.interaction.reply("Loading the memes...");
    var results = await doSearch(obj.args[0].value);
    const allEmbeds = [];
    let num = 0;
    for (const result of results) {
      const em = new Discord.MessageEmbed()
        .setColor(color())
        .setThumbnail(result.image ? result.image : undefined)
        .setTitle(result.name)
        .setURL(result.url)
        .setDescription(result.about.join("\n\n").length > 2048 ? result.about.join("\n\n").slice(0, 2045) + "..." : result.about.join("\n\n"))
        .setTimestamp()
        .setFooter(`Page ${++num} out of ${results.length}`, obj.interaction.client.user.displayAvatarURL());
      if (result.origin.length > 0) em.addField("Origin", result.origin.join("\n\n").length > 1024 ? result.origin.join("\n\n").slice(0, 1021) + "..." : result.origin.join("\n\n"));
      if (result.spread.length > 0) em.addField("Spread", result.spread.join("\n\n").length > 1024 ? result.spread.join("\n\n").slice(0, 1021) + "..." : result.spread.join("\n\n"));
      if (result.reaction.length > 0) em.addField("Reaction", result.reaction.join("\n\n").length > 1024 ? result.reaction.join("\n\n").slice(0, 1021) + "..." : result.reaction.join("\n\n"));
      if (result.impact.length > 0) em.addField("Impact", result.impact.join("\n\n").length > 1024 ? result.impact.join("\n\n").slice(0, 1021) + "..." : result.impact.join("\n\n"));
      allEmbeds.push(em);
    }
    await createEmbedScrolling(await obj.interaction.fetchReply(), allEmbeds);
  }

  async run(message: NorthMessage, args: string[]) {
    var msg = await message.channel.send("Loading the memes...");
    const results = await doSearch(args.join(" "));
    const allEmbeds = [];
    let num = 0;
    for (const result of results) {
      const em = new Discord.MessageEmbed()
        .setColor(color())
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
    await msg.delete();
    await createEmbedScrolling(message, allEmbeds);
  }
}

const cmd = new KnowYourMemeCommand();
export default JSON.parse(JSON.stringify(cmd));