import { AnyObject, Battle, Condition, Effect, ID, Pokemon, Side } from './exported-global-types';
import { EffectState } from './pokemon';
export declare class Field {
    readonly battle: Battle;
    readonly id: ID;
    weather: ID;
    weatherState: EffectState;
    terrain: ID;
    terrainState: EffectState;
    pseudoWeather: {
        [id: string]: EffectState;
    };
    constructor(battle: Battle);
    toJSON(): AnyObject;
    setWeather(status: string | Condition, source?: Pokemon | 'debug' | null, sourceEffect?: Effect | null): boolean | null;
    clearWeather(): boolean;
    effectiveWeather(): ID;
    suppressingWeather(): boolean;
    isWeather(weather: string | string[]): boolean;
    getWeather(): import("./dex-conditions").Condition;
    setTerrain(status: string | Effect, source?: Pokemon | 'debug' | null, sourceEffect?: Effect | null): boolean;
    clearTerrain(): boolean;
    effectiveTerrain(target?: Pokemon | Side | Battle): ID;
    isTerrain(terrain: string | string[], target?: Pokemon | Side | Battle): boolean;
    getTerrain(): import("./dex-conditions").Condition;
    addPseudoWeather(status: string | Condition, source?: Pokemon | 'debug' | null, sourceEffect?: Effect | null): boolean;
    getPseudoWeather(status: string | Effect): import("./dex-conditions").Condition | null;
    removePseudoWeather(status: string | Effect): boolean;
    destroy(): void;
}
