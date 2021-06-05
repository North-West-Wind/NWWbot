import { Collection, Guild, GuildMember, MessageAttachment, MessageEmbed, Snowflake, TextChannel, User } from "discord.js";
import { Pool } from "mysql2/promise";
import { Command } from "./Command";
import { ChannelObject, GuildMemberObject, RoleObject, UserObject } from "./Discord";
import { NorthClient } from "./NorthClient";
import { Interaction } from "slashcord/dist/utilities/interaction";

export class ApplicationCommand {
    name: string;
    description: string;
    options?: ApplicationCommandOption[];

    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }

    setName(name: string): ApplicationCommand {
        this.name = name;
        return this;
    }
    setDescription(description: string): ApplicationCommand {
        this.description = description;
        return this;
    }
    setOptions(options: ApplicationCommandOption[]): ApplicationCommand {
        this.options = options;
        return this;
    }

    static createBasic(cmd: Command): ApplicationCommand {
        return new ApplicationCommand(cmd.name, cmd.description);
    }
}

export class ApplicationCommandOption {
    type: number;
    name: string;
    description: string;
    required?: boolean;
    choices?: ApplicationCommandOptionChoice[];
    options?: ApplicationCommandOption[];

    constructor(type: number, name: string, description: string) {
        this.type = type;
        this.name = name;
        this.description = description;
    }

    setType(type: number): ApplicationCommandOption {
        this.type = type;
        return this;
    }
    setName(name: string): ApplicationCommandOption {
        this.name = name;
        return this;
    }
    setDescription(description: string): ApplicationCommandOption {
        this.description = description;
        return this;
    }
    setRequired(required: boolean): ApplicationCommandOption {
        this.required = required;
        return this;
    }
    setChoices(choices: ApplicationCommandOptionChoice[]): ApplicationCommandOption {
        this.choices = choices;
        return this;
    }
    setOptions(options: ApplicationCommandOption[]): ApplicationCommandOption {
        this.options = options;
        return this;
    }
}

export class ApplicationCommandOptionChoice {
    name: string;
    value: string | number;
    
    constructor(name: string, value: string | number) {
        this.name = name;
        this.value = value;
    }

    setName(name: string): ApplicationCommandOptionChoice {
        this.name = name;
        return this;
    }
    setValue(value: string | number): ApplicationCommandOptionChoice {
        this.value = value;
        return this;
    }
}

export enum ApplicationCommandOptionType {
    SUB_COMMAND = 1,
    SUB_COMMAND_GROUP = 2,
    STRING = 3,
    INTEGER = 4,
    BOOLEAN = 5,
    USER = 6,
    CHANNEL = 7,
    ROLE = 8
}

export class InteractionResponse {
    type: number;
    data?: InteractionApplicationCommandCallbackData;

    constructor(type: number) {
        this.type = type;
    }
    
    setType(type: number): InteractionResponse {
        this.type = type;
        return this;
    }
    setData(data: InteractionApplicationCommandCallbackData): InteractionResponse {
        this.data = data;
        return this;
    }

    static ackknowledge(): InteractionResponse {
        return new InteractionResponse(2);
    }
    static wait(): InteractionResponse {
        return new InteractionResponse(InteractionResponseType.DeferredChannelMessageWithSource.valueOf());
    }
    static sendMessage(message: string): InteractionResponse {
        return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setContent(message));
    }
    static sendEmbeds(...embed: MessageEmbed[]) {
        return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setEmbeds(embed.map(e => e.toJSON())));
    }
    static reply(id: Snowflake, message: string): InteractionResponse {
        return this.sendMessage(`<@${id}>, ${message}`);
    }
    static async editMessage(client: any, interaction: Interaction, data: any): Promise<Snowflake> {
        const { id } = await client.api.webhooks(client.user.id, interaction.token).messages["@original"].patch({ data: data });
        return id;
    }
    static async createResponse(client: any, interaction: Interaction, response: InteractionResponse): Promise<void> {
        await client.api.interactions(interaction.id, interaction.token).callback.post({ data: JSON.parse(JSON.stringify(response)) });
    }
    static async deleteMessage(client: any, interaction: Interaction): Promise<void> {
        await client.api.webhooks(client.user.id, interaction.token).messages["@original"].delete();
    }
    static async createFakeMessage(interaction: Interaction): Promise<FakeMessage> {
        const client: NorthClient = <NorthClient> interaction.client;
        var message = new FakeMessage(client);
        if (interaction.guild) {
            message.guild = interaction.guild;
            message.channel = interaction.channel;
            message.member = interaction.member;
            message.author = interaction.member.user;
        } else {
            message.channel = interaction.channel;
            message.author = <User> <any> interaction.channel;
        }
        message.reply = async(str: string) => await message.channel.send(`<@${message.author.id}>, ${str}`);
        return message;
    }
}

export class FakeMessage {
    prefix: string = "/";
    client: NorthClient;
    guild?: Guild;
    channel?: TextChannel | User;
    author?: User;
    reply: Function;
    pool: Pool;
    member?: GuildMember;
    readonly attachments: Collection<Snowflake, MessageAttachment> = new Collection();

    constructor(client: NorthClient) {
        this.client = client;
        this.pool = client.pool;
    }

    static async createFakeMessage(interaction: Interaction): Promise<FakeMessage> {
        const client: NorthClient = <NorthClient> interaction.client;
        var message = new FakeMessage(client);
        if (interaction.guild) {
            message.guild = interaction.guild;
            message.channel = interaction.channel;
            message.member = interaction.member;
            message.author = interaction.member.user;
        } else {
            message.channel = interaction.channel;
            message.author = <User> <any> interaction.channel;
        }
        message.reply = async(str: string) => await message.channel.send(`<@${message.author.id}>, ${str}`);
        return message;
    }
}

export class InteractionApplicationCommandCallbackData {
    tts?: boolean;
    content?: string;
    embeds?: any[]
    allowed_mentions?: any;
    flags?: number;
    
    setTTS(tts: boolean): InteractionApplicationCommandCallbackData {
        this.tts = tts;
        return this;
    }
    setContent(content: string): InteractionApplicationCommandCallbackData {
        this.content = content;
        return this;
    }
    setEmbeds(embeds: any[]): InteractionApplicationCommandCallbackData {
        this.embeds = embeds;;
        return this;
    }
    setAllowedMentions(allowed_mentions: any): InteractionApplicationCommandCallbackData {
        this.allowed_mentions = allowed_mentions;
        return this;
    }
    setFlags(flags: number): InteractionApplicationCommandCallbackData {
        this.flags = flags;
        return this;
    }
}

export enum InteractionResponseType {
    Pong = 1,
    Acknowledge = 2,
    ChannelMessage = 3,
    ChannelMessageWithSource = 4,
    DeferredChannelMessageWithSource = 5
}

export enum InteractionType {
    Ping = 1,
    ApplicationCommand = 2,
    MessageComponent = 3
}

export interface ApplicationCommandInteractionData {
    id: Snowflake;
    name: string;
    resolved?: ApplicationCommandInteractionDataResolved;
    options?: ApplicationCommandOption;
    custom_id: string;
    component_type: number;
}

export interface ApplicationCommandInteractionDataResolved {
    users?: Map<Snowflake, UserObject>;
    members?: Map<Snowflake, GuildMemberObject>;
    roles?: Map<Snowflake, RoleObject>;
    channels?: Map<Snowflake, ChannelObject>;
}