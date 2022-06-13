import * as pkmn from '@pkmn/sets';
export { PokemonSet } from '@pkmn/sets';
import { PRNG, PRNGSeed } from './prng';
import { Format, PlayerOptions } from './exported-global-types';
interface TeamGenerator {
    prng: PRNG;
    getTeam(options?: PlayerOptions): pkmn.PokemonSet[];
    setSeed(prng?: PRNG | PRNGSeed): void;
}
interface TeamGeneratorFactory {
    getTeamGenerator(format: Format | string, seed: PRNG | PRNGSeed | null): TeamGenerator;
}
export declare const Teams: {
    pack(team: pkmn.PokemonSet[] | null): string;
    unpack(buf: string): pkmn.PokemonSet[] | null;
    export(team: pkmn.PokemonSet[], options?: {
        hideStats?: boolean;
    }): string;
    exportSet(set: pkmn.PokemonSet, { hideStats }?: {
        hideStats?: boolean | undefined;
    }): string;
    getGenerator(format: Format | string, seed?: PRNG | PRNGSeed | null): TeamGenerator;
    setGeneratorFactory(factory: TeamGeneratorFactory): any;
    generate(format: Format | string, options?: PlayerOptions | null): pkmn.PokemonSet[];
};
export default Teams;
