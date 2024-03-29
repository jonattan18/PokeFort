import { ActiveMove, AnyObject, Battle, Condition, Effect, ID, Move, PokemonSet, SideID } from './exported-global-types';
import type { RequestState } from './battle';
import { Pokemon, EffectState } from './pokemon';
/** A single action that can be chosen. */
export interface ChosenAction {
    choice: 'move' | 'switch' | 'instaswitch' | 'team' | 'shift' | 'pass';
    pokemon?: Pokemon;
    targetLoc?: number;
    moveid: string;
    move?: ActiveMove;
    target?: Pokemon;
    index?: number;
    side?: Side;
    mega?: boolean | null;
    zmove?: string;
    maxMove?: string;
    priority?: number;
}
/** What the player has chosen to happen. */
export interface Choice {
    cantUndo: boolean;
    error: string;
    actions: ChosenAction[];
    forcedSwitchesLeft: number;
    forcedPassesLeft: number;
    switchIns: Set<number>;
    zMove: boolean;
    mega: boolean;
    ultra: boolean;
    dynamax: boolean;
}
export declare class Side {
    readonly battle: Battle;
    readonly id: SideID;
    /** Index in `battle.sides`: `battle.sides[side.n] === side` */
    readonly n: number;
    name: string;
    avatar: string;
    foe: Side;
    /** Only exists in multi battle, for the allied side */
    allySide: Side | null;
    team: PokemonSet[];
    pokemon: Pokemon[];
    active: Pokemon[];
    pokemonLeft: number;
    zMoveUsed: boolean;
    /**
     * This will be true in any gen before 8 or if the player (or their battle partner) has dynamaxed once already
     *
     * Use Side.canDynamaxNow() to check if a side can dynamax instead of this property because only one
     * player per team can dynamax on any given turn of a gen 8 Multi Battle.
     */
    dynamaxUsed: boolean;
    faintedLastTurn: Pokemon | null;
    faintedThisTurn: Pokemon | null;
    /** only used by Gen 1 Counter */
    lastSelectedMove: ID;
    /** these point to the same object as the ally's, in multi battles */
    sideConditions: {
        [id: string]: EffectState;
    };
    slotConditions: {
        [id: string]: EffectState;
    }[];
    activeRequest: AnyObject | null;
    choice: Choice;
    /**
     * In gen 1, all lastMove stuff is tracked on Side rather than Pokemon
     * (this is for Counter and Mirror Move)
     * This is also used for checking Self-KO clause in Pokemon Stadium 2.
     */
    lastMove: Move | null;
    constructor(name: string, battle: Battle, sideNum: number, team: PokemonSet[]);
    toJSON(): AnyObject;
    get requestState(): RequestState;
    canDynamaxNow(): boolean;
    getChoice(): string;
    toString(): string;
    getRequestData(forAlly?: boolean): {
        name: string;
        id: SideID;
        pokemon: AnyObject[];
    };
    randomFoe(): Pokemon | null;
    /** Intended as a way to iterate through all foe side conditions - do not use for anything else. */
    foeSidesWithConditions(): Side[];
    foePokemonLeft(): number;
    allies(all?: boolean): Pokemon[];
    foes(all?: boolean): Pokemon[];
    activeTeam(): Pokemon[];
    hasAlly(pokemon: Pokemon): boolean;
    addSideCondition(status: string | Condition, source?: Pokemon | 'debug' | null, sourceEffect?: Effect | null): boolean;
    getSideCondition(status: string | Effect): Effect | null;
    getSideConditionData(status: string | Effect): AnyObject;
    removeSideCondition(status: string | Effect): boolean;
    addSlotCondition(target: Pokemon | number, status: string | Condition, source?: Pokemon | 'debug' | null, sourceEffect?: Effect | null): any;
    getSlotCondition(target: Pokemon | number, status: string | Effect): Effect | null;
    removeSlotCondition(target: Pokemon | number, status: string | Effect): boolean;
    send(...parts: (string | number | Function | AnyObject)[]): void;
    emitRequest(update: AnyObject): void;
    emitChoiceError(message: string, unavailable?: boolean): boolean;
    isChoiceDone(): boolean;
    chooseMove(moveText?: string | number, targetLoc?: number, megaDynaOrZ?: 'mega' | 'zmove' | 'ultra' | 'dynamax' | ''): boolean;
    updateRequestForPokemon(pokemon: Pokemon, update: (req: AnyObject) => boolean): boolean;
    chooseSwitch(slotText?: string): boolean | Side;
    /**
     * The number of pokemon you must choose in Team Preview.
     *
     * Note that PS doesn't support choosing fewer than this number of pokemon.
     * In the games, it is sometimes possible to bring fewer than this, but
     * since that's nearly always a mistake, we haven't gotten around to
     * supporting it.
     */
    pickedTeamSize(): number;
    chooseTeam(data?: string): boolean;
    chooseShift(): boolean;
    clearChoice(): void;
    choose(input: string): boolean;
    getChoiceIndex(isPass?: boolean): number;
    choosePass(): boolean | Side;
    /** Automatically finish a choice if not currently complete. */
    autoChoose(): boolean;
    destroy(): void;
}
