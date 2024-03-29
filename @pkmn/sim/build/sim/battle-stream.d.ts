/// <reference types="node" />
import { AnyObject } from './exported-global-types';
/**
 * Battle Stream
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Supports interacting with a PS battle in Stream format.
 *
 * This format is VERY NOT FINALIZED, please do not use it directly yet.
 *
 * @license MIT
 */
import { Streams } from '../lib';
import { Battle } from './battle';
export declare class BattleStream extends Streams.ObjectReadWriteStream<string> {
    debug: boolean;
    noCatch: boolean;
    replay: boolean | 'spectator';
    keepAlive: boolean;
    battle: Battle | null;
    constructor(options?: {
        debug?: boolean;
        noCatch?: boolean;
        keepAlive?: boolean;
        replay?: boolean | 'spectator';
    });
    _write(chunk: string): void;
    _writeLines(chunk: string): void;
    pushMessage(type: string, data: string): void;
    _writeLine(type: string, message: string): void;
    _writeEnd(): void;
    _destroy(): void;
}
/**
 * Splits a BattleStream into omniscient, spectator, p1, p2, p3 and p4
 * streams, for ease of consumption.
 */
export declare function getPlayerStreams(stream: BattleStream): {
    omniscient: Streams.ObjectReadWriteStream<string>;
    spectator: Streams.ObjectReadStream<string>;
    p1: Streams.ObjectReadWriteStream<string>;
    p2: Streams.ObjectReadWriteStream<string>;
    p3: Streams.ObjectReadWriteStream<string>;
    p4: Streams.ObjectReadWriteStream<string>;
};
export declare abstract class BattlePlayer {
    readonly stream: Streams.ObjectReadWriteStream<string>;
    readonly log: string[];
    readonly debug: boolean;
    constructor(playerStream: Streams.ObjectReadWriteStream<string>, debug?: boolean);
    start(): Promise<void>;
    receive(chunk: string): void;
    receiveLine(line: string): void;
    abstract receiveRequest(request: AnyObject): void;
    receiveError(error: Error): void;
    choose(choice: string): void;
}
export declare class BattleTextStream extends Streams.ReadWriteStream {
    readonly battleStream: BattleStream;
    currentMessage: string;
    constructor(options: {
        debug?: boolean;
    });
    start(): Promise<void>;
    _write(message: string | Buffer): void;
    _writeEnd(): Promise<void>;
}
