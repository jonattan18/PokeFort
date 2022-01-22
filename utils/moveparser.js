const movesinfo = require('../assets/movesinfo.json');

// Function to get all pokemons from a given user id.
function normalmoves(moveset) {
    var moves = [];
    for (var i = 0; i < Object.keys(moveset).length; i++) {
        var temp_move = moveset[Object.keys(moveset)[i]].filter(x => x.includes("8L") || x.includes("4L" || x.includes("3L") || x.includes("2L") || x.includes("1L")));
        if (temp_move.length > 0) {
            var name = movesinfo[Object.keys(moveset)[i]].name;
            if (movesinfo[Object.keys(moveset)[i]].category == "Status") name += " :lock:";
            moves.push([temp_move[0].split("L")[1], name]);
        }
    }
    moves.sort((a, b) => a[0] - b[0]);
    return moves;
}

function formmoves(moveset) {
    var moves = [];
    for (var i = 0; i < Object.keys(moveset).length; i++) {
        var temp_move = moveset[Object.keys(moveset)[i]].filter(x => x.includes("8L") || x.includes("7L") || x.includes("6L") || x.includes("5L") || x.includes("4L" || x.includes("3L") || x.includes("2L") || x.includes("1L")));
        if (temp_move.length > 0) {
            var name = movesinfo[Object.keys(moveset)[i]].name;
            if (movesinfo[Object.keys(moveset)[i]].category == "Status") name += " :lock:";
            moves.push([temp_move[0].split("L")[1], name]);
        }
    }
    moves.sort((a, b) => a[0] - b[0]);
    return moves;
}


function megamoves(moveset) {
    var moves = [];
    for (var i = 0; i < Object.keys(moveset).length; i++) {
        var temp_move = moveset[Object.keys(moveset)[i]].filter(x => x.includes("6L") || x.includes("7L"));
        if (temp_move.length > 0) {
            var name = movesinfo[Object.keys(moveset)[i]].name;
            if (movesinfo[Object.keys(moveset)[i]].category == "Status") name += " :lock:";
            moves.push([temp_move[0].split("L")[1], name]);
        }
    }
    moves.sort((a, b) => a[0] - b[0]);
    return moves;
}

function tmmoves(moveset) {
    var moves = [];
    for (var i = 0; i < Object.keys(moveset).length; i++) {
        var temp_move = moveset[Object.keys(moveset)[i]].filter(x => x.includes("8M"));
        if (temp_move.length > 0) {
            var name = movesinfo[Object.keys(moveset)[i]].name;
            if (movesinfo[Object.keys(moveset)[i]].category == "Status") name += " :lock:";
            var tmno = movesinfo[Object.keys(moveset)[i]].tm;
            moves.push([tmno, name]);
        }
    }
    moves.sort((a, b) => a[0] - b[0]);
    return moves;
}


module.exports = { normalmoves, megamoves, tmmoves, formmoves };