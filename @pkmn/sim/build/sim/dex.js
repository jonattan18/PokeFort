"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dex = exports.ModdedDex = exports.toID = void 0;
const utils_1 = require("../lib/utils");
const dex_conditions_1 = require("./dex-conditions");
const dex_moves_1 = require("./dex-moves");
const dex_items_1 = require("./dex-items");
const dex_abilities_1 = require("./dex-abilities");
const dex_species_1 = require("./dex-species");
const dex_formats_1 = require("./dex-formats");
const gen1 = __importStar(require("../data/mods/gen1"));
const gen2 = __importStar(require("../data/mods/gen2"));
const gen3 = __importStar(require("../data/mods/gen3"));
const gen4 = __importStar(require("../data/mods/gen4"));
const gen5 = __importStar(require("../data/mods/gen5"));
const gen6 = __importStar(require("../data/mods/gen6"));
const gen7 = __importStar(require("../data/mods/gen7"));
const gen8 = __importStar(require("../data"));
const abilities_1 = require("../data/text/abilities");
const items_1 = require("../data/text/items");
const moves_1 = require("../data/text/moves");
// import {PokedexText} from '../data/text/pokedex';
const default_1 = require("../data/text/default");
const Data = __importStar(require("./dex-data"));
const BASE_MOD = 'gen8';
const dexData = { gen1, gen2, gen3, gen4, gen5, gen6, gen7, gen8 };
const dexes = Object.create(null);
const DATA_TYPES = [
    'Abilities', 'Rulesets', 'FormatsData', 'Items', 'Learnsets', 'Moves',
    'Natures', 'Pokedex', 'Scripts', 'Conditions', 'TypeChart',
];
const TEXT = {
    Abilities: abilities_1.AbilitiesText,
    Items: items_1.ItemsText,
    Moves: moves_1.MovesText,
    // Pokedex: PokedexText as DexTable<PokedexText>,
    Default: default_1.DefaultText,
};
exports.toID = Data.toID;
class ModdedDex {
    constructor(mod = 'base') {
        this.Data = Data;
        this.Condition = dex_conditions_1.Condition;
        this.Ability = dex_abilities_1.Ability;
        this.Item = dex_items_1.Item;
        this.Move = dex_moves_1.DataMove;
        this.Species = dex_species_1.Species;
        this.Format = dex_formats_1.Format;
        this.ModdedDex = ModdedDex;
        this.name = "[ModdedDex]";
        this.toID = Data.toID;
        this.gen = 0;
        this.parentMod = '';
        this.modsLoaded = false;
        this.deepClone = utils_1.Utils.deepClone;
        this.isBase = (mod === 'base');
        this.currentMod = mod;
        this.dataCache = null;
        this.formats = new dex_formats_1.DexFormats(this);
        this.abilities = new dex_abilities_1.DexAbilities(this);
        this.items = new dex_items_1.DexItems(this);
        this.moves = new dex_moves_1.DexMoves(this);
        this.species = new dex_species_1.DexSpecies(this);
        this.learnsets = new dex_species_1.DexLearnsets(this);
        this.conditions = new dex_conditions_1.DexConditions(this);
        this.natures = new Data.DexNatures(this);
        this.types = new Data.DexTypes(this);
        this.stats = new Data.DexStats(this);
    }
    get modid() {
        return this.currentMod;
    }
    get data() {
        return this.loadData();
    }
    get dexes() {
        return dexes;
    }
    mod(mod, modData) {
        if (!mod)
            return dexes['base'];
        const modid = (0, exports.toID)(mod);
        if (modData?.Types && !modData.TypeChart)
            modData.TypeChart = modData.Types;
        if (modData?.Species && !modData.Pokedex)
            modData.Pokedex = modData.Species;
        const dex = (modid in dexes) && !modData ? dexes[modid] : new ModdedDex(modid);
        dex.loadData(modData);
        return dex;
    }
    forGen(gen) {
        if (!gen)
            return this;
        return this.mod(`gen${gen}`);
    }
    forFormat(format) {
        const mod = this.formats.get(format).mod;
        return dexes[mod || BASE_MOD].includeData();
    }
    modData(dataType, id) {
        if (dataType === 'Scripts')
            throw new Error(`'${dataType}' cannot be indexed by '${id}'`);
        if (this.isBase)
            return this.data[dataType][id];
        if (this.data[dataType][id] !== dexes[this.parentMod].data[dataType][id])
            return this.data[dataType][id];
        return (this.data[dataType][id] = utils_1.Utils.deepClone(this.data[dataType][id]));
    }
    effectToString() {
        return this.name;
    }
    /**
     * Sanitizes a username or Pokemon nickname
     *
     * Returns the passed name, sanitized for safe use as a name in the PS
     * protocol.
     *
     * Such a string must uphold these guarantees:
     * - must not contain any ASCII whitespace character other than a space
     * - must not start or end with a space character
     * - must not contain any of: | , [ ]
     * - must not be the empty string
     * - must not contain Unicode RTL control characters
     *
     * If no such string can be found, returns the empty string. Calling
     * functions are expected to check for that condition and deal with it
     * accordingly.
     *
     * getName also enforces that there are not multiple consecutive space
     * characters in the name, although this is not strictly necessary for
     * safety.
     */
    getName(name) {
        if (typeof name !== 'string' && typeof name !== 'number')
            return '';
        name = ('' + name).replace(/[|\s[\],\u202e]+/g, ' ').trim();
        if (name.length > 18)
            name = name.substr(0, 18).trim();
        // remove zalgo
        name = name.replace(/[\u0300-\u036f\u0483-\u0489\u0610-\u0615\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06ED\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]{3,}/g, '');
        name = name.replace(/[\u239b-\u23b9]/g, '');
        return name;
    }
    /**
     * Returns false if the target is immune; true otherwise.
     * Also checks immunity to some statuses.
     */
    getImmunity(source, target) {
        const sourceType = typeof source !== 'string' ? source.type : source;
        // @ts-ignore
        const targetTyping = target.getTypes?.() || target.types || target;
        if (Array.isArray(targetTyping)) {
            for (const type of targetTyping) {
                if (!this.getImmunity(sourceType, type))
                    return false;
            }
            return true;
        }
        const typeData = this.types.get(targetTyping);
        if (typeData && typeData.damageTaken[sourceType] === 3)
            return false;
        return true;
    }
    getEffectiveness(source, target) {
        const sourceType = typeof source !== 'string' ? source.type : source;
        // @ts-ignore
        const targetTyping = target.getTypes?.() || target.types || target;
        let totalTypeMod = 0;
        if (Array.isArray(targetTyping)) {
            for (const type of targetTyping) {
                totalTypeMod += this.getEffectiveness(sourceType, type);
            }
            return totalTypeMod;
        }
        const typeData = this.types.get(targetTyping);
        if (!typeData)
            return 0;
        switch (typeData.damageTaken[sourceType]) {
            case 1: return 1; // super-effective
            case 2: return -1; // resist
            // in case of weird situations like Gravity, immunity is handled elsewhere
            default: return 0;
        }
    }
    getDescs(table, id, dataEntry) {
        if (dataEntry.shortDesc) {
            return {
                desc: dataEntry.desc,
                shortDesc: dataEntry.shortDesc,
            };
        }
        const entry = TEXT[table][id];
        if (!entry)
            return null;
        const descs = {
            desc: '',
            shortDesc: '',
        };
        for (let i = this.gen; i < dexes['base'].gen; i++) {
            const curDesc = entry[`gen${i}`]?.desc;
            const curShortDesc = entry[`gen${i}`]?.shortDesc;
            if (!descs.desc && curDesc) {
                descs.desc = curDesc;
            }
            if (!descs.shortDesc && curShortDesc) {
                descs.shortDesc = curShortDesc;
            }
            if (descs.desc && descs.shortDesc)
                break;
        }
        if (!descs.shortDesc)
            descs.shortDesc = entry.shortDesc || '';
        if (!descs.desc)
            descs.desc = entry.desc || descs.shortDesc;
        return descs;
    }
    /**
     * Ensure we're working on a copy of a move (and make a copy if we aren't)
     *
     * Remember: "ensure" - by default, it won't make a copy of a copy:
     *     moveCopy === Dex.getActiveMove(moveCopy)
     *
     * If you really want to, use:
     *     moveCopyCopy = Dex.getActiveMove(moveCopy.id)
     */
    getActiveMove(move) {
        if (move && typeof move.hit === 'number')
            return move;
        move = this.moves.get(move);
        const moveCopy = utils_1.Utils.deepClone(move);
        moveCopy.hit = 0;
        return moveCopy;
    }
    getHiddenPower(ivs) {
        const hpTypes = [
            'Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug', 'Ghost', 'Steel',
            'Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Ice', 'Dragon', 'Dark',
        ];
        const tr = this.trunc;
        const stats = { hp: 31, atk: 31, def: 31, spe: 31, spa: 31, spd: 31 };
        if (this.gen <= 2) {
            // Gen 2 specific Hidden Power check. IVs are still treated 0-31 so we get them 0-15
            const atkDV = tr(ivs.atk / 2);
            const defDV = tr(ivs.def / 2);
            const speDV = tr(ivs.spe / 2);
            const spcDV = tr(ivs.spa / 2);
            return {
                type: hpTypes[4 * (atkDV % 4) + (defDV % 4)],
                power: tr((5 * ((spcDV >> 3) + (2 * (speDV >> 3)) + (4 * (defDV >> 3)) + (8 * (atkDV >> 3))) + (spcDV % 4)) / 2 + 31),
            };
        }
        else {
            // Hidden Power check for Gen 3 onwards
            let hpTypeX = 0;
            let hpPowerX = 0;
            let i = 1;
            for (const s in stats) {
                hpTypeX += i * (ivs[s] % 2);
                hpPowerX += i * (tr(ivs[s] / 2) % 2);
                i *= 2;
            }
            return {
                type: hpTypes[tr(hpTypeX * 15 / 63)],
                // After Gen 6, Hidden Power is always 60 base power
                power: (this.gen && this.gen < 6) ? tr(hpPowerX * 40 / 63) + 30 : 60,
            };
        }
    }
    /**
     * Truncate a number into an unsigned 32-bit integer, for
     * compatibility with the cartridge games' math systems.
     */
    trunc(num, bits = 0) {
        if (bits)
            return (num >>> 0) % (2 ** bits);
        return num >>> 0;
    }
    loadDataFile(mod, dataType, modData) {
        if (modData)
            return modData[dataType] || {};
        return dexData[mod === 'base' ? 'gen8' : mod][dataType] || {};
    }
    includeMods() {
        return this;
    }
    includeModData() {
        for (const mod in this.dexes) {
            dexes[mod].includeData();
        }
        return this;
    }
    includeData() {
        this.loadData();
        return this;
    }
    loadData(modData) {
        if (this.dataCache)
            return this.dataCache;
        const dataCache = {};
        const Scripts = this.loadDataFile(this.currentMod, 'Scripts', modData);
        this.parentMod = this.isBase ? '' : (Scripts.inherit || 'base');
        let parentDex;
        if (this.parentMod) {
            parentDex = dexes[this.parentMod];
            if (!parentDex || parentDex === this) {
                throw new Error(`Unable to load ${this.currentMod}. 'inherit' should specify a parent mod from which to inherit data, or must be not specified.`);
            }
        }
        if (!parentDex) {
            // Formats are inherited by mods and used by Rulesets
            this.includeFormats();
        }
        for (const dataType of DATA_TYPES.concat('Aliases')) {
            const BattleData = this.loadDataFile(this.currentMod, dataType, modData);
            if (BattleData !== dataCache[dataType])
                dataCache[dataType] = Object.assign(BattleData, dataCache[dataType]);
            if (dataType === 'Rulesets' && !parentDex) {
                for (const format of this.formats.all()) {
                    BattleData[format.id] = { ...format, ruleTable: null };
                }
            }
        }
        if (parentDex) {
            for (const dataType of DATA_TYPES) {
                const parentTypedData = parentDex.data[dataType];
                const childTypedData = dataCache[dataType] || (dataCache[dataType] = {});
                for (const entryId in parentTypedData) {
                    if (childTypedData[entryId] === null) {
                        // null means don't inherit
                        delete childTypedData[entryId];
                    }
                    else if (!(entryId in childTypedData)) {
                        // If it doesn't exist it's inherited from the parent data
                        if (dataType === 'Pokedex') {
                            // Pokedex entries can be modified too many different ways
                            // e.g. inheriting different formats-data/learnsets
                            childTypedData[entryId] = utils_1.Utils.deepClone(parentTypedData[entryId]);
                        }
                        else {
                            childTypedData[entryId] = parentTypedData[entryId];
                        }
                    }
                    else if (childTypedData[entryId]?.inherit) {
                        // {inherit: true} can be used to modify only parts of the parent data,
                        // instead of overwriting entirely
                        delete childTypedData[entryId].inherit;
                        // Merge parent into children entry, preserving existing childs' properties.
                        // @ts-ignore
                        for (const key in parentTypedData[entryId]) {
                            if (key in childTypedData[entryId])
                                continue;
                            // @ts-ignore
                            childTypedData[entryId][key] = parentTypedData[entryId][key];
                        }
                    }
                }
            }
            dataCache['Aliases'] = parentDex.data['Aliases'];
        }
        // Flag the generation. Required for team validator.
        this.gen = dataCache.Scripts.gen;
        if (!this.gen)
            throw new Error(`Mod ${this.currentMod} needs a generation number in scripts.js`);
        dataCache.Types = dataCache.TypeChart;
        dataCache.Species = dataCache.Pokedex;
        this.dataCache = dataCache;
        // Execute initialization script.
        if (Scripts.init)
            Scripts.init.call(this);
        return this.dataCache;
    }
    includeFormats() {
        this.formats.load();
        return this;
    }
}
exports.ModdedDex = ModdedDex;
dexes['base'] = new ModdedDex();
dexes['gen1'] = new ModdedDex('gen1');
dexes['gen2'] = new ModdedDex('gen2');
dexes['gen3'] = new ModdedDex('gen3');
dexes['gen4'] = new ModdedDex('gen4');
dexes['gen5'] = new ModdedDex('gen5');
dexes['gen6'] = new ModdedDex('gen6');
dexes['gen7'] = new ModdedDex('gen7');
// "gen8" is an alias for the current base data
dexes[BASE_MOD] = dexes['base'];
dexes['base'].includeModData();
exports.Dex = dexes['base'];
//# sourceMappingURL=dex.js.map