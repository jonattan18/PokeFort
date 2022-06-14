import { Protocol } from '@pkmn/protocol';
interface MoveChoice {
    choiceType: 'move';
    move: number;
    targetLoc: number;
    mega: boolean;
    ultra: boolean;
    max: boolean;
    z: boolean;
}
export interface Data {
    getSpecies(species?: string): Readonly<{
        baseSpecies?: string;
    }> | undefined;
}
export declare class ChoiceBuilder {
    request: Protocol.Request;
    choices: string[];
    current: MoveChoice;
    alreadySwitchingIn: number[];
    alreadyMega: boolean;
    alreadyMax: boolean;
    alreadyZ: boolean;
    constructor(request: Protocol.Request);
    private fillPasses;
    isDone(): boolean;
    isEmpty(): boolean;
    index(): number;
    requestLength(): number;
    currentMoveRequest(): Protocol.Request.ActivePokemon | null | undefined;
    addChoice(choiceString: string, data?: Data): string | undefined;
    private parseChoice;
    private getChosenMove;
    toString(): string;
    private stringChoice;
}
export {};
