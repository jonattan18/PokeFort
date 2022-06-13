"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DexConditions = exports.Condition = void 0;
const dex_data_1 = require("./dex-data");
class Condition extends dex_data_1.BasicEffect {
    constructor(data) {
        super(data);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        data = this;
        this.effectType = (['Weather', 'Status'].includes(data.effectType) ? data.effectType : 'Condition');
    }
}
exports.Condition = Condition;
const EMPTY_CONDITION = new Condition({ name: '', exists: false });
class DexConditions {
    constructor(dex) {
        this.conditionCache = new Map();
        this.dex = dex;
    }
    get(name) {
        if (!name)
            return EMPTY_CONDITION;
        if (typeof name !== 'string')
            return name;
        const special = name.startsWith('item:') ? `item:${(0, dex_data_1.toID)(name.slice(5))}` :
            name.startsWith('ability:') ? `ability:${(0, dex_data_1.toID)(name.slice(8))}` :
                name.startsWith('move:') ? `move:${(0, dex_data_1.toID)(name.slice(5))}` : undefined;
        return this.getByID(special || (0, dex_data_1.toID)(name));
    }
    getByID(id) {
        if (!id)
            return EMPTY_CONDITION;
        let condition = this.conditionCache.get(id);
        if (condition)
            return condition;
        let found;
        if (id.startsWith('item:')) {
            const item = this.dex.items.getByID(id.slice(5));
            condition = item;
        }
        else if (id.startsWith('ability:')) {
            const ability = this.dex.abilities.getByID(id.slice(8));
            condition = ability;
        }
        else if (id.startsWith('move:')) {
            const move = this.dex.moves.getByID(id.slice(5));
            condition = move;
        }
        else if (this.dex.data.Rulesets.hasOwnProperty(id)) {
            condition = this.dex.formats.get(id);
        }
        else if (this.dex.data.Conditions.hasOwnProperty(id)) {
            condition = new Condition({ name: id, ...this.dex.data.Conditions[id] });
        }
        else if ((this.dex.data.Moves.hasOwnProperty(id) && (found = this.dex.data.Moves[id]).condition) ||
            (this.dex.data.Abilities.hasOwnProperty(id) && (found = this.dex.data.Abilities[id]).condition) ||
            (this.dex.data.Items.hasOwnProperty(id) && (found = this.dex.data.Items[id]).condition)) {
            condition = new Condition({ name: found.name || id, ...found.condition });
        }
        else if (id === 'recoil') {
            condition = new Condition({ name: 'Recoil', effectType: 'Recoil' });
        }
        else if (id === 'drain') {
            condition = new Condition({ name: 'Drain', effectType: 'Drain' });
        }
        else {
            condition = new Condition({ name: id, exists: false });
        }
        this.conditionCache.set(id, condition);
        return condition;
    }
}
exports.DexConditions = DexConditions;
//# sourceMappingURL=dex-conditions.js.map