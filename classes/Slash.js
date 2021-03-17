"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionResponseType = exports.InteractionApplicationCommandCallbackData = exports.InteractionResponse = exports.ApplicationCommandOptionType = exports.ApplicationCommandOptionChoice = exports.ApplicationCommandOption = exports.ApplicationCommand = void 0;
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
    static sendMessage(message) {
        return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setContent(message));
    }
    static sendEmbeds(...embed) {
        return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setEmbeds(embed.map(e => e.toJSON())));
    }
    static reply(id, message) {
        return this.sendMessage(`<@${id}>, ${message}`);
    }
}
exports.InteractionResponse = InteractionResponse;
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
