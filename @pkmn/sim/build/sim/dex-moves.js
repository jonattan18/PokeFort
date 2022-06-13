"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DexMoves = exports.DataMove = void 0;
const lib_1 = require("../lib");
const dex_data_1 = require("./dex-data");
class DataMove extends dex_data_1.BasicEffect {
    constructor(data) {
        super(data);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        data = this;
        this.fullname = `move: ${this.name}`;
        this.effectType = 'Move';
        this.type = lib_1.Utils.getString(data.type);
        this.target = data.target;
        this.basePower = Number(data.basePower);
        this.accuracy = data.accuracy;
        this.critRatio = Number(data.critRatio) || 1;
        this.baseMoveType = lib_1.Utils.getString(data.baseMoveType) || this.type;
        this.secondary = data.secondary || null;
        this.secondaries = data.secondaries || (this.secondary && [this.secondary]) || null;
        this.priority = Number(data.priority) || 0;
        this.category = data.category;
        this.overrideOffensiveStat = data.overrideOffensiveStat || undefined;
        this.overrideOffensivePokemon = data.overrideOffensivePokemon || undefined;
        this.overrideDefensiveStat = data.overrideDefensiveStat || undefined;
        this.overrideDefensivePokemon = data.overrideDefensivePokemon || undefined;
        this.ignoreNegativeOffensive = !!data.ignoreNegativeOffensive;
        this.ignorePositiveDefensive = !!data.ignorePositiveDefensive;
        this.ignoreOffensive = !!data.ignoreOffensive;
        this.ignoreDefensive = !!data.ignoreDefensive;
        this.ignoreImmunity = (data.ignoreImmunity !== undefined ? data.ignoreImmunity : this.category === 'Status');
        this.pp = Number(data.pp);
        this.noPPBoosts = !!data.noPPBoosts;
        this.isZ = data.isZ || false;
        this.isMax = data.isMax || false;
        this.flags = data.flags || {};
        this.selfSwitch = (typeof data.selfSwitch === 'string' ? data.selfSwitch : data.selfSwitch) || undefined;
        this.pressureTarget = data.pressureTarget || '';
        this.nonGhostTarget = data.nonGhostTarget || '';
        this.ignoreAbility = data.ignoreAbility || false;
        this.damage = data.damage;
        this.spreadHit = data.spreadHit || false;
        this.forceSTAB = !!data.forceSTAB;
        this.noSketch = !!data.noSketch;
        this.stab = data.stab || undefined;
        this.volatileStatus = typeof data.volatileStatus === 'string' ? data.volatileStatus : undefined;
        if (this.category !== 'Status' && !this.maxMove && this.id !== 'struggle') {
            this.maxMove = { basePower: 1 };
            if (this.isMax || this.isZ) {
                // already initialized to 1
            }
            else if (!this.basePower) {
                this.maxMove.basePower = 100;
            }
            else if (['Fighting', 'Poison'].includes(this.type)) {
                if (this.basePower >= 150) {
                    this.maxMove.basePower = 100;
                }
                else if (this.basePower >= 110) {
                    this.maxMove.basePower = 95;
                }
                else if (this.basePower >= 75) {
                    this.maxMove.basePower = 90;
                }
                else if (this.basePower >= 65) {
                    this.maxMove.basePower = 85;
                }
                else if (this.basePower >= 55) {
                    this.maxMove.basePower = 80;
                }
                else if (this.basePower >= 45) {
                    this.maxMove.basePower = 75;
                }
                else {
                    this.maxMove.basePower = 70;
                }
            }
            else {
                if (this.basePower >= 150) {
                    this.maxMove.basePower = 150;
                }
                else if (this.basePower >= 110) {
                    this.maxMove.basePower = 140;
                }
                else if (this.basePower >= 75) {
                    this.maxMove.basePower = 130;
                }
                else if (this.basePower >= 65) {
                    this.maxMove.basePower = 120;
                }
                else if (this.basePower >= 55) {
                    this.maxMove.basePower = 110;
                }
                else if (this.basePower >= 45) {
                    this.maxMove.basePower = 100;
                }
                else {
                    this.maxMove.basePower = 90;
                }
            }
        }
        if (this.category !== 'Status' && !this.zMove && !this.isZ && !this.isMax && this.id !== 'struggle') {
            let basePower = this.basePower;
            this.zMove = {};
            if (Array.isArray(this.multihit))
                basePower *= 3;
            if (!basePower) {
                this.zMove.basePower = 100;
            }
            else if (basePower >= 140) {
                this.zMove.basePower = 200;
            }
            else if (basePower >= 130) {
                this.zMove.basePower = 195;
            }
            else if (basePower >= 120) {
                this.zMove.basePower = 190;
            }
            else if (basePower >= 110) {
                this.zMove.basePower = 185;
            }
            else if (basePower >= 100) {
                this.zMove.basePower = 180;
            }
            else if (basePower >= 90) {
                this.zMove.basePower = 175;
            }
            else if (basePower >= 80) {
                this.zMove.basePower = 160;
            }
            else if (basePower >= 70) {
                this.zMove.basePower = 140;
            }
            else if (basePower >= 60) {
                this.zMove.basePower = 120;
            }
            else {
                this.zMove.basePower = 100;
            }
        }
        if (!this.gen) {
            if (this.num >= 743) {
                this.gen = 8;
            }
            else if (this.num >= 622) {
                this.gen = 7;
            }
            else if (this.num >= 560) {
                this.gen = 6;
            }
            else if (this.num >= 468) {
                this.gen = 5;
            }
            else if (this.num >= 355) {
                this.gen = 4;
            }
            else if (this.num >= 252) {
                this.gen = 3;
            }
            else if (this.num >= 166) {
                this.gen = 2;
            }
            else if (this.num >= 1) {
                this.gen = 1;
            }
        }
    }
}
exports.DataMove = DataMove;
class DexMoves {
    constructor(dex) {
        this.moveCache = new Map();
        this.allCache = null;
        this.dex = dex;
    }
    get(name) {
        if (name && typeof name !== 'string')
            return name;
        name = (name || '').trim();
        const id = (0, dex_data_1.toID)(name);
        return this.getByID(id);
    }
    getByID(id) {
        let move = this.moveCache.get(id);
        if (move)
            return move;
        if (this.dex.data.Aliases.hasOwnProperty(id)) {
            move = this.get(this.dex.data.Aliases[id]);
            if (move.exists) {
                this.moveCache.set(id, move);
            }
            return move;
        }
        if (id.startsWith('hiddenpower')) {
            id = /([a-z]*)([0-9]*)/.exec(id)[1];
        }
        if (id && this.dex.data.Moves.hasOwnProperty(id)) {
            const moveData = this.dex.data.Moves[id];
            const moveTextData = this.dex.getDescs('Moves', id, moveData);
            move = new DataMove({
                name: id,
                ...moveData,
                ...moveTextData,
            });
            if (move.gen > this.dex.gen) {
                move.isNonstandard = 'Future';
            }
        }
        else {
            move = new DataMove({
                name: id, exists: false,
            });
        }
        move.kind = 'Move';
        if (move.exists)
            this.moveCache.set(id, move);
        return move;
    }
    all() {
        if (this.allCache)
            return this.allCache;
        const moves = [];
        for (const id in this.dex.data.Moves) {
            moves.push(this.getByID(id));
        }
        this.allCache = moves;
        return this.allCache;
    }
}
exports.DexMoves = DexMoves;
//# sourceMappingURL=dex-moves.js.map