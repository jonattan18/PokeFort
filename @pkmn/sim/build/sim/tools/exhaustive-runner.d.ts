import { ID } from '../exported-global-types';
import { PRNG, PRNGSeed } from '../prng';
import { RunnerOptions } from './runner';
export interface ExhaustiveRunnerOptions {
    format: string;
    cycles?: number;
    prng?: PRNG | PRNGSeed | null;
    log?: boolean;
    maxGames?: number;
    maxFailures?: number;
    dual?: boolean | 'debug';
    possible?: ExhaustiveRunnerPossibilites;
    runner?: (options: RunnerOptions) => Promise<void>;
    cmd?: (cycles: number, format: string, seed: string) => string;
}
export interface ExhaustiveRunnerPossibilites {
    pokemon?: ID[];
    items?: ID[];
    abilities?: ID[];
    moves?: ID[];
}
export declare class ExhaustiveRunner {
    static readonly DEFAULT_CYCLES = 1;
    static readonly MAX_FAILURES = 10;
    static readonly FORMATS: string[];
    private readonly format;
    private readonly cycles;
    private readonly prng;
    private readonly log;
    private readonly maxGames?;
    private readonly maxFailures?;
    private readonly dual;
    private readonly possible?;
    private readonly runner;
    private readonly cmd;
    private failures;
    private games;
    constructor(options: ExhaustiveRunnerOptions);
    run(): Promise<number>;
    private createPools;
    private logProgress;
    private static getSignatures;
    private static onlyValid;
}
