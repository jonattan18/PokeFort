const _ = require('lodash');
const movesinfo = require('../assets/movesinfo.json');
const moves = require('../assets/moves.json');

// Misc
const config = require("../config/config.json");

/* Moves Data
M= Machine
L# = Level
T = Tutor
E = Egg
S = Event
The first character is the gen
oh and V is Virtual Console
*/

// Function to get pokemon moves from pokemon id.
function get_pokemon_move_from_id(pokemon_id, pokemons, tm = false, nolock = false) {
    var pokemon_db = pokemons.filter(x => x["Pokemon Id"] == pokemon_id)[0];
    var move_available = moves.filter(x => x["Pokemon Name"].toLowerCase() == `${pokemon_db["Pokemon Name"]}${pokemon_db["Alternate Form Name"] != "NULL" ? `-${pokemon_db["Alternate Form Name"].replaceAll(" ", "-")}` : ""}`.toLowerCase())[0];
    if (move_available == undefined) return null;
    var moves_to_send = [];
    if (tm == false) {
        for (var i = 0; i < move_available["Level"].length; i++) {
            var move_info = movesinfo[move_available["Level"][i][0].replace("-", "").toLowerCase()];
            var move_name = move_info.name + (move_info.category == "Status" && nolock == true ? " :lock:" : "");
            moves_to_send.push([move_available["Level"][i][1], move_name]);
        }
        moves_to_send.sort((a, b) => a[0] - b[0]);
        return moves_to_send;
    }
    else if (tm) {
        for (var i = 0; i < move_available["TM"].length; i++) {
            var move_info = movesinfo[move_available["TM"][i].replace("-", "").toLowerCase()];
            if (move_info.tm == undefined) continue;
            var move_name = move_info.name + (move_info.category == "Status" && nolock == true ? " :lock:" : "");
            moves_to_send.push([move_info.tm, move_name]);
        }
        moves_to_send.sort((a, b) => a[0] - b[0]);
        return moves_to_send;
    }
}

function get_raid_moves_from_id(pokemon_id, pokemons) {
    var pokemon_db = pokemons.filter(x => x["Pokemon Id"] == pokemon_id)[0];
    var move_available = moves.filter(x => x["Pokemon Name"].toLowerCase() == `${pokemon_db["Pokemon Name"]}${pokemon_db["Alternate Form Name"] != "NULL" ? `-${pokemon_db["Alternate Form Name"].replaceAll(" ", "-")}` : ""}`.toLowerCase())[0];
    if (move_available == undefined) return null;
    var moves_to_send = [];

    // Normal moves (No Status)
    for (var i = 0; i < move_available["Level"].length; i++) {
        var move_info = movesinfo[move_available["Level"][i][0].replace("-", "").toLowerCase()];
        if (move_info.category != "Status" && move_info.flags.charge != 1 && move_info.flags.recharge != 1 && !config.RAID_EXCEPTIONAL_MOVES.includes(move_info.name)) moves_to_send.push([move_info.name, move_info.type]);
    }

    // TM moves (No Status)
    for (var i = 0; i < move_available["TM"].length; i++) {
        var move_info = movesinfo[move_available["TM"][i].replace("-", "").toLowerCase()];
        if (move_info.tm == undefined) continue;
        if (move_info.category != "Status" && move_info.flags.charge != 1 && move_info.flags.recharge != 1 && !config.RAID_EXCEPTIONAL_MOVES.includes(move_info.name)) moves_to_send.push([move_info.name, move_info.type]);
    }

    return _.uniqWith(moves_to_send, _.isEqual);
}

function tmdata(tmid, nolock = false) {
    var movedata = _.find(movesinfo, { tm: tmid });
    return movedata;
}

function movedata(moveid, nolock = false) {
    var movedata = _.find(movesinfo, { num: moveid });
    return movedata;
}

function movedataname(name) {
    var movedata = _.find(movesinfo, { name: name });
    return movedata;
}

module.exports = { get_pokemon_move_from_id, get_raid_moves_from_id, tmdata, movedata, movedataname };