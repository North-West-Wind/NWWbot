import { Client, ClientOptions, Collection, CommandInteraction, GuildMember, Invite, Message, MessageEmbed, Snowflake, User } from "discord.js";
import { RowDataPacket } from "mysql2/promise";
import { strDist } from "../function.js";

export class NorthClient extends Client {
    constructor(options?: ClientOptions) {
        super(options);
    }

    id: number;
    prefix: string;
    version: string;
    static storage: ClientStorage;

    setVersion(version: string) { this.version = version; }
}

export abstract class IPrefix {
    abstract run(message: NorthMessage, args: string[]): Promise<any> | any;
}

export abstract class ISlash {
    options?: any[];
    
    abstract execute(interaction: NorthInteraction): Promise<any> | any;
}

export abstract class Command {
    name: string;
    description: string;
    args?: number;
    usage?: string;
    category?: number;
    aliases?: string[];
    subcommands?: string[];
    subaliases?: string[];
    subdesc?: string[];
    subusage?: (string | number)[];
    permissions?: { guild?: { user?: number, me?: number }, channel?: { user?: number, me?: number } };
}

export abstract class PrefixCommand extends Command implements IPrefix {
    abstract run(message: NorthMessage, args: string[]): Promise<any> | any;
}

export abstract class SlashCommand extends Command implements ISlash {
    options?: any[];

    abstract execute(interaction: NorthInteraction): Promise<any> | any;
}

export abstract class FullCommand extends Command implements ISlash, IPrefix {
    options?: any[];

    abstract run(message: NorthMessage, args: string[]): Promise<any> | any;
    abstract execute(interaction: NorthInteraction): Promise<any> | any;
}

export class Card {
    constructor(c: number, n: number) {
        this.color = c;
        this.number = n;
    }

    color: number;
    number: number;
}

export class Player {
    constructor(u: User, c: Card[]) {
        this.user = u;
        this.card = c;
    }

    user: User;
    card: Card[];
}

export class UnoGame {
    constructor(p: Collection<Snowflake, Player>, c: Card, cs: number) {
        this.players = p;
        this.card = c;
        this.cards = cs;
    }

    players: Collection<Snowflake, Player>;
    card: Card;
    cards: number;
}

export interface Poll {
    options: string[];
    votes: Set<Snowflake>[];
}

export interface Giveaway {
    winner: number;
    emoji: string;
}

export interface RoleMessage {
    id: Snowflake;
    guild: Snowflake;
    channel: Snowflake;
    author: Snowflake;
    roles: Snowflake[][];
    emojis: string[];
}

export interface InfoBase {
    message?: string;
    channel?: Snowflake;
}

export interface WelcomeInfo extends InfoBase {
    image: { images: string[], format: string };
    autorole: Snowflake[];
}

export interface Applications {
    roles: Snowflake[];
    admins: Snowflake[];
    channel: Snowflake;
    duration: number;
    applications: Collection<Snowflake, { id: Snowflake, role: Snowflake, author: Snowflake, approve: Set<Snowflake>, decline: Set<Snowflake> }>;
    templates: Collection<Snowflake, string>;
}

export interface VoiceConfig {
    kick: { channels: Snowflake[], timeout: number };
}

export interface Translation {
    messageId: Snowflake;
    channelId: Snowflake;
    guildId: Snowflake;
    translations: Collection<string, { channelId: Snowflake, messageId: Snowflake }>;
    existingId?: Snowflake;
    ended?: boolean;
}

export interface GuildConfigs {
    [key: Snowflake]: GuildConfig;
}

export class GuildConfig {
    prefix?: string;
    token?: string;
    giveaway: string;
    welcome: WelcomeInfo;
    leave: InfoBase;
    boost: InfoBase;
    safe: boolean;
    applications: Applications;
    voice: VoiceConfig;
    translations: Collection<Snowflake, Translation> = new Collection();
    invites?: Collection<string, Invite>;
    exit?: boolean;
    joinedMembers: GuildMember[] = [];
    joinedClear: NodeJS.Timeout;
    pendingKick: Set<Snowflake> = new Set();
    levelData: Collection<Snowflake, LevelData> = new Collection();

