"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DexAbilities = exports.Ability = void 0;
const dex_data_1 = require("./dex-data");
class Ability extends dex_data_1.BasicEffect {
    constructor(data) {
        super(data);
        this.fullname = `ability: ${this.name}`;
        this.effectType = 'Ability';
        this.suppressWeather = !!data.suppressWeather;
        this.rating = data.rating || 0;
        if (!this.gen) {
            if (this.num >= 234) {
                this.gen = 8;
            }
            else if (this.num >= 192) {
                this.gen = 7;
            }
            else if (this.num >= 165) {
                this.gen = 6;
            }
            else if (this.num >= 124) {
                this.gen = 5;
            }
            else if (this.num >= 77) {
                this.gen = 4;
            }
            else if (this.num >= 1) {
                this.gen = 3;
            }
        }
    }
}
exports.Ability = Ability;
class DexAbilities {
    constructor(dex) {
        this.abilityCache = new Map();
        this.allCache = null;
        this.dex = dex;
    }
    get(name = '') {
        if (name && typeof name !== 'string')
            return name;
        const id = (0, dex_data_1.toID)(name);
        return this.getByID(id);
    }
    getByID(id) {
        let ability = this.abilityCache.get(id);
        if (ability)
            return ability;
        if (this.dex.data.Aliases.hasOwnProperty(id)) {
            ability = this.get(this.dex.data.Aliases[id]);
        }
        else if (id && this.dex.data.Abilities.hasOwnProperty(id)) {
            const abilityData = this.dex.data.Abilities[id];
            const abilityTextData = this.dex.getDescs('Abilities', id, abilityData);
            ability = new Ability({
                name: id,
                ...abilityData,
                ...abilityTextData,
            });
            if (ability.gen > this.dex.gen) {
                ability.isNonstandard = 'Future';
            }
            if (this.dex.currentMod === 'gen7letsgo' && ability.id !== 'noability') {
                ability.isNonstandard = 'Past';
            }
            if ((this.dex.currentMod === 'gen7letsgo' || this.dex.gen <= 2) && ability.id === 'noability') {
                ability.isNonstandard = null;
            }
        }
        else {
            ability = new Ability({
                id, name: id, exists: false,
            });
        }
        ability.kind = 'Ability';
        if (ability.exists)
            this.abilityCache.set(id, ability);
        return ability;
    }
    all() {
        if (this.allCache)
            return this.allCache;
        const abilities = [];
        for (const id in this.dex.data.Abilities) {
            abilities.push(this.getByID(id));
        }
        this.allCache = abilities;
        return this.allCache;
    }
}
exports.DexAbilities = DexAbilities;
//# sourceMappingURL=dex-abilities.js.map