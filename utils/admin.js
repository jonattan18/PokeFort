// Utils to control admin message structure.
var moderator = ["profile", "balance", "redeem", "playerid", "apf", "channelid", "serverid"];
var LoAdmin = moderator.concat(["warn", "complaint", "suspend", "mute", "unmute", "visible", "invisible"]);
var HiAdmin = LoAdmin.concat(["ban", "spawn", "unban", "promote", "hidestat", "demote", "unhidestat", "unspawn"]);

function iseligible(level, cmd) {
    cmd = cmd.toLowerCase();
    if (level == "0") return false;
    else if (level == "1" && moderator.includes(cmd)) return true;
    else if (level == "2" && LoAdmin.includes(cmd)) return true;
    else if (level == "3" && HiAdmin.includes(cmd)) return true;
    else return false;
}

module.exports = { iseligible };