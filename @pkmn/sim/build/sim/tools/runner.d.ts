import { PokemonSet } from '../exported-global-types';
import { ObjectReadWriteStream } from '../../lib/streams';
import { PRNG, PRNGSeed } from '../prng';
import { RandomPlayerAI } from './random-player-ai';
export interface AIOptions {
    createAI: (stream: ObjectReadWriteStream<string>, options: AIOptions) => RandomPlayerAI;
    move?: number;
    mega?: number;
    seed?: PRNG | PRNGSeed | null;
    team?: PokemonSet[];
}
export interface RunnerOptions {
    format: string;
    prng?: PRNG | PRNGSeed | null;
    p1options?: AIOptions;
    p2options?: AIOptions;
    p3options?: AIOptions;
    p4options?: AIOptions;
    input?: boolean;
    output?: boolean;
    error?: boolean;
    dual?: boolean | 'debug';
}
export declare class Runner {
    static readonly AI_OPTIONS: AIOptions;
    private readonly prng;
    private readonly p1options;
    private readonly p2options;
    private readonly p3options;
    private readonly p4options;
    private readonly format;
    private readonly input;
    private readonly output;
    private readonly error;
    private readonly dual;
    constructor(options: RunnerOptions);
    run(): Promise<void>;
    private runGame;
    private newSeed;
    private getPlayerSpec;
}
