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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tags = exports.TeamValidator = exports.Teams = exports.Side = exports.RandomPlayerAI = exports.PRNG = exports.Pokemon = exports.toID = exports.Dex = exports.Streams = exports.BattleStreams = exports.Battle = void 0;
var battle_1 = require("./battle");
Object.defineProperty(exports, "Battle", { enumerable: true, get: function () { return battle_1.Battle; } });
exports.BattleStreams = __importStar(require("./battle-stream"));
exports.Streams = __importStar(require("../lib/streams"));
__exportStar(require("./state"), exports);
var dex_1 = require("./dex");
Object.defineProperty(exports, "Dex", { enumerable: true, get: function () { return dex_1.Dex; } });
Object.defineProperty(exports, "toID", { enumerable: true, get: function () { return dex_1.toID; } });
var pokemon_1 = require("./pokemon");
Object.defineProperty(exports, "Pokemon", { enumerable: true, get: function () { return pokemon_1.Pokemon; } });
var prng_1 = require("./prng");
Object.defineProperty(exports, "PRNG", { enumerable: true, get: function () { return prng_1.PRNG; } });
var random_player_ai_1 = require("./tools/random-player-ai");
Object.defineProperty(exports, "RandomPlayerAI", { enumerable: true, get: function () { return random_player_ai_1.RandomPlayerAI; } });
var side_1 = require("./side");
Object.defineProperty(exports, "Side", { enumerable: true, get: function () { return side_1.Side; } });
var teams_1 = require("./teams");
Object.defineProperty(exports, "Teams", { enumerable: true, get: function () { return teams_1.Teams; } });
var team_validator_1 = require("./team-validator");
Object.defineProperty(exports, "TeamValidator", { enumerable: true, get: function () { return team_validator_1.TeamValidator; } });
var tags_1 = require("../data/tags");
Object.defineProperty(exports, "Tags", { enumerable: true, get: function () { return tags_1.Tags; } });
__exportStar(require("./exported-global-types"), exports);
//# sourceMappingURL=index.js.map