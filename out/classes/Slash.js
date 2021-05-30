"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionResponseType = exports.InteractionApplicationCommandCallbackData = exports.InteractionResponse = exports.ApplicationCommandOptionType = exports.ApplicationCommandOptionChoice = exports.ApplicationCommandOption = exports.ApplicationCommand = void 0;
const discord_js_1 = require("discord.js");
class ApplicationCommand {
    constructor(name, description) {
        this.name = name;
        this.description = description;
    }
    setName(name) {
        this.name = name;
        return this;
    }
    setDescription(description) {
        this.description = description;
        return this;
    }
    setOptions(options) {
        this.options = options;
        return this;
    }
    static createBasic(cmd) {
        return new ApplicationCommand(cmd.name, cmd.description);
    }
}
exports.ApplicationCommand = ApplicationCommand;
class ApplicationCommandOption {
    constructor(type, name, description) {
        this.type = type;
        this.name = name;
        this.description = description;
    }
    setType(type) {
        this.type = type;
        return this;
    }
    setName(name) {
        this.name = name;
        return this;
    }
    setDescription(description) {
        this.description = description;
        return this;
    }
    setRequired(required) {
        this.required = required;
        return this;
    }
    setChoices(choices) {
        this.choices = choices;
        return this;
    }
    setOptions(options) {
        this.options = options;
        return this;
    }
}
exports.ApplicationCommandOption = ApplicationCommandOption;
class ApplicationCommandOptionChoice {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
    setName(name) {
        this.name = name;
        return this;
    }
    setValue(value) {
        this.value = value;
        return this;
    }
}
exports.ApplicationCommandOptionChoice = ApplicationCommandOptionChoice;
var ApplicationCommandOptionType;
(function (ApplicationCommandOptionType) {
    ApplicationCommandOptionType[ApplicationCommandOptionType["SUB_COMMAND"] = 1] = "SUB_COMMAND";
    ApplicationCommandOptionType[ApplicationCommandOptionType["SUB_COMMAND_GROUP"] = 2] = "SUB_COMMAND_GROUP";
    ApplicationCommandOptionType[ApplicationCommandOptionType["STRING"] = 3] = "STRING";
    ApplicationCommandOptionType[ApplicationCommandOptionType["INTEGER"] = 4] = "INTEGER";
    ApplicationCommandOptionType[ApplicationCommandOptionType["BOOLEAN"] = 5] = "BOOLEAN";
    ApplicationCommandOptionType[ApplicationCommandOptionType["USER"] = 6] = "USER";
    ApplicationCommandOptionType[ApplicationCommandOptionType["CHANNEL"] = 7] = "CHANNEL";
    ApplicationCommandOptionType[ApplicationCommandOptionType["ROLE"] = 8] = "ROLE";
})(ApplicationCommandOptionType = exports.ApplicationCommandOptionType || (exports.ApplicationCommandOptionType = {}));
class InteractionResponse {
    constructor(type) {
        this.type = type;
    }
    setType(type) {
        this.type = type;
        return this;
    }
    setData(data) {
        this.data = data;
        return this;
    }
    static ackknowledge() {
        return new InteractionResponse(2);
    }
    static wait() {
        return new InteractionResponse(InteractionResponseType.DeferredChannelMessageWithSource.valueOf());
    }
    static sendMessage(message) {
        return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setContent(message));
    }
    static sendEmbeds(...embed) {
        return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setEmbeds(embed.map(e => e.toJSON())));
    }
    static reply(id, message) {
        return this.sendMessage(`<@${id}>, ${message}`);
    }
    static editMessage(client, interaction, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = yield client.api.webhooks(client.user.id, interaction.token).messages["@original"].patch({ data: data });
            return id;
        });
    }
    static createResponse(client, interaction, response) {
        return __awaiter(this, void 0, void 0, function* () {
            yield client.api.interactions(interaction.id, interaction.token).callback.post({ data: JSON.parse(JSON.stringify(response)) });
        });
    }
    static deleteMessage(client, interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            yield client.api.webhooks(client.user.id, interaction.token).messages["@original"].delete();
        });
    }
    static createFakeMessage(client, interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            var message = new FakeMessage(client);
            if (interaction.guild_id) {
                message.guild = yield client.guilds.fetch(interaction.guild_id);
                message.channel = (yield client.channels.fetch(interaction.channel_id));
                message.member = yield message.guild.members.fetch(interaction.member.user.id);
                message.author = message.member.user;
            }
            else {
                message.author = yield client.users.fetch(interaction.user.id);
                message.channel = message.author;
            }
            message.reply = (str) => __awaiter(this, void 0, void 0, function* () { return yield message.channel.send(`<@${message.author.id}>, ${str}`); });
            return message;
        });
    }
}
exports.InteractionResponse = InteractionResponse;
class FakeMessage {
    constructor(client) {
        this.prefix = "/";
        this.attachments = new discord_js_1.Collection();
        this.client = client;
        this.pool = client.pool;
    }
}
class InteractionApplicationCommandCallbackData {
    setTTS(tts) {
        this.tts = tts;
        return this;
    }
    setContent(content) {
        this.content = content;
        return this;
    }
    setEmbeds(embeds) {
        this.embeds = embeds;
        ;
        return this;
    }
    setAllowedMentions(allowed_mentions) {
        this.allowed_mentions = allowed_mentions;
        return this;
    }
    setFlags(flags) {
        this.flags = flags;
        return this;
    }
}
exports.InteractionApplicationCommandCallbackData = InteractionApplicationCommandCallbackData;
var InteractionResponseType;
(function (InteractionResponseType) {
    InteractionResponseType[InteractionResponseType["Pong"] = 1] = "Pong";
    InteractionResponseType[InteractionResponseType["Acknowledge"] = 2] = "Acknowledge";
    InteractionResponseType[InteractionResponseType["ChannelMessage"] = 3] = "ChannelMessage";
    InteractionResponseType[InteractionResponseType["ChannelMessageWithSource"] = 4] = "ChannelMessageWithSource";
    InteractionResponseType[InteractionResponseType["DeferredChannelMessageWithSource"] = 5] = "DeferredChannelMessageWithSource";
})(InteractionResponseType = exports.InteractionResponseType || (exports.InteractionResponseType = {}));
