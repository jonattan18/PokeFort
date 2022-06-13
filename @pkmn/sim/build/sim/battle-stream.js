"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleTextStream = exports.BattlePlayer = exports.getPlayerStreams = exports.BattleStream = void 0;
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
const lib_1 = require("../lib");
const teams_1 = require("./teams");
const battle_1 = require("./battle");
/**
 * Like string.split(delimiter), but only recognizes the first `limit`
 * delimiters (default 1).
 *
 * `"1 2 3 4".split(" ", 2) => ["1", "2"]`
 *
 * `Utils.splitFirst("1 2 3 4", " ", 1) => ["1", "2 3 4"]`
 *
 * Returns an array of length exactly limit + 1.
 */
function splitFirst(str, delimiter, limit = 1) {
    const splitStr = [];
    while (splitStr.length < limit) {
        const delimiterIndex = str.indexOf(delimiter);
        if (delimiterIndex >= 0) {
            splitStr.push(str.slice(0, delimiterIndex));
            str = str.slice(delimiterIndex + delimiter.length);
        }
        else {
            splitStr.push(str);
            str = '';
        }
    }
    splitStr.push(str);
    return splitStr;
}
class BattleStream extends lib_1.Streams.ObjectReadWriteStream {
    constructor(options = {}) {
        super();
        this.debug = !!options.debug;
        this.noCatch = !!options.noCatch;
        this.replay = options.replay || false;
        this.keepAlive = !!options.keepAlive;
        this.battle = null;
    }
    _write(chunk) {
        if (this.noCatch) {
            this._writeLines(chunk);
        }
        else {
            try {
                this._writeLines(chunk);
            }
            catch (err) {
                this.pushError(err, true);
                return;
            }
        }
        if (this.battle)
            this.battle.sendUpdates();
    }
    _writeLines(chunk) {
        for (const line of chunk.split('\n')) {
            if (line.startsWith('>')) {
                const [type, message] = splitFirst(line.slice(1), ' ');
                this._writeLine(type, message);
            }
        }
    }
    pushMessage(type, data) {
        if (this.replay) {
            if (type === 'update') {
                if (this.replay === 'spectator') {
                    this.push(data.replace(/\n\|split\|p[1234]\n(?:[^\n]*)\n([^\n]*)/g, '\n$1'));
                }
                else {
                    this.push(data.replace(/\n\|split\|p[1234]\n([^\n]*)\n(?:[^\n]*)/g, '\n$1'));
                }
            }
            return;
        }
        this.push(`${type}\n${data}`);
    }
    _writeLine(type, message) {
        switch (type) {
            case 'start':
                const options = JSON.parse(message);
                options.send = (t, data) => {
                    if (Array.isArray(data))
                        data = data.join("\n");
                    this.pushMessage(t, data);
                    if (t === 'end' && !this.keepAlive)
                        this.pushEnd();
                };
                if (this.debug)
                    options.debug = true;
                this.battle = new battle_1.Battle(options);
                break;
            case 'player':
                const [slot, optionsText] = splitFirst(message, ' ');
                this.battle.setPlayer(slot, JSON.parse(optionsText));
                break;
            case 'p1':
            case 'p2':
            case 'p3':
            case 'p4':
                if (message === 'undo') {
                    this.battle.undoChoice(type);
                }
                else {
                    this.battle.choose(type, message);
                }
                break;
            case 'forcewin':
            case 'forcetie':
                this.battle.win(type === 'forcewin' ? message : null);
                if (message) {
                    this.battle.inputLog.push(`>forcewin ${message}`);
                }
                else {
                    this.battle.inputLog.push(`>forcetie`);
                }
                break;
            case 'forcelose':
                this.battle.lose(message);
                this.battle.inputLog.push(`>forcelose ${message}`);
                break;
            case 'reseed':
                const seed = message ? message.split(',').map(Number) : null;
                this.battle.resetRNG(seed);
                // could go inside resetRNG, but this makes using it in `eval` slightly less buggy
                this.battle.inputLog.push(`>reseed ${this.battle.prng.seed.join(',')}`);
                break;
            case 'tiebreak':
                this.battle.tiebreak();
                break;
            case 'chat-inputlogonly':
                this.battle.inputLog.push(`>chat ${message}`);
                break;
            case 'chat':
                this.battle.inputLog.push(`>chat ${message}`);
                this.battle.add('chat', `${message}`);
                break;
            case 'eval':
                const battle = this.battle;
                // n.b. this will usually but not always work - if you eval code that also affects the inputLog,
                // replaying the inputlog would double-play the change.
                battle.inputLog.push(`>${type} ${message}`);
                message = message.replace(/\f/g, '\n');
                battle.add('', '>>> ' + message.replace(/\n/g, '\n||'));
                try {
                    /* eslint-disable no-eval, @typescript-eslint/no-unused-vars */
                    const p1 = battle.sides[0];
                    const p2 = battle.sides[1];
                    const p3 = battle.sides[2];
                    const p4 = battle.sides[3];
                    const p1active = p1?.active[0];
                    const p2active = p2?.active[0];
                    const p3active = p3?.active[0];
                    const p4active = p4?.active[0];
                    const toID = battle.toID;
                    const player = (input) => {
                        input = toID(input);
                        if (/^p[1-9]$/.test(input))
                            return battle.sides[parseInt(input.slice(1)) - 1];
                        if (/^[1-9]$/.test(input))
                            return battle.sides[parseInt(input) - 1];
                        for (const side of battle.sides) {
                            if (toID(side.name) === input)
                                return side;
                        }
                        return null;
                    };
                    const pokemon = (side, input) => {
                        if (typeof side === 'string')
                            side = player(side);
                        input = toID(input);
                        if (/^[1-9]$/.test(input))
                            return side.pokemon[parseInt(input) - 1];
                        return side.pokemon.find(p => p.baseSpecies.id === input || p.species.id === input);
                    };
                    let result = eval(message);
                    /* eslint-enable no-eval, @typescript-eslint/no-unused-vars */
                    if (result?.then) {
                        result.then((unwrappedResult) => {
                            unwrappedResult = lib_1.Utils.visualize(unwrappedResult);
                            battle.add('', 'Promise -> ' + unwrappedResult);
                            battle.sendUpdates();
                        }, (error) => {
                            battle.add('', '<<< error: ' + error.message);
                            battle.sendUpdates();
                        });
                    }
                    else {
                        result = lib_1.Utils.visualize(result);
                        result = result.replace(/\n/g, '\n||');
                        battle.add('', '<<< ' + result);
                    }
                }
                catch (e) {
                    battle.add('', '<<< error: ' + e.message);
                }
                break;
            case 'requestlog':
                this.push(`requesteddata\n${this.battle.inputLog.join('\n')}`);
                break;
            case 'requestteam':
                message = message.trim();
                const slotNum = parseInt(message.slice(1)) - 1;
                if (isNaN(slotNum) || slotNum < 0) {
                    throw new Error(`Team requested for slot ${message}, but that slot does not exist.`);
                }
                const side = this.battle.sides[slotNum];
                const team = teams_1.Teams.pack(side.team);
                this.push(`requesteddata\n${team}`);
                break;
            case 'version':
            case 'version-origin':
                break;
            default:
                throw new Error(`Unrecognized command ">${type} ${message}"`);
        }
    }
    _writeEnd() {
        // if battle already ended, we don't need to pushEnd.
        if (!this.atEOF)
            this.pushEnd();
        this._destroy();
    }
    _destroy() {
        if (this.battle)
            this.battle.destroy();
    }
}
exports.BattleStream = BattleStream;
/**
 * Splits a BattleStream into omniscient, spectator, p1, p2, p3 and p4
 * streams, for ease of consumption.
 */
