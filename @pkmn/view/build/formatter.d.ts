import { ArgType, KWArgType, PokemonDetails, PokemonHPStatus, PokemonIdent, Protocol, SpeciesName, Username } from '@pkmn/protocol';
import { ID, StatID, GenerationNum, SideID, TypeName } from '@pkmn/types';
/**
 * Tracks additional state required to display a battle in depth. If not provided the output will
 * be less detailed and accurate, though tracking all of this state is significantly more
 * involved. `@pkmn/client`'s `Battle` implements this, though note, the protocol messages need to
 * be fed into the `LogFormatter` **before** the `@pkmn/client`'s `Handler`.
 *
 * smogon/pokemon-showdown-client's `BattleTextParser` receives the protocol *after* the `Battle`
 * state has been updated, but PS mutates the protocol to encode the pre-updated state for the
 * logs.
 */
export interface Tracker {
    /** Pokemon at the provided slot for a side *before* any |swap| is applied */
    pokemonAt(side: SideID, slot: number): PokemonIdent | undefined;
    /** Percentage damage of applying the health to the ident (ie. *before& |-damage| is applied) */
    damagePercentage(ident: PokemonIdent, health: PokemonHPStatus): string | undefined;
    /** Weather (*before* |-weather| is applied) */
    currentWeather(): ID | undefined;
    /** The Pokémon corresponding to ident and details which was switched out from |switch| */
    getSwitchedOutPokemon(ident: PokemonIdent, details: PokemonDetails): {
        ident: PokemonIdent;
        lastMove: ID;
        illusion?: {
            ident: PokemonIdent;
        } | null;
    } | undefined;
    /** The list of types of the Pokémon ident references, *before* |singleturn| is applied */
    getPokemonTypeList(ident: PokemonIdent): readonly TypeName[] | undefined;
    /** The species forme of the the Pokémon referenced by ident  */
    getPokemonSpeciesForme(ident: PokemonIdent): SpeciesName | undefined;
}
export declare class LogFormatter {
    perspective: SideID;
    p1: Username;
    p2: Username;
    p3: Username;
    p4: Username;
    gen: GenerationNum;
    turn: number;
    activeMoveIsSpread: boolean | undefined;
    curLineSection: 'break' | 'preMajor' | 'major' | 'postMajor';
    lowercaseRegExp: RegExp | null | undefined;
    private readonly handler;
    constructor(perspective?: SideID, tracker?: Tracker);
    fixLowercase(input: string): string;
    static escapeRegExp(input: string): string;
    pokemonName(pokemon: PokemonIdent): string;
    pokemon(pokemon: PokemonIdent | ''): string;
    pokemonFull(pokemon: PokemonIdent, details: PokemonDetails): [string, string];
    trainer(side: string): string;
    static allyID(sideid: SideID): SideID | '';
    team(side: string, them?: boolean): string;
    own(side: string): "" | "OWN";
    party(side: string): string;
    static effectId(effect?: string): ID;
    effect(effect?: string): string;
    template(type: string, ...namespaces: (string | undefined)[]): string;
    maybeAbility(effect: string | undefined, holder: PokemonIdent | ''): string;
    ability(name: string | undefined, holder: PokemonIdent | ''): string;
    stat(stat: StatID | 'spc'): string;
    lineSection(args: ArgType | 'switchout', kwArgs: KWArgType): "" | "break" | "preMajor" | "major" | "postMajor";
    sectionBreak(args: ArgType | 'switchout', kwArgs?: Protocol.BattleArgsKWArgType): boolean;
    formatText(args: ArgType, kwArgs?: KWArgType, noSectionBreak?: boolean): string;
    formatHTML(args: ArgType, kwArgs?: KWArgType): string;
    static escapeHTML(str: string, escapeJS?: boolean): string;
}
