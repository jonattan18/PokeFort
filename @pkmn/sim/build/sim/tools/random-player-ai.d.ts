import { AnyObject } from '../exported-global-types';
/**
 * Example random player AI.
 *
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * @license MIT
 */
import { ObjectReadWriteStream } from '../../lib/streams';
import { BattlePlayer } from '../battle-stream';
import { PRNG, PRNGSeed } from '../prng';
export declare class RandomPlayerAI extends BattlePlayer {
    protected readonly move: number;
    protected readonly mega: number;
    protected readonly prng: PRNG;
    constructor(playerStream: ObjectReadWriteStream<string>, options?: {
        move?: number;
        mega?: number;
        seed?: PRNG | PRNGSeed | null;
    }, debug?: boolean);
    receiveError(error: Error): void;
    receiveRequest(request: AnyObject): void;
    protected chooseTeamPreview(team: AnyObject[]): string;
    protected chooseMove(active: AnyObject, moves: {
        choice: string;
        move: AnyObject;
    }[]): string;
    protected chooseSwitch(active: AnyObject | undefined, switches: {
        slot: number;
        pokemon: AnyObject;
    }[]): number;
}