function getPlayerStreams(stream) {
    const streams = {
        omniscient: new lib_1.Streams.ObjectReadWriteStream({
            write(data) {
                void stream.write(data);
            },
            writeEnd() {
                return stream.writeEnd();
            },
        }),
        spectator: new lib_1.Streams.ObjectReadStream({
            read() { },
        }),
        p1: new lib_1.Streams.ObjectReadWriteStream({
            write(data) {
                void stream.write(data.replace(/(^|\n)/g, `$1>p1 `));
            },
        }),
        p2: new lib_1.Streams.ObjectReadWriteStream({
            write(data) {
                void stream.write(data.replace(/(^|\n)/g, `$1>p2 `));
            },
        }),
        p3: new lib_1.Streams.ObjectReadWriteStream({
            write(data) {
                void stream.write(data.replace(/(^|\n)/g, `$1>p3 `));
            },
        }),
        p4: new lib_1.Streams.ObjectReadWriteStream({
            write(data) {
                void stream.write(data.replace(/(^|\n)/g, `$1>p4 `));
            },
        }),
    };
    (async () => {
        for await (const chunk of stream) {
            const [type, data] = splitFirst(chunk, `\n`);
            switch (type) {
                case 'update':
                    streams.omniscient.push(battle_1.Battle.extractUpdateForSide(data, 'omniscient'));
                    streams.spectator.push(battle_1.Battle.extractUpdateForSide(data, 'spectator'));
                    streams.p1.push(battle_1.Battle.extractUpdateForSide(data, 'p1'));
                    streams.p2.push(battle_1.Battle.extractUpdateForSide(data, 'p2'));
                    streams.p3.push(battle_1.Battle.extractUpdateForSide(data, 'p3'));
                    streams.p4.push(battle_1.Battle.extractUpdateForSide(data, 'p4'));
                    break;
                case 'sideupdate':
                    const [side, sideData] = splitFirst(data, `\n`);
                    streams[side].push(sideData);
                    break;
                case 'end':
                    // ignore
                    break;
            }
        }
        for (const s of Object.values(streams)) {
            s.pushEnd();
        }
    })().catch(err => {
        for (const s of Object.values(streams)) {
            s.pushError(err, true);
        }
    });
    return streams;
}
exports.getPlayerStreams = getPlayerStreams;
class BattlePlayer {
    constructor(playerStream, debug = false) {
        this.stream = playerStream;
        this.log = [];
        this.debug = debug;
    }
    async start() {
        for await (const chunk of this.stream) {
            this.receive(chunk);
        }
    }
    receive(chunk) {
        for (const line of chunk.split('\n')) {
            this.receiveLine(line);
        }
    }
    receiveLine(line) {
        if (this.debug)
            console.log(line);
        if (!line.startsWith('|'))
            return;
        const [cmd, rest] = splitFirst(line.slice(1), '|');
        if (cmd === 'request')
            return this.receiveRequest(JSON.parse(rest));
        if (cmd === 'error')
            return this.receiveError(new Error(rest));
        this.log.push(line);
    }
    receiveError(error) {
        throw error;
    }
    choose(choice) {
        void this.stream.write(choice);
    }
}
exports.BattlePlayer = BattlePlayer;
class BattleTextStream extends lib_1.Streams.ReadWriteStream {
    constructor(options) {
        super();
        this.battleStream = new BattleStream(options);
        this.currentMessage = '';
    }
    async start() {
        for await (let message of this.battleStream) {
            if (!message.endsWith('\n'))
                message += '\n';
            this.push(message + '\n');
        }
        this.pushEnd();
    }
    _write(message) {
        this.currentMessage += '' + message;
        const index = this.currentMessage.lastIndexOf('\n');
        if (index >= 0) {
            void this.battleStream.write(this.currentMessage.slice(0, index));
            this.currentMessage = this.currentMessage.slice(index + 1);
        }
    }
    _writeEnd() {
        return this.battleStream.writeEnd();
    }
}
exports.BattleTextStream = BattleTextStream;
//# sourceMappingURL=battle-stream.js.map