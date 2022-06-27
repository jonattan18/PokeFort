"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DexLearnsets = exports.DexSpecies = exports.Learnset = exports.Species = void 0;
const dex_data_1 = require("./dex-data");
class Species extends dex_data_1.BasicEffect {
    constructor(data) {
        super(data);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        data = this;
        this.fullname = `pokemon: ${data.name}`;
        this.effectType = 'Pokemon';
        this.baseSpecies = data.baseSpecies || this.name;
        this.forme = data.forme || '';
        this.baseForme = data.baseForme || '';
        this.cosmeticFormes = data.cosmeticFormes || undefined;
        this.otherFormes = data.otherFormes || undefined;
        this.formeOrder = data.formeOrder || undefined;
        this.spriteid = data.spriteid ||
            ((0, dex_data_1.toID)(this.baseSpecies) + (this.baseSpecies !== this.name ? `-${(0, dex_data_1.toID)(this.forme)}` : ''));
        this.abilities = data.abilities || { 0: "" };
        this.types = data.types || ['???'];
        this.addedType = data.addedType || undefined;
        this.prevo = data.prevo || '';
        this.tier = data.tier || '';
        this.doublesTier = data.doublesTier || '';
        this.evos = data.evos || [];
        this.evoType = data.evoType || undefined;
        this.evoMove = data.evoMove || undefined;
        this.evoLevel = data.evoLevel || undefined;
        this.nfe = data.nfe || false;
        this.eggGroups = data.eggGroups || [];
        this.canHatch = data.canHatch || false;
        this.gender = data.gender || '';
        this.genderRatio = data.genderRatio || (this.gender === 'M' ? { M: 1, F: 0 } :
            this.gender === 'F' ? { M: 0, F: 1 } :
                this.gender === 'N' ? { M: 0, F: 0 } :
                    { M: 0.5, F: 0.5 });
        this.requiredItem = data.requiredItem || undefined;
        this.requiredItems = this.requiredItems || (this.requiredItem ? [this.requiredItem] : undefined);
        this.baseStats = data.baseStats || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
        this.bst = this.baseStats.hp + this.baseStats.atk + this.baseStats.def +
            this.baseStats.spa + this.baseStats.spd + this.baseStats.spe;
        this.weightkg = data.weightkg || 0;
        this.weighthg = this.weightkg * 10;
        this.heightm = data.heightm || 0;
        this.color = data.color || '';
        this.tags = data.tags || [];
        this.unreleasedHidden = data.unreleasedHidden || false;
        this.maleOnlyHidden = !!data.maleOnlyHidden;
        this.maxHP = data.maxHP || undefined;
        this.isMega = !!(this.forme && ['Mega', 'Mega-X', 'Mega-Y'].includes(this.forme)) || undefined;
        this.canGigantamax = data.canGigantamax || undefined;
        this.gmaxUnreleased = !!data.gmaxUnreleased;
        this.cannotDynamax = !!data.cannotDynamax;
        this.battleOnly = data.battleOnly || (this.isMega ? this.baseSpecies : undefined);
        this.changesFrom = data.changesFrom ||
            (this.battleOnly !== this.baseSpecies ? this.battleOnly : this.baseSpecies);
        if (Array.isArray(data.changesFrom))
            this.changesFrom = data.changesFrom[0];
        if (!this.gen && this.num >= 1) {
            if (this.num >= 810 || ['Gmax', 'Galar', 'Galar-Zen', 'Hisui'].includes(this.forme)) {
                this.gen = 8;
            }
            else if (this.num >= 722 || this.forme.startsWith('Alola') || this.forme === 'Starter') {
                this.gen = 7;
            }
            else if (this.forme === 'Primal') {
                this.gen = 6;
                this.isPrimal = true;
                this.battleOnly = this.baseSpecies;
            }
            else if (this.num >= 650 || this.isMega) {
                this.gen = 6;
            }
            else if (this.num >= 494) {
                this.gen = 5;
            }
            else if (this.num >= 387) {
                this.gen = 4;
            }
            else if (this.num >= 252) {
                this.gen = 3;
            }
            else if (this.num >= 152) {
                this.gen = 2;
            }
            else {
                this.gen = 1;
            }
        }
    }
}
exports.Species = Species;
class Learnset {
    constructor(data) {
        this.exists = data.exists === false ? data.exists : true;
        this.effectType = 'Learnset';
        this.learnset = data.learnset || undefined;
        this.eventOnly = !!data.eventOnly;
        this.eventData = data.eventData || undefined;
        this.encounters = data.encounters || undefined;
    }
}
exports.Learnset = Learnset;
class DexSpecies {
    constructor(dex) {
        this.speciesCache = new Map();
        this.allCache = null;
        this.dex = dex;
    }
    get(name) {
        if (name && typeof name !== 'string')
            return name;
        name = (name || '').trim();
        let id = (0, dex_data_1.toID)(name);
        if (id === 'nidoran' && name.endsWith('♀')) {
            id = 'nidoranf';
        }
        else if (id === 'nidoran' && name.endsWith('♂')) {
            id = 'nidoranm';
        }
        return this.getByID(id);
    }
    getByID(id) {
        let species = this.speciesCache.get(id);
        if (species)
            return species;
        if (this.dex.data.Aliases.hasOwnProperty(id)) {
            if (this.dex.data.FormatsData.hasOwnProperty(id)) {
                // special event ID, like Rockruff-Dusk
                const baseId = (0, dex_data_1.toID)(this.dex.data.Aliases[id]);
                species = new Species({
                    ...this.dex.data.Pokedex[baseId],
                    ...this.dex.data.FormatsData[id],
                    name: id,
                });
                species.abilities = { 0: species.abilities['S'] };
            }
            else {
                species = this.get(this.dex.data.Aliases[id]);
                if (species.cosmeticFormes) {
                    for (const forme of species.cosmeticFormes) {
                        if ((0, dex_data_1.toID)(forme) === id) {
                            species = new Species({
                                ...species,
                                name: forme,
                                forme: forme.slice(species.name.length + 1),
                                baseForme: "",
                                baseSpecies: species.name,
                                otherFormes: null,
                                cosmeticFormes: null,
                            });
                            break;
                        }
                    }
                }
            }
            this.speciesCache.set(id, species);
            return species;
        }
        if (!this.dex.data.Pokedex.hasOwnProperty(id)) {
            let aliasTo = '';
            const formeNames = {
                alola: ['a', 'alola', 'alolan'],
                galar: ['g', 'galar', 'galarian'],
                mega: ['m', 'mega'],
                primal: ['p', 'primal'],
                hisui: ['h', 'hisui', 'hisuian']
            };
            for (const forme in formeNames) {
                let pokeName = '';
                for (const i of formeNames[forme]) {
                    if (id.startsWith(i)) {
                        pokeName = id.slice(i.length);
                    }
                    else if (id.endsWith(i)) {
                        pokeName = id.slice(0, -i.length);
                    }
                }
                if (this.dex.data.Aliases.hasOwnProperty(pokeName))
                    pokeName = (0, dex_data_1.toID)(this.dex.data.Aliases[pokeName]);
                if (this.dex.data.Pokedex[pokeName + forme]) {
                    aliasTo = pokeName + forme;
                    break;
                }
            }
            if (aliasTo) {
                species = this.get(aliasTo);
                if (species.exists) {
                    this.speciesCache.set(id, species);
                    return species;
                }
            }
        }
        if (id && this.dex.data.Pokedex.hasOwnProperty(id)) {
            const pokedexData = this.dex.data.Pokedex[id];
            const baseSpeciesTags = pokedexData.baseSpecies && this.dex.data.Pokedex[(0, dex_data_1.toID)(pokedexData.baseSpecies)].tags;
            species = new Species({
                tags: baseSpeciesTags,
                ...pokedexData,
                ...this.dex.data.FormatsData[id],
            });
            // Inherit any statuses from the base species (Arceus, Silvally).
            const baseSpeciesStatuses = this.dex.data.Conditions[(0, dex_data_1.toID)(species.baseSpecies)];
            if (baseSpeciesStatuses !== undefined) {
                let key;
                for (key in baseSpeciesStatuses) {
                    if (!(key in species))
                        species[key] = baseSpeciesStatuses[key];
                }
            }
            if (!species.tier && !species.doublesTier && species.baseSpecies !== species.name) {
                if (species.baseSpecies === 'Mimikyu') {
                    species.tier = this.dex.data.FormatsData[(0, dex_data_1.toID)(species.baseSpecies)].tier || 'Illegal';
                    species.doublesTier = this.dex.data.FormatsData[(0, dex_data_1.toID)(species.baseSpecies)].doublesTier || 'Illegal';
                }
                else if (species.id.endsWith('totem')) {
                    species.tier = this.dex.data.FormatsData[species.id.slice(0, -5)].tier || 'Illegal';
                    species.doublesTier = this.dex.data.FormatsData[species.id.slice(0, -5)].doublesTier || 'Illegal';
                }
                else if (species.battleOnly) {
                    species.tier = this.dex.data.FormatsData[(0, dex_data_1.toID)(species.battleOnly)].tier || 'Illegal';
                    species.doublesTier = this.dex.data.FormatsData[(0, dex_data_1.toID)(species.battleOnly)].doublesTier || 'Illegal';
                }
                else {
                    const baseFormatsData = this.dex.data.FormatsData[(0, dex_data_1.toID)(species.baseSpecies)];
                    if (!baseFormatsData) {
                        throw new Error(`${species.baseSpecies} has no formats-data entry`);
                    }
                    species.tier = baseFormatsData.tier || 'Illegal';
                    species.doublesTier = baseFormatsData.doublesTier || 'Illegal';
                }
            }
            if (!species.tier)
                species.tier = 'Illegal';
            if (!species.doublesTier)
                species.doublesTier = species.tier;
            if (species.gen > this.dex.gen) {
                species.tier = 'Illegal';
                species.doublesTier = 'Illegal';
                species.isNonstandard = 'Future';
            }
            if (this.dex.currentMod === 'gen7letsgo' && !species.isNonstandard) {
                const isLetsGo = ((species.num <= 151 || ['Meltan', 'Melmetal'].includes(species.name)) &&
                    (!species.forme || ['Alola', 'Mega', 'Mega-X', 'Mega-Y', 'Starter'].includes(species.forme) &&
                        species.name !== 'Pikachu-Alola'));
                if (!isLetsGo)
                    species.isNonstandard = 'Past';
            }
            if (this.dex.currentMod === 'gen8bdsp' &&
                (!species.isNonstandard || ["Gigantamax", "CAP"].includes(species.isNonstandard))) {
                if (species.gen > 4 || (species.num < 1 && species.isNonstandard !== 'CAP') ||
                    species.id === 'pichuspikyeared') {
                    species.isNonstandard = 'Future';
                    species.tier = species.doublesTier = 'Illegal';
                }
            }
            species.nfe = species.evos.some(evo => {
                const evoSpecies = this.get(evo);
                return !evoSpecies.isNonstandard || evoSpecies.isNonstandard === species?.isNonstandard;
            });
            species.canHatch = species.canHatch ||
                (!['Ditto', 'Undiscovered'].includes(species.eggGroups[0]) && !species.prevo && species.name !== 'Manaphy');
            if (this.dex.gen === 1)
                species.bst -= species.baseStats.spd;
            if (this.dex.gen < 5)
                delete species.abilities['H'];
            if (this.dex.gen === 3 && this.dex.abilities.get(species.abilities['1']).gen === 4)
                delete species.abilities['1'];
        }
        else {
            species = new Species({
                id, name: id,
                exists: false, tier: 'Illegal', doublesTier: 'Illegal', isNonstandard: 'Custom',
            });
        }
        species.kind = 'Species';
        if (species.exists)
            this.speciesCache.set(id, species);
        return species;
    }
    getLearnset(id) {
        return this.getLearnsetData(id).learnset;
    }
    getLearnsetData(id) {
        return this.dex.learnsets.getInternal(id);
    }
    all() {
        if (this.allCache)
            return this.allCache;
        const species = [];
        for (const id in this.dex.data.Pokedex) {
            species.push(this.getByID(id));
        }
        this.allCache = species;
        return this.allCache;
    }
}
exports.DexSpecies = DexSpecies;
class DexLearnsets {
    constructor(dex) {
        this.learnsetCache = new Map();
        this.dex = dex;
    }
    get(name) {
        return this.getByID((0, dex_data_1.toID)(name));
    }
    getByID(id) {
        return Promise.resolve(this.getInternal(id));
    }
    getInternal(id) {
        let learnsetData = this.learnsetCache.get(id);
        if (learnsetData)
            return learnsetData;
        if (!this.dex.data.Learnsets.hasOwnProperty(id)) {
            learnsetData = new Learnset({ exists: false });
        }
        else {
            learnsetData = new Learnset(this.dex.data.Learnsets[id]);
        }
        learnsetData.kind = 'Learnset';
        if (learnsetData.exists)
            this.learnsetCache.set(id, learnsetData);
        return learnsetData;
    }
}
exports.DexLearnsets = DexLearnsets;
//# sourceMappingURL=dex-species.js.map