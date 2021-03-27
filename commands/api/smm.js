const Discord = require("discord.js");
const smm = require("smm-api");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");
const { createEmbedScrolling, readableDateTime, color } = require("../../function.js");
const themes = ["Ground", "Underground", "Castle", "Airship", "Underwater", "Ghost House"];
const difficulties = ["Easy", "Normal", "Expert", "Super Expert"];
const styles = ["Super Mario Bros.", "Super Mario Bros. 3", "Super Mario World", "New Super Mario Bros. U"];

module.exports = {
  name: "smm",
  description: "Search courses of Super Mario Maker from smmdb.net. API by Tarnadas.",
  aliases: ["supermariomaker"],
  usage: "<keywords>",
  category: 7,
  args: 1,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "keywords", "The course to search for.").setRequired(true)
  ]),
  async slash() {
    return InteractionResponse.sendMessage("Fetching courses...");
  },
  async postSlash(client, interaction, args) {
    InteractionResponse.deleteMessage(client, interaction).catch(() => { });
    args = args?.map(x => x?.value).filter(x => !!x);
    const message = await InteractionResponse.createFakeMessage(client, interaction);
    await this.execute(message, args);
  },
  async execute(message, args) {
    smm.searchCourses({ title: args.join(" ") }, async (error, courses) => {
      if (error) throw error;
      const allEmbeds = [];
      for (let i = 0; i < courses.length; i++) {
        const uploadedTime = readableDateTime(new Date(courses[i].uploaded));
        const modifiedTime = readableDateTime(new Date(courses[i].lastModified || courses[i].uploaded));
        const difficultyID = courses[i].difficulty;
        const creator = courses[i].maker;
        const gameStyleID = courses[i].gameStyle;
        const courseThemeID = courses[i].courseTheme;
        const courseThemeSubID = courses[i].courseThemeSub;
        const time = courses[i].time;
        const uploader = courses[i].uploader;
        const difficulty = difficulties[difficultyID];
        const gameStyle = styles[gameStyleID];
        const courseTheme = themes[courseThemeID];
        const courseThemeSub = themes[courseThemeSubID];
        var description = "No description";
        if (courses[i].description) description = courses[i].description;
        const Embed = new Discord.MessageEmbed()
          .setColor(color())
          .setTitle(courses[i].title)
          .setDescription(description)
          .addField("Uploaded", uploadedTime, true)
          .addField("Last Modified", modifiedTime, true)
          .addField("Difficulty", difficulty, true)
          .addField("Game Style", gameStyle, true)
          .addField("Course Theme", courseTheme, true)
          .addField("Subcourse Theme", courseThemeSub, true)
          .addField("Time", time, true)
          .addField("Maker", creator, true)
          .addField("Uploader", uploader, true)
          .setTimestamp()
          .setFooter("Have a nice day :)", message.client.user.displayAvatarURL());
        allEmbeds.push(Embed);
      }
      await createEmbedScrolling(message, allEmbeds);
    });
  }
};
