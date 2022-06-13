"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DexItems = exports.Item = void 0;
const dex_data_1 = require("./dex-data");
class Item extends dex_data_1.BasicEffect {
    constructor(data) {
        super(data);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        data = this;
        this.fullname = `item: ${this.name}`;
        this.effectType = 'Item';
        this.fling = data.fling || undefined;
        this.onDrive = data.onDrive || undefined;
        this.onMemory = data.onMemory || undefined;
        this.megaStone = data.megaStone || undefined;
        this.megaEvolves = data.megaEvolves || undefined;
        this.zMove = data.zMove || undefined;
        this.zMoveType = data.zMoveType || undefined;
        this.zMoveFrom = data.zMoveFrom || undefined;
        this.itemUser = data.itemUser || undefined;
        this.isBerry = !!data.isBerry;
        this.ignoreKlutz = !!data.ignoreKlutz;
        this.onPlate = data.onPlate || undefined;
        this.isGem = !!data.isGem;
        this.isPokeball = !!data.isPokeball;
        if (!this.gen) {
            if (this.num >= 689) {
                this.gen = 7;
            }
            else if (this.num >= 577) {
                this.gen = 6;
            }
            else if (this.num >= 537) {
                this.gen = 5;
            }
            else if (this.num >= 377) {
                this.gen = 4;
            }
            else {
                this.gen = 3;
            }
            // Due to difference in gen 2 item numbering, gen 2 items must be
            // specified manually
        }
        if (this.isBerry)
            this.fling = { basePower: 10 };
        if (this.id.endsWith('plate'))
            this.fling = { basePower: 90 };
        if (this.onDrive)
            this.fling = { basePower: 70 };
        if (this.megaStone)
            this.fling = { basePower: 80 };
        if (this.onMemory)
            this.fling = { basePower: 50 };
    }
}
exports.Item = Item;
class DexItems {
    constructor(dex) {
        this.itemCache = new Map();
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
        let item = this.itemCache.get(id);
        if (item)
            return item;
        if (this.dex.data.Aliases.hasOwnProperty(id)) {
            item = this.get(this.dex.data.Aliases[id]);
            if (item.exists) {
                this.itemCache.set(id, item);
            }
            return item;
        }
        if (id && !this.dex.data.Items[id] && this.dex.data.Items[id + 'berry']) {
            item = this.getByID(id + 'berry');
            this.itemCache.set(id, item);
            return item;
        }
        if (id && this.dex.data.Items.hasOwnProperty(id)) {
            const itemData = this.dex.data.Items[id];
            const itemTextData = this.dex.getDescs('Items', id, itemData);
            item = new Item({
                name: id,
                ...itemData,
                ...itemTextData,
            });
            if (item.gen > this.dex.gen) {
                item.isNonstandard = 'Future';
            }
            // hack for allowing mega evolution in LGPE
            if (this.dex.currentMod === 'gen7letsgo' && !item.isNonstandard && !item.megaStone) {
                item.isNonstandard = 'Past';
            }
        }
        else {
            item = new Item({ name: id, exists: false });
        }
        item.kind = 'Item';
        if (item.exists)
            this.itemCache.set(id, item);
        return item;
    }
    all() {
        if (this.allCache)
            return this.allCache;
        const items = [];
        for (const id in this.dex.data.Items) {
            items.push(this.getByID(id));
        }
        this.allCache = items;
        return this.allCache;
    }
}
exports.DexItems = DexItems;
//# sourceMappingURL=dex-items.js.map