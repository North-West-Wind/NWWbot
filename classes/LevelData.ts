import { Snowflake } from "discord.js";

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