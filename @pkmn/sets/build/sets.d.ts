import { GenerationNum, ID, PokemonSet } from '@pkmn/types';
export interface DataTable<T> {
    get(name: string): Readonly<T> | undefined;
}
export interface Data {
    forGen?(gen: GenerationNum): Data;
    readonly gen: GenerationNum;
    readonly abilities: DataTable<{
        name: string;
    }>;
    readonly items: DataTable<{
        name: string;
    }>;
    readonly moves: DataTable<{
        name: string;
    }>;
    readonly natures: DataTable<{
        name: string;
    }>;
    readonly species: DataTable<{
        name: string;
        baseSpecies?: string;
        abilities?: {
            0: string;
            1?: string;
            H?: string;
            S?: string;
        };
    }>;
}
export declare function toID(s: any): ID;
export { PokemonSet } from '@pkmn/types';
export declare const Sets: {
    pack(s: Partial<PokemonSet>): string;
    packSet(s: Partial<PokemonSet>): string;
    exportSet(s: Partial<PokemonSet>, data?: Data | undefined): string;
    unpack(buf: string, data?: Data | undefined): PokemonSet<string> | undefined;
    unpackSet(buf: string, data?: Data | undefined): PokemonSet<string> | undefined;
    importSet(buf: string, data?: Data | undefined): Partial<PokemonSet<string>>;
    toJSON(s: PokemonSet): string;
    fromJSON(json: string): PokemonSet<string> | undefined;
    toString(s: Partial<PokemonSet>, data?: Data | undefined): string;
    fromString(str: string): Partial<PokemonSet<string>>;
};
export declare function _unpack(buf: string, i?: number, j?: number, data?: Data): {
    i: number;
    j: number;
    set?: undefined;
} | {
    set: PokemonSet<string>;
    i: number;
    j: number;
};
export declare function _import(lines: string[], i?: number, data?: Data): {
    set: Partial<PokemonSet<string>>;
    line: number;
};
