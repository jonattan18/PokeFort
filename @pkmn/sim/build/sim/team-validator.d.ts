import { Ability, AnyObject, EventInfo, Format, ID, Item, ModdedDex, Move, Nature, PokemonSet, SparseStatsTable, Species, StatsTable } from './exported-global-types';
/**
 * Describes a possible way to get a pokemon. Is not exhaustive!
 * sourcesBefore covers all sources that do not have exclusive
 * moves (like catching wild pokemon).
 *
 * First character is a generation number, 1-8.
 * Second character is a source ID, one of:
 *
 * - E = egg, 3rd char+ is the father in gen 2-5, empty in gen 6-7
 *   because egg moves aren't restricted to fathers anymore
 * - S = event, 3rd char+ is the index in .eventData
 * - D = Dream World, only 5D is valid
 * - V = Virtual Console or Let's Go transfer, only 7V/8V is valid
 *
 * Designed to match MoveSource where possible.
 */
export declare type PokemonSource = string;
/**
 * Represents a set of possible ways to get a Pokémon with a given
 * set.
 *
 * `new PokemonSources()` creates an empty set;
 * `new PokemonSources(dex.gen)` allows all Pokemon.
 *
 * The set mainly stored as an Array `sources`, but for sets that
 * could be sourced from anywhere (for instance, TM moves), we
 * instead just set `sourcesBefore` to a number meaning "any
 * source at or before this gen is possible."
 *
 * In other words, this variable represents the set of all
 * sources in `sources`, union all sources at or before
 * gen `sourcesBefore`.
 */
export declare class PokemonSources {
    /**
     * A set of specific possible PokemonSources; implemented as
     * an Array rather than a Set for perf reasons.
     */
    sources: PokemonSource[];
    /**
     * if nonzero: the set also contains all possible sources from
     * this gen and earlier.
     */
    sourcesBefore: number;
    /**
     * the set requires sources from this gen or later
     * this should be unchanged from the format's minimum past gen
     * (3 in modern games, 6 if pentagon is required, etc)
     */
    sourcesAfter: number;
    isHidden: boolean | null;
    /**
     * `limitedEggMoves` is a list of moves that can only be obtained from an
     * egg with another father in gen 2-5. If there are multiple such moves,
     * potential fathers need to be checked to see if they can actually
     * learn the move combination in question.
     *
     * `null` = the current move is definitely not a limited egg move
     *
     * `undefined` = the current move may or may not be a limited egg move
     */
    limitedEggMoves?: ID[] | null;
    /**
     * Some Pokemon evolve by having a move in their learnset (like Piloswine
     * with Ancient Power). These can only carry three other moves from their
     * prevo, because the fourth move must be the evo move. This restriction
     * doesn't apply to gen 6+ eggs, which can get around the restriction with
     * the relearner.
     */
    moveEvoCarryCount: number;
    babyOnly?: string;
    sketchMove?: string;
    hm?: string;
    restrictiveMoves?: string[];
    /** Obscure learn methods */
    restrictedMove?: ID;
    constructor(sourcesBefore?: number, sourcesAfter?: number);
    size(): number;
    add(source: PokemonSource, limitedEggMove?: ID | null): void;
    addGen(sourceGen: number): void;
    minSourceGen(): number;
    maxSourceGen(): number;
    intersectWith(other: PokemonSources): void;
}
export declare class TeamValidator {
    readonly format: Format;
    readonly dex: ModdedDex;
    readonly gen: number;
    readonly ruleTable: import('./dex-formats').RuleTable;
    readonly minSourceGen: number;
    readonly toID: (str: any) => ID;
    constructor(format: string | Format, dex?: import("./dex").ModdedDex);
    validateTeam(team: PokemonSet[] | null, options?: {
        removeNicknames?: boolean;
        skipSets?: {
            [name: string]: {
                [key: string]: boolean;
            };
        };
    }): string[] | null;
    baseValidateTeam(team: PokemonSet[] | null, options?: {
        removeNicknames?: boolean;
        skipSets?: {
            [name: string]: {
                [key: string]: boolean;
            };
        };
    }): string[] | null;
    getEventOnlyData(species: Species, noRecurse?: boolean): {
        species: Species;
        eventData: EventInfo[];
    } | null;
    validateSet(set: PokemonSet, teamHas: AnyObject): string[] | null;
    validateStats(set: PokemonSet, species: Species, setSources: PokemonSources): string[];
    /**
     * Not exhaustive, just checks Atk and Spe, which are the only competitively
     * relevant IVs outside of extremely obscure situations.
     */
    possibleBottleCapHpType(type: string, ivs: StatsTable): boolean;
    validateSource(set: PokemonSet, source: PokemonSource, setSources: PokemonSources, species: Species, because: string): string[] | undefined;
    validateSource(set: PokemonSet, source: PokemonSource, setSources: PokemonSources, species: Species): true | undefined;
    findEggMoveFathers(source: PokemonSource, species: Species, setSources: PokemonSources): boolean;
    findEggMoveFathers(source: PokemonSource, species: Species, setSources: PokemonSources, getAll: true): ID[] | null;
    /**
     * We could, if we wanted, do a complete move validation of the father's
     * moveset to see if it's valid. This would recurse and be NP-Hard so
     * instead we won't. We'll instead use a simplified algorithm: The father
     * can learn the moveset if it has at most one egg/event move.
     *
     * `eggGen` should be 5 or earlier. Later gens should never call this
     * function (the answer is always yes).
     */
    fatherCanLearn(species: Species, moves: ID[], eggGen: number): boolean;
    validateForme(set: PokemonSet): string[];
    checkSpecies(set: PokemonSet, species: Species, tierSpecies: Species, setHas: {
        [k: string]: true;
    }): string | null;
    checkItem(set: PokemonSet, item: Item, setHas: {
        [k: string]: true;
    }): string | null;
    checkMove(set: PokemonSet, move: Move, setHas: {
        [k: string]: true;
    }): string | null;
    checkAbility(set: PokemonSet, ability: Ability, setHas: {
        [k: string]: true;
    }): string | null;
    checkNature(set: PokemonSet, nature: Nature, setHas: {
        [k: string]: true;
    }): string | null;
    validateEvent(set: PokemonSet, eventData: EventInfo, eventSpecies: Species): true | undefined;
    validateEvent(set: PokemonSet, eventData: EventInfo, eventSpecies: Species, because: string, from?: string): string[] | undefined;
    allSources(species?: Species): PokemonSources;
    validateMoves(species: Species, moves: string[], setSources: PokemonSources, set?: Partial<PokemonSet>, name?: string): string[];
    /** Returns null if you can learn the move, or a string explaining why you can't learn it */
    checkCanLearn(move: Move, s: Species, setSources?: PokemonSources, set?: Partial<PokemonSet>): string | null;
    learnsetParent(species: Species): import("./dex-species").Species | null;
    static fillStats(stats: SparseStatsTable | null, fillNum?: number): StatsTable;
    static get(format: string | Format): TeamValidator;
}
