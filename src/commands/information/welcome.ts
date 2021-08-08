
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import * as Discord from "discord.js";
import { createCanvas, loadImage } from "canvas";
import { findMember, replaceMsgContent } from "../../function";

class WelcomeCommand implements SlashCommand {
    name = "welcome"
    description = "Test the welcome message and image."
    category = 6
    usage = "[user | user ID]"
    options = [{
        name: "user",
        description: "The user for testing.",
        required: false,
        type: "USER"
    }];

    async execute(interaction: NorthInteraction) {
        if (!interaction.guild) return await interaction.reply("This command only works on server.");
        var member = <Discord.GuildMember> (interaction.options.getMember("user") || interaction.member);
        const { message, image, error } = await this.getWelcome(member, interaction.client);
        await interaction.reply(message);
        if (!error) await interaction.channel.send(image);
    }

    async run(message: NorthMessage, args: string[]) {
        var member = message.member;
        if (args[0]) {
            member = await findMember(message, args[0]);
            if (!member) member = message.member;
        }
        const { message: msg, image, error } = await this.getWelcome(member, message.client);
        await message.channel.send(msg);
        if (!error) await message.channel.send(image);
    }

    async getWelcome(member: Discord.GuildMember, client: NorthClient) {
        const guild = member.guild;
        const result = { message: null, image: null, error: true };
        try {
            const welcome = NorthClient.storage.guilds[guild.id]?.welcome;
            if (!welcome?.channel) {
                if (NorthClient.storage.guilds[guild.id]) return { message: "No configuration found!", image: null, error: true };
                await client.pool.query(`INSERT INTO servers (id, autorole, giveaway) VALUES ('${guild.id}', '[]', '🎉')`);
                NorthClient.storage.log("Inserted record for " + guild.name);
            } else {
                if (!welcome.channel) return { message: "No welcome channel found!", image: null, error: true };
                if (welcome.message) try {
                    const welcomeMessage = replaceMsgContent(welcome.message, guild, client, member, "welcome");
                    result.message = welcomeMessage;
                } catch (err) {
                    NorthClient.storage.error(err);
                }
                if (welcome.image) {
                    var img = new Image();
                    img.onload = async () => {
                        var height = img.height;
                        var width = img.width;
                        const canvas = createCanvas(width, height);
                        const ctx = canvas.getContext("2d");
                        const applyText = (canvas, text) => {
                            const ctx = canvas.getContext("2d");
                            let fontSize = canvas.width / 12;
                            do {
                                ctx.font = `regular ${(fontSize -= 5)}px "NotoSans", "free-sans", Arial`;
                            } while (ctx.measureText(text).width > canvas.width * 9 / 10);
                            return ctx.font;
                        };
                        const welcomeText = (canvas, text) => {
                            const ctx = canvas.getContext("2d");
                            let fontSize = canvas.width / 24;
                            do {
                                ctx.font = `regular ${(fontSize -= 5)}px "NotoSans", "free-sans", Arial`;
                            } while (ctx.measureText(text).width > canvas.width * 3 / 4);
                            return ctx.font;
                        };
                        const avatar = await loadImage(member.user.displayAvatarURL({ format: "png" }));
                        ctx.drawImage(img, 0, 0, width, height);
                        const txt = member.user.tag;
                        ctx.font = applyText(canvas, txt);
                        ctx.strokeStyle = "black";
                        ctx.lineWidth = canvas.width / 102.4;
                        ctx.strokeText(txt, canvas.width / 2 - ctx.measureText(txt).width / 2, (canvas.height * 3) / 4);
                        ctx.fillStyle = "#ffffff";
                        ctx.fillText(txt, canvas.width / 2 - ctx.measureText(txt).width / 2, (canvas.height * 3) / 4);
                        const welcome = "Welcome to the server!";
                        ctx.font = welcomeText(canvas, welcome);
                        ctx.strokeStyle = "black";
                        ctx.lineWidth = canvas.width / 204.8;
                        ctx.strokeText(welcome, canvas.width / 2 - ctx.measureText(welcome).width / 2, (canvas.height * 6) / 7);
                        ctx.fillStyle = "#ffffff";
                        ctx.fillText(welcome, canvas.width / 2 - ctx.measureText(welcome).width / 2, (canvas.height * 6) / 7);
                        ctx.beginPath();
                        ctx.lineWidth = canvas.width / 51.2;
                        ctx.arc(canvas.width / 2, canvas.height / 3, canvas.height / 5, 0, Math.PI * 2, true);
                        ctx.closePath();
                        ctx.strokeStyle = "#dfdfdf";
                        ctx.stroke();
                        ctx.clip();
                        ctx.drawImage(avatar, canvas.width / 2 - canvas.height / 5, canvas.height / 3 - canvas.height / 5, canvas.height / 2.5, canvas.height / 2.5);
                        var attachment = new Discord.MessageAttachment(canvas.toBuffer(), "welcome-image.png");
                        try {
                            result.image = attachment
                        } catch (err) {
                            NorthClient.storage.error(err);
                        }
                    };
                    var url = welcome.image;
                    try {
                        let urls = JSON.parse(welcome.img);
                        if (Array.isArray(urls)) url = urls[Math.floor(Math.random() * urls.length)];
                    } catch (err) { }
                    img.src = url;
                }
            }
            result.error = false;
        } catch (err) { NorthClient.storage.error(err); }
        return result;
    }
};

const cmd = new WelcomeCommand();
export default cmd;