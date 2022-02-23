import { AudioPlayer, AudioPlayerStatus, AudioResource, VoiceConnection } from "@discordjs/voice";
import { Client, ClientOptions, Collection, CommandInteraction, Invite, Message, MessageEmbed, Snowflake, TextChannel, User, VoiceChannel } from "discord.js";
import { Pool, RowDataPacket } from "mysql2/promise";
import { removeUsing } from "../helpers/music.js";

export class NorthClient extends Client {
    constructor(options: ClientOptions) {
        super(options);
    }

    id: number;
    prefix: string;
    version: string;
    static storage: ClientStorage;

    setVersion(version: string) { this.version = version; }
}

export interface Command {
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

    run(message: NorthMessage, args: string[]): Promise<any> | any;
}

export interface SlashCommand extends Command {
    options?: any[];

    execute(interaction: NorthInteraction): Promise<any> | any;
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
    expiration: number;
    roles: Snowflake[][];
    emojis: string[];
}

export interface InfoBase {
    message?: string;
    channel?: Snowflake;
}

export interface WelcomeInfo extends InfoBase {
    image?: string[];
    autorole: Snowflake[];
}

export interface Applications {
    roles: Snowflake[];
    admins: Snowflake[];
    channel: Snowflake;
    duration: number;
    applications: Collection<Snowflake, { id: Snowflake, role: Snowflake, author: Snowflake, approve: Set<Snowflake>, decline: Set<Snowflake> }>;
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
    invites?: Collection<string, Invite>;
    exit?: boolean;

    constructor(data: RowDataPacket = (<RowDataPacket> {})) {
        if (data) {
            this.prefix = data.prefix;
            this.token = data.token;
            this.giveaway = data.giveaway || "🎉";
            this.welcome = {
                message: data.wel_msg,
                channel: data.wel_channel,
                image: data.wel_img?.split(",").map(url => decodeURIComponent(url)) || [],
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
            if (data.safe === undefined) this.safe = true;
            else this.safe = !!data.safe;

            this.applications = {
                roles: data.app_roles?.split(",") || [],
                admins: data.admin_roles?.split(",") || [],
                channel: data.app_channel,
                duration: data.vote_duration,
                applications: new Collection()
            };
            if (data.applications) for (const application of JSON.parse(unescape(data.applications))) {
                this.applications.applications.set(application.id, application);
            }
        }
    }
}

export class ClientStorage {
    guilds: GuildConfigs = {};
    polls: Collection<Snowflake, Poll> = new Collection();
    giveaways: Collection<Snowflake, Giveaway> = new Collection();
    rm: RoleMessage[] = [];
    timers: Collection<Snowflake, NodeJS.Timeout> = new Collection();
    noLog: Snowflake[] = [];
    commands: Collection<string, SlashCommand> = new Collection();
    items: Collection<string, Item> = new Collection();
    card: Collection<string, Card> = new Collection();
    uno: Collection<number, UnoGame> = new Collection();
    mathgames: Collection<any, any> = new Collection();
    migrating: any[] = [];
    gtimers: GuildTimer[] = [];
    pendingLvlData: LevelData[] = [];
}

export class LevelData {
    constructor(a: Snowflake, g: Snowflake, e: number, d: string) {
        this.author = a;
        this.guild = g;
        this.exp = e;
        this.date = d;
    }

    author: Snowflake;
    guild: Snowflake;
    exp: number;
    date: string;
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

export class ServerQueue {
    constructor(songs: SoundTrack[], loopStatus: boolean, repeatStatus: boolean) {
        this.textChannel = null;
        this.voiceChannel = null;
        this.connection = null;
        this.player = null;
        this.songs = songs;
        this.volume = 1;
        this.playing = false;
        this.paused = false;
        this.looping = loopStatus;
        this.repeating = repeatStatus;
        this.random = false;
    }

    textChannel: TextChannel;
    voiceChannel: VoiceChannel;
    connection: VoiceConnection;
    player: AudioPlayer;
    resource?: AudioResource;
    songs: SoundTrack[];
    volume: number;
    playing: boolean;
    paused: boolean;
    looping: boolean;
    repeating: boolean;
    random: boolean;
    startTime?: number;
    errorCounter?: number;
    isSkipping?: boolean;
    seek?: number;

    getPlaybackDuration() {
        if (this.player?.state?.status != AudioPlayerStatus.Playing) return 0;
        return this.player.state.playbackDuration;
    }

    destroy() {
        try {
            this.player?.stop();
            this.connection?.destroy();
            removeUsing(this.songs[0].id);
        } catch (err: any) { }
        this.player = null;
        this.connection = null;
    }

    stop() {
        try {
            this.player?.stop();
        } catch (err: any) { }
        this.player = null;
    }
}

export class SoundTrack {
    id?: string;
    title: string;
    url: string;
    type: number;
    time: number;
    volume: number;
    thumbnail: string;
    isLive: boolean;
    isPastLive?: boolean;
    spot?: string;
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
