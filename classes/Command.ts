import { NorthClient } from "./NorthClient";
import { NorthMessage } from "./NorthMessage";
import { ApplicationCommand, FakeMessage, Interaction, InteractionResponse } from "./Slash";

export interface Command {
    name: string;
    description: string;
    args?: number;
    usage?: string;
    category?: number;
    aliases?: string[];
    subcommands?: string[];
    subaliases?: string[];
    permission?: number;
    slashInit?: boolean;

    execute(message: NorthMessage | FakeMessage, ...args: string[]): Promise<any | void>;
}

export interface SlashCommand extends Command {
    slashInit: boolean;

    register(): ApplicationCommand;
    slash(client: NorthClient, interaction: Interaction, args: any[]): Promise<InteractionResponse>;
    postSlash?(client: NorthClient, interaction: Interaction, args: any[]): Promise<any | void>;
}