    constructor(data: RowDataPacket = (<RowDataPacket> {})) {
        if (data) {
            this.prefix = data.prefix;
            this.token = data.token;
            this.giveaway = data.giveaway || "🎉";
            this.welcome = {
                message: data.wel_msg,
                channel: data.wel_channel,
                image: {
                    images: data.wel_img?.split(",").map((url: string) => decodeURIComponent(url)) || [],
                    format: data.wel_img_format
                },
                autorole: data.autorole?.split(",") || []
            };
            this.leave = {
                message: data.leave_msg,
                channel: data.leave_channel
            };
            this.boost = {
                message: data.boost_msg,
                channel: data.boost_channel
            };
            if (data.safe == 1) this.safe = true;
            else this.safe = false;

            this.applications = {
                roles: data.app_roles?.split(",") || [],
                admins: data.admin_roles?.split(",") || [],
                channel: data.app_channel,
                duration: data.vote_duration,
                applications: new Collection(),
                templates: new Collection()
            };
            if (data.applications) for (const application of JSON.parse(data.applications)) {
                this.applications.applications.set(application.id, application);
            }
            if (data.templates) for (const template of JSON.parse(decodeURIComponent(data.templates))) {
                this.applications.templates.set(template.id, template.val);
            }
            this.voice = {
                kick: {
                    channels: data.voice_kick_channels?.split(",") || [],
                    timeout: data.voice_kick_timeout || -1
                }
            };
        }
    }

    checkMember(member: GuildMember) {
        const close = this.joinedMembers.filter(mem => strDist(member.user.username, mem.user.username) <= 2);
        this.joinedMembers.push(member);
        if (this.joinedMembers.length > 10) this.joinedMembers.slice(this.joinedMembers.length - 10);
        if (this.joinedClear) this.joinedClear.refresh();
        else this.joinedClear = setTimeout(() => this.joinedMembers = [], 60000);
        return close;
    }
}

export class ClientStorage {
    guilds: GuildConfigs = {};
    polls: Collection<Snowflake, Poll> = new Collection();
    giveaways: Collection<Snowflake, Giveaway> = new Collection();
    rm: RoleMessage[] = [];
    timers: Collection<Snowflake, NodeJS.Timeout> = new Collection();
    noLog: Snowflake[] = [];
    commands: Collection<string, Command> = new Collection();
    items: Collection<string, Item> = new Collection();
    card: Collection<string, Card> = new Collection();
    uno: Collection<number, UnoGame> = new Collection();
    mathgames: Collection<any, any> = new Collection();
    migrating: any[] = [];
    gtimers: GuildTimer[] = [];
}

export class LevelData {
    constructor(author: Snowflake, guild: Snowflake, exp: number, date: Date, multiplier?: number) {
        this.author = author;
        this.guild = guild;
        this.exp = exp;
        this.date = date;
        if (multiplier) this.multiplier = multiplier;
    }

    author: Snowflake;
    guild: Snowflake;
    exp: number;
    date: Date;
    multiplier: number = 1;
    changed: boolean;
}

export class PollVote {
    constructor(m: Snowflake) {
        this.message = m;
    }

    message: Snowflake;
}

export class NorthMessage extends Message {
    prefix: string;
    client: NorthClient;
}

export class NorthInteraction extends CommandInteraction {
    readonly prefix: string = "/";
    client: NorthClient;
}

export interface Item {
    name: string;
    id: string;
    run(message: NorthMessage | CommandInteraction, msg: Message, em: MessageEmbed, itemObject: any): Promise<any> | any;
}

export interface GuildTimer {
    user: Snowflake;
    dc_rank: string;
    mc: string;
    endAt: Date;
}

export interface DailyModule {
    name: string;
    description: string;

    get(): any;
    update(): void;
}