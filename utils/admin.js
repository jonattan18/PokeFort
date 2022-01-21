// Utils to control admin message structure.
var moderator = ["profile", "balance", "playerid", "pokemon", "dex", "report", "listreport", "remreport", "favourite", "info", "apf", "channelid", "serverid"];
var LoAdmin = moderator.concat(["ahint", "warn", "complaint", "suspend", "listwarn", "remwarn"]);
var HiAdmin = LoAdmin.concat(["ban", "spawn", "unban", "promote", "demote", "unspawn"]);
var System = HiAdmin.concat(["sysstat", "dbstat"]);
var Cardinal = System.concat([]);
var Architecture = Cardinal.concat([]);

function iseligible(level, cmd, message) {
    if ((message.mentions.users.first() || message.author).bot) return false;
    cmd = cmd.toLowerCase();
    if (level == "0") return false;
    else if (level == "1" && moderator.includes(cmd)) return true;
    else if (level == "2" && LoAdmin.includes(cmd)) return true;
    else if (level == "3" && HiAdmin.includes(cmd)) return true;
    else if (level == "4" && System.includes(cmd)) return true;
    else if (level == "5" && Cardinal.includes(cmd)) return true;
    else if (level == "6" && Architecture.includes(cmd)) return true;
    else return false;
}

function getlevel(level) {
    if (level == "1") return "1";
    else if (level == "2") return "2";
    else if (level == "3") return "3";
    else if (level > 3) return "???";
}

function getposition(level) {
    if (level == "1") return "Moderator";
    else if (level == "2") return "LoAdmin";
    else if (level == "3") return "HiAdmin";
    else if (level > 3) return "Unknown";
}

function getdesc(level) {
    if (level == "1") return "Moderator is a person who acts as an organizer, officiant for regarding rules, arbitrator";
    else if (level == "2") return "LoAdmin is a person who have higher authority than Moderator, who can talk directly to Higher Admins";
    else if (level == "3") return "HiAdmin is a highest authority role, who can ban and suspend users and command lower admins.";
    else if (level > 3) return "No information found !";
}

function getrole(leve) {
    if (leve == "1") return "Watch any suspicious activity and report it to higher admins.";
    else if (leve == "2") return "Verify the suspicious activity and apply ban or suspend application to higher admins.";
    else if (leve == "3") return "Monitor all spawn rate and misc. If suspicious activity is found, ban them.";
    else if (leve > 3) return "Not defined";
}

module.exports = { iseligible, getlevel, getposition, getdesc, getrole };