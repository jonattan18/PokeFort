import { Ability, Item, Move, Species } from '../sim/exported-global-types';
interface TagData {
    name: string;
    desc?: string;
    speciesFilter?: (species: Species) => boolean;
    moveFilter?: (move: Move) => boolean;
    genericFilter?: (thing: Species | Move | Item | Ability) => boolean;
    speciesNumCol?: (species: Species) => number;
    moveNumCol?: (move: Move) => number;
    genericNumCol?: (thing: Species | Move | Item | Ability) => number;
}
export declare const Tags: {
    [id: string]: TagData;
};
export {};
