import { EmojiIdentifierResolvable, Guild, Message, MessageButtonStyle, Snowflake, VoiceChannel } from "discord.js";
import { capitalize, mysqlEscape, query } from "../function.js";
import { FullCommand, ISlash, NorthClient, SlashCommand } from "./NorthClient.js";

interface StorageInfo {
  column: string;
  location?: string[];
}

class Base {
  id: string;
  name: string;
  description: string;
  style?: MessageButtonStyle;
  emoji?: EmojiIdentifierResolvable;
}

export class Setting extends Base {
  type: SettableType;
  time: number;
  storage: StorageInfo;
  longname: string;
  extra?: any;
  default?: any;
  hints: string[] = [];

  constructor(id: string, name: string, description: string, type: SettableType, time: number, style?: MessageButtonStyle, emoji?: string, longname?: string) {
    super();
    this.id = id;
    this.name = name || capitalize(this.id);
    this.description = description;
    this.type = type;
    this.time = time;
    this.style = style;
    this.emoji = emoji;
    this.longname = longname || this.name;
    if (type === "roles") this.extra = { max: 25 }
  }

  info(storage: StorageInfo) {
    this.storage = storage;
    return this;
  }

  def(val: any) {
    this.default = val;
    return this;
  }

  addHint(...hint: string[]) {
    this.hints.push(...hint);
    return this;
  }
}

export class Category extends Base {
  children: (Setting | Category)[];

  constructor(children: (Setting | Category)[]);
  constructor(breeder: { (self: Category, guild: Guild): Promise<void> });
  constructor(breederOrChildren: (Setting | Category)[] | { (self: Category, guild: Guild): Promise<void> }) {
    super();
    if (Array.isArray(breederOrChildren)) this.children = breederOrChildren;
    else this.breeder = breederOrChildren;
  }

  async breeder?(self: Category, guild: Guild): Promise<void>;

  info(information: Base) {
    this.id = information.id;
    this.name = information.name;
    this.description = information.description;
    this.style = information.style;
    this.emoji = information.emoji;
    return this;
  }
}

export class SafeSetting extends Setting {
  constructor(id: string, name: string, description: string, time: number, style?: MessageButtonStyle, emoji?: string, longname?: string) {
    super(id, name, description, "boolean", time, style, emoji, longname);
    this.extra = { post: this.handler };
  }

  async handler(msg: Message, value: any) {
    if (value) {
      for (const command of NorthClient.storage.commands.values()) {
        if (command.category !== 5 || !(typeof command["execute"] === "function")) continue;
        try {
          const options = {
            name: command.name,
            description: command.description,
            options: (<ISlash> <unknown> command).options
          };
          await msg.client.application.commands.create(options, msg.guildId);
        } catch (err: any) {
          console.error("Failed to create slash command " + command.name);
          console.error(err);
        }
      }
    } else {
      const commands = await msg.guild.commands.fetch();
      for (const command of commands.values()) {
        if (NorthClient.storage.commands.get(command.name)?.category !== 5) continue;
        try {
          await msg.client.application.commands.delete(command.id, command.guildId);
        } catch (err: any) {
          console.error("Failed to delete slash command " + command.name);
          console.error(err);
        }
      }
    }
  }
}

export class TemplateSetting extends Setting {
  constructor(id: string, name: string, description: string, time: number, style?: MessageButtonStyle, emoji?: string, longname?: string) {
    super(id, name, description, "message", time, style, emoji, longname);
    this.extra = { sql: this.sql };
  }

  async sql(_column: string, _val: any, guild: Snowflake) {
    await query(`UPDATE server SET templates = "${mysqlEscape(JSON.stringify(NorthClient.storage.guilds[guild].applications.templates.map((val, key) => { const obj = {}; obj[key] = val; return obj; })))}" WHERE id = ${guild}`);
  }
}

export class MutedKickSetting extends Setting {
  constructor(id: string, name: string, description: string, type: SettableType, time: number, style?: MessageButtonStyle, emoji?: string, longname?: string) {
    super(id, name, description, type, time, style, emoji, longname);
    this.extra = { post: this.post };
  }

  async post(msg: Message) {
    await MutedKickSetting.check(msg.guild);
  }

  static async check(guild: Guild) {
    const timeout = NorthClient.storage.guilds[guild.id].voice.kick.timeout;
    if (timeout < 0) return;
    for (const ch of NorthClient.storage.guilds[guild.id].voice.kick.channels) {
      const channel = <VoiceChannel> await guild.channels.fetch(ch);
      for (const member of channel.members.values()) {
        if (member.voice.mute) {
          NorthClient.storage.guilds[guild.id].pendingKick.add(member.id);
          setTimeout(async () => {
              if (NorthClient.storage.guilds[guild.id].pendingKick.delete(member.id))
                  member.voice.disconnect().catch(() => {});
          }, timeout);
        }
      }
    }
  }
}

export type SettableType = "message" | "text_channel" | "voice_channel" | "text_channels" | "voice_channels" | "image" | "roles" | "reaction" | "duration" | "boolean";
type SettableKeyType = "role";
export class KeyType {
  key: SettableKeyType;
  value: SettableType;

  constructor(key: SettableKeyType, value: SettableType) {
    this.key = key;
    this.value = value;
  }
}