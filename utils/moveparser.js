const _ = require('lodash');
const movesinfo = require('../assets/movesinfo.json');

// Function to get all pokemons from a given user id.
function normalmoves(moveset, nolock = false) {
    var moves = [];
    for (var i = 0; i < Object.keys(moveset).length; i++) {
        var temp_move = moveset[Object.keys(moveset)[i]].filter(x => x.includes("8L") || x.includes("4L" || x.includes("3L") || x.includes("2L") || x.includes("1L")));
        if (temp_move.length > 0) {
            var name = movesinfo[Object.keys(moveset)[i]].name;
            if (movesinfo[Object.keys(moveset)[i]].category == "Status" && nolock == false) name += " :lock:";
            moves.push([temp_move[0].split("L")[1], name]);
        }
    }
    moves.sort((a, b) => a[0] - b[0]);
    return moves;
}

function formmoves(moveset, nolock = false) {
    var moves = [];
    for (var i = 0; i < Object.keys(moveset).length; i++) {
        var temp_move = moveset[Object.keys(moveset)[i]].filter(x => x.includes("8L") || x.includes("7L") || x.includes("6L") || x.includes("5L") || x.includes("4L" || x.includes("3L") || x.includes("2L") || x.includes("1L")));
        if (temp_move.length > 0) {
            var name = movesinfo[Object.keys(moveset)[i]].name;
            if (movesinfo[Object.keys(moveset)[i]].category == "Status" && nolock == false) name += " :lock:";
            moves.push([temp_move[0].split("L")[1], name]);
        }
    }
    moves.sort((a, b) => a[0] - b[0]);
    return moves;
}


function megamoves(moveset, nolock = false) {
    var moves = [];
    for (var i = 0; i < Object.keys(moveset).length; i++) {
        var temp_move = moveset[Object.keys(moveset)[i]].filter(x => x.includes("6L") || x.includes("7L"));
        if (temp_move.length > 0) {
            var name = movesinfo[Object.keys(moveset)[i]].name;
            if (movesinfo[Object.keys(moveset)[i]].category == "Status" && nolock == false) name += " :lock:";
            moves.push([temp_move[0].split("L")[1], name]);
        }
    }
    moves.sort((a, b) => a[0] - b[0]);
    return moves;
}

function tmmoves(moveset, nolock = false) {
    var moves = [];
    for (var i = 0; i < Object.keys(moveset).length; i++) {
        var temp_move = moveset[Object.keys(moveset)[i]].filter(x => x.includes("8M") || x.includes("7M") || x.includes("6M") || x.includes("5M") || x.includes("4M") || x.includes("3M") || x.includes("2M") || x.includes("1M"));
        if (temp_move.length > 0) {
            var name = movesinfo[Object.keys(moveset)[i]].name;
            if (movesinfo[Object.keys(moveset)[i]].category == "Status" && nolock == false) name += " :lock:";
            var tmno = movesinfo[Object.keys(moveset)[i]].tm;
            if (tmno == undefined) continue;
            moves.push([tmno, name]);
        }
    }
    moves.sort((a, b) => a[0] - b[0]);
    return moves;
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

module.exports = { normalmoves, megamoves, tmmoves, formmoves, tmdata, movedata, movedataname };