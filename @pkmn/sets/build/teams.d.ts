import { PokemonSet, GenerationNum } from '@pkmn/types';
import { Data } from './sets';
export declare class Team<S = PokemonSet | Partial<PokemonSet>> {
    readonly team: Readonly<S[]>;
    readonly data?: Data | undefined;
    readonly format?: string | undefined;
    readonly name?: string | undefined;
    readonly folder?: string | undefined;
    constructor(team: Readonly<S[]>, data?: Data | undefined, format?: string | undefined, name?: string | undefined, folder?: string | undefined);
    get gen(): GenerationNum | undefined;
    pack(): string;
    static unpack(buf: string, data?: Data): Team<PokemonSet<string>> | undefined;
    export(data?: Data): string;
    static import(buf: string, data?: Data): Team<PokemonSet<string> | Partial<PokemonSet<string>>> | undefined;
    toString(data?: Data): string;
    static fromString(str: string, data?: Data): Team<PokemonSet<string> | Partial<PokemonSet<string>>> | undefined;
    toJSON(): string;
    static fromJSON(json: string): Team<PokemonSet> | undefined;
}
export declare const Teams: {
    packTeam<S>(team: Team<S>): string;
    unpackTeam(buf: string, data?: Data | undefined): Team<PokemonSet> | undefined;
    importTeam(buf: string, data?: Data | undefined): Team | undefined;
    importTeams(buf: string, data?: Data | undefined, one?: boolean | undefined): Readonly<Team<Partial<PokemonSet>>[]>;
    exportTeams<S_1>(teams: readonly Team<S_1>[], data?: Data | undefined): string;
    toString<S_2>(teams: readonly Team<S_2>[], data?: Data | undefined): string;
    fromString(str: string, data?: Data | undefined): Readonly<Team<Partial<PokemonSet>>[]>;
};
