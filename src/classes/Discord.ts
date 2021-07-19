import { Snowflake } from "discord.js";

export interface UserObject {
    id: Snowflake;
    username: string;
    discriminator: string;
    avatar: string;
    bot?: boolean;
    system?: boolean;
    mfa_enabled?: boolean;
    locale?: string;
    verified?: boolean;
    email?: string;
    flags?: number;
    permium_type?: number;
    public_flags?: number;
}

export interface GuildMemberObject {
    user?: UserObject;
    nick?: string;
    roles: RoleObject[];
    joined_at: any;
    premium_since?: any;
    deaf: boolean;
    mute: boolean;
    pending?: boolean;
    permissions?: string;
}

export interface RoleObject {
    id: Snowflake;
    name: string;
    color: number;
    hoist: boolean;
    position: number;
    permissions: string;
    managed: boolean;
    mentionable: boolean;
    tags?: RoleTags;
}

export interface RoleTags {
    bot_id?: Snowflake;
    integration_id?: Snowflake;
    premium_subscriber?: null;
}

export interface ChannelObject {
    id: Snowflake;
    type: number;
    guild_id?: Snowflake;
    position?: number;
    permission_overwrites?: OverwriteObject[];
    name?: string;
    topic?: string;
    nsfw?: boolean;
    last_message_id?: Snowflake;
    bitrate?: number;
    user_limit?: number;
    rate_limit_per_user?: number;
    recipients?: UserObject[];
    icon?: string;
    owner_id?: Snowflake;
    application_id?: Snowflake;
    parent_id?: Snowflake;
    last_pin_timestamp?: any;
    rtc_region?: string;
    video_quality_mode?: number;
    message_count?: number;
    member_count?: number;
    thread_metadata?: ThreadMetadataObject;
    member?: ThreadMemberObject;
}

export interface OverwriteObject {
    id: Snowflake;
    type: number;
    allow: string;
    deny: string;
}

export interface ThreadMetadataObject {
    archived: boolean;
    archiver_id?: Snowflake;
    auto_archive_duration: number;
    archive_timestamp: any;
    locked?: boolean;
}

export interface ThreadMemberObject {
    id: Snowflake;
    user_id: Snowflake;
    join_timestamp: any;
    flags: number;
}