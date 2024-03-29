import { AnyObject, EffectData, EffectType, ID, ModdedDex, NatureData, Nonstandard, SparseStatsTable, StatID, StatIDExceptHP, TypeData } from './exported-global-types';
/**
* Converts anything to an ID. An ID must have only lowercase alphanumeric
* characters.
*
* If a string is passed, it will be converted to lowercase and
* non-alphanumeric characters will be stripped.
*
* If an object with an ID is passed, its ID will be returned.
* Otherwise, an empty string will be returned.
*
* Generally assigned to the global toID, because of how
* commonly it's used.
*/
export declare function toID(text: any): ID;
export declare class BasicEffect implements EffectData {
    /**
     * ID. This will be a lowercase version of the name with all the
     * non-alphanumeric characters removed. So, for instance, "Mr. Mime"
     * becomes "mrmime", and "Basculin-Blue-Striped" becomes
     * "basculinbluestriped".
     */
    id: ID;
    /**
     * Name. Currently does not support Unicode letters, so "Flabébé"
     * is "Flabebe" and "Nidoran♀" is "Nidoran-F".
     */
    name: string;
    /**
     * Full name. Prefixes the name with the effect type. For instance,
     * Leftovers would be "item: Leftovers", confusion the status
     * condition would be "confusion", etc.
     */
    fullname: string;
    /** Effect type. */
    effectType: EffectType;
    /**
     * Does it exist? For historical reasons, when you use an accessor
     * for an effect that doesn't exist, you get a dummy effect that
     * doesn't do anything, and this field set to false.
     */
    exists: boolean;
    /**
     * Dex number? For a Pokemon, this is the National Dex number. For
     * other effects, this is often an internal ID (e.g. a move
     * number). Not all effects have numbers, this will be 0 if it
     * doesn't. Nonstandard effects (e.g. CAP effects) will have
     * negative numbers.
     */
    num: number;
    /**
     * The generation of Pokemon game this was INTRODUCED (NOT
     * necessarily the current gen being simulated.) Not all effects
     * track generation; this will be 0 if not known.
     */
    gen: number;
    /**
     * A shortened form of the description of this effect.
     * Not all effects have this.
     */
    shortDesc: string;
    /** The full description for this effect. */
    desc: string;
    /**
     * Is this item/move/ability/pokemon nonstandard? Specified for effects
     * that have no use in standard formats: made-up pokemon (CAP),
     * glitches (MissingNo etc), Pokestar pokemon, etc.
     */
    isNonstandard: Nonstandard | null;
    /** The duration of the condition - only for pure conditions. */
    duration?: number;
    /** Whether or not the condition is ignored by Baton Pass - only for pure conditions. */
    noCopy: boolean;
    /** Whether or not the condition affects fainted Pokemon. */
    affectsFainted: boolean;
    /** Moves only: what status does it set? */
    status?: ID;
    /** Moves only: what weather does it set? */
    weather?: ID;
    /** ??? */
    sourceEffect: string;
    constructor(data: AnyObject);
    toString(): string;
}
export declare class Nature extends BasicEffect implements Readonly<BasicEffect & NatureData> {
    readonly effectType: 'Nature';
    readonly plus?: StatIDExceptHP;
    readonly minus?: StatIDExceptHP;
    constructor(data: AnyObject);
}
export declare class DexNatures {
    readonly dex: ModdedDex;
    readonly natureCache: Map<ID, Nature>;
    allCache: readonly Nature[] | null;
    constructor(dex: ModdedDex);
    get(name: string | Nature): Nature;
    getByID(id: ID): Nature;
    all(): readonly Nature[];
}
declare type TypeInfoEffectType = 'Type' | 'EffectType';
export declare class TypeInfo implements Readonly<TypeData> {
    /**
     * ID. This will be a lowercase version of the name with all the
     * non-alphanumeric characters removed. e.g. 'flying'
     */
    readonly id: ID;
    /** Name. e.g. 'Flying' */
    readonly name: string;
    /** Effect type. */
    readonly effectType: TypeInfoEffectType;
    /**
     * Does it exist? For historical reasons, when you use an accessor
     * for an effect that doesn't exist, you get a dummy effect that
     * doesn't do anything, and this field set to false.
     */
    readonly exists: boolean;
    /**
     * The generation of Pokemon game this was INTRODUCED (NOT
     * necessarily the current gen being simulated.) Not all effects
     * track generation; this will be 0 if not known.
     */
    readonly gen: number;
    /**
     * Set to 'Future' for types before they're released (like Fairy
     * in Gen 5 or Dark in Gen 1).
     */
    readonly isNonstandard: Nonstandard | null;
    /**
     * Type chart, attackingTypeName:result, effectid:result
     * result is: 0 = normal, 1 = weakness, 2 = resistance, 3 = immunity
     */
    readonly damageTaken: {
        [attackingTypeNameOrEffectid: string]: number;
    };
    /** The IVs to get this Type Hidden Power (in gen 3 and later) */
    readonly HPivs: SparseStatsTable;
    /** The DVs to get this Type Hidden Power (in gen 2). */
    readonly HPdvs: SparseStatsTable;
    constructor(data: AnyObject);
    toString(): string;
}
export declare class DexTypes {
    readonly dex: ModdedDex;
    readonly typeCache: Map<ID, TypeInfo>;
    allCache: readonly TypeInfo[] | null;
    namesCache: readonly string[] | null;
    constructor(dex: ModdedDex);
    get(name: string | TypeInfo): TypeInfo;
    getByID(id: ID): TypeInfo;
    names(): readonly string[];
    isName(name: string): boolean;
    all(): readonly TypeInfo[];
}
declare const idsCache: readonly StatID[];
export declare class DexStats {
    readonly shortNames: {
        readonly [k in StatID]: string;
    };
    readonly mediumNames: {
        readonly [k in StatID]: string;
    };
    readonly names: {
        readonly [k in StatID]: string;
    };
    constructor(dex: ModdedDex);
    getID(name: string): StatID | null;
    ids(): typeof idsCache;
}
export {};
