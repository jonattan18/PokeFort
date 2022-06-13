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
exports.Teams = void 0;
const pkmn = __importStar(require("@pkmn/sets"));
// eslint-disable-next-line no-var
var teamGeneratorFactory;
exports.Teams = new class Teams {
    pack(team) {
        return new pkmn.Team(team || []).pack();
    }
    unpack(buf) {
        return pkmn.Teams.unpackTeam(buf)?.team || null;
    }
    export(team, options) {
        return new pkmn.Team(team).export();
    }
    exportSet(set, { hideStats } = {}) {
        return pkmn.Sets.exportSet(set);
    }
    // BUG: SSB3's Easter egg requires we return any here instead of TeamGenerator. *sigh* :(
    getGenerator(format, seed = null) {
        if (!teamGeneratorFactory) {
            throw new Error('getTeamGenerator maybe not be used unless a TeamGeneratorFactory has been set');
        }
        return teamGeneratorFactory.getTeamGenerator(format, seed);
    }
    setGeneratorFactory(factory) {
        teamGeneratorFactory = factory;
        return this;
    }
    generate(format, options = null) {
        return this.getGenerator(format, options?.seed).getTeam(options || undefined);
    }
};
exports.default = exports.Teams;
//# sourceMappingURL=teams.js.map