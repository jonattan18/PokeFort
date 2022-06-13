import { Condition, DexConditions } from './dex-conditions';
import { DataMove, DexMoves } from './dex-moves';
import { Item, DexItems } from './dex-items';
import { Ability, DexAbilities } from './dex-abilities';
import { Species, DexSpecies, DexLearnsets } from './dex-species';
import { Format, DexFormats } from './dex-formats';
import { AbilityData, AbilityText, ActiveMove, AnyObject, EffectData, FormatData, ID, ItemData, ItemText, LearnsetData, ModdedBattleScriptsData, Move, MoveData, MoveText, NatureData, SpeciesData, TypeData } from './exported-global-types';
import * as Data from './dex-data';
declare type DataType = 'Abilities' | 'Rulesets' | 'FormatsData' | 'Items' | 'Learnsets' | 'Moves' | 'Natures' | 'Pokedex' | 'Scripts' | 'Conditions' | 'TypeChart';
interface DexTable<T> {
    [key: string]: T;
}
interface DexTableData {
    Abilities: DexTable<AbilityData>;
    Conditions: DexTable<EffectData>;
    Rulesets: DexTable<FormatData>;
    FormatsData: DexTable<import('./dex-species').ModdedSpeciesFormatsData>;
    Items: DexTable<ItemData>;
    Learnsets: DexTable<LearnsetData>;
    Moves: DexTable<MoveData>;
    Natures: DexTable<NatureData>;
    Pokedex: DexTable<SpeciesData>;
    TypeChart: DexTable<TypeData>;
    Aliases: {
        [id: string]: string;
    };
    Scripts: ModdedBattleScriptsData;
    Species: DexTable<SpeciesData>;
    Types: DexTable<TypeData>;
}
declare const TEXT: {
    Abilities: DexTable<AbilityText>;
    Items: DexTable<ItemText>;
    Moves: DexTable<MoveText>;
    Default: DexTable<AnyObject>;
};
declare type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Array<infer U> ? Array<DeepPartial<U>> : T[P] extends ReadonlyArray<infer V> ? ReadonlyArray<DeepPartial<V>> : DeepPartial<T[P]>;
};
export declare type ModData = DeepPartial<ModdedDex['data']>;
export declare const toID: typeof Data.toID;
export declare class ModdedDex {
    readonly Data: typeof Data;
    readonly Condition: typeof Condition;
    readonly Ability: typeof Ability;
    readonly Item: typeof Item;
    readonly Move: typeof DataMove;
    readonly Species: typeof Species;
    readonly Format: typeof Format;
    readonly ModdedDex: typeof ModdedDex;
    readonly name = "[ModdedDex]";
    readonly isBase: boolean;
    readonly currentMod: string;
    readonly toID: typeof Data.toID;
    readonly formats: DexFormats;
    readonly abilities: DexAbilities;
    readonly items: DexItems;
    readonly moves: DexMoves;
    readonly species: DexSpecies;
    readonly learnsets: DexLearnsets;
    readonly conditions: DexConditions;
    readonly natures: Data.DexNatures;
    readonly types: Data.DexTypes;
    readonly stats: Data.DexStats;
    gen: number;
    parentMod: string;
    modsLoaded: boolean;
    dataCache: DexTableData | null;
    deepClone: typeof import("../lib/utils").deepClone;
    constructor(mod?: string);
    get modid(): ID;
    get data(): DexTableData;
    get dexes(): {
        [mod: string]: ModdedDex;
    };
    mod(mod: string | undefined, modData?: DeepPartial<ModdedDex['data']>): ModdedDex;
    forGen(gen: number): ModdedDex;
    forFormat(format: Format | string): ModdedDex;
    modData(dataType: DataType, id: string): any;
    effectToString(): string;
    /**
     * Sanitizes a username or Pokemon nickname
     *
     * Returns the passed name, sanitized for safe use as a name in the PS
     * protocol.
     *
     * Such a string must uphold these guarantees:
     * - must not contain any ASCII whitespace character other than a space
     * - must not start or end with a space character
     * - must not contain any of: | , [ ]
     * - must not be the empty string
     * - must not contain Unicode RTL control characters
     *
     * If no such string can be found, returns the empty string. Calling
     * functions are expected to check for that condition and deal with it
     * accordingly.
     *
     * getName also enforces that there are not multiple consecutive space
     * characters in the name, although this is not strictly necessary for
     * safety.
     */
    getName(name: any): string;
    /**
     * Returns false if the target is immune; true otherwise.
     * Also checks immunity to some statuses.
     */
    getImmunity(source: {
        type: string;
    } | string, target: {
        getTypes: () => string[];
    } | {
        types: string[];
    } | string[] | string): boolean;
    getEffectiveness(source: {
        type: string;
    } | string, target: {
        getTypes: () => string[];
    } | {
        types: string[];
    } | string[] | string): number;
    getDescs(table: keyof typeof TEXT, id: ID, dataEntry: AnyObject): {
        desc: any;
        shortDesc: any;
    } | null;
    /**
     * Ensure we're working on a copy of a move (and make a copy if we aren't)
     *
     * Remember: "ensure" - by default, it won't make a copy of a copy:
     *     moveCopy === Dex.getActiveMove(moveCopy)
     *
     * If you really want to, use:
     *     moveCopyCopy = Dex.getActiveMove(moveCopy.id)
     */
    getActiveMove(move: Move | string): ActiveMove;
    getHiddenPower(ivs: AnyObject): {
        type: string;
        power: number;
    };
    /**
     * Truncate a number into an unsigned 32-bit integer, for
     * compatibility with the cartridge games' math systems.
     */
    trunc(num: number, bits?: number): number;
    loadDataFile(mod: string, dataType: DataType | 'Aliases', modData?: DeepPartial<ModdedDex['data']>): AnyObject;
    includeMods(): this;
    includeModData(): this;
    includeData(): this;
    loadData(modData?: DeepPartial<ModdedDex['data']>): DexTableData;
    includeFormats(): this;
}
export declare const Dex: ModdedDex;
export declare namespace Dex {
    type Species = import('./dex-species').Species;
    type Item = import('./dex-items').Item;
    type Move = import('./dex-moves').Move;
    type Ability = import('./dex-abilities').Ability;
    type HitEffect = import('./dex-moves').HitEffect;
    type SecondaryEffect = import('./dex-moves').SecondaryEffect;
    type RuleTable = import('./dex-formats').RuleTable;
}
export {};
