// Utils to control admin message structure.
var moderator = ["ahelp", "profile", "balance", "pokemon", "dex", "report", "listreport", "remreport", "info", "apf"];
var LoAdmin = moderator.concat(["ahint", "complaint", "suspend", "looksuspend", "remsuspend", "warn", "listwarn", "remwarn"]);
var HiAdmin = LoAdmin.concat(["listcomplaint", "remcomplaint", "ban", "spawn", "unban", "promote", "demote", "unspawn"]);
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

function getrole(level) {
    if (level == "1") return "Watch any suspicious activity and report it to higher admins.";
    else if (level == "2") return "Verify the suspicious activity and apply ban or suspend application to higher admins.";
    else if (level == "3") return "Monitor all spawn rate and misc. If suspicious activity is found, ban them.";
    else if (level > 3) return "Not defined";
}

function gethelp(level) {
    if (level == "1") return moderator_help;
    else if (level == "2") return LoAdmin_help;
    else if (level == "3") return HiAdmin_help;
    else if (level > 3) return HiAdmin_help;
}

var moderator_help = "``Profile <userid>`` - Will show the profile information of other players.\n"
                    + "``Balance <userid>`` - Will show the balance of other players.\n"
                    + "``Pokemon <userid>`` - Will show the pokemon owned by other players.\n"
                    + "``Dex <userid>`` - Will show the dex report by other players.\n"
                    + "``Report <userid>`` - Will report the user to higher admins.\n"
                    + "``ListReport <userid>`` - List reports given to a user.\n"
                    + "``RemReport <userid>`` - Remove a report given to a user.\n"
                    + "``Info <userid>`` - Will show the pokemon info of other players.\n"
                    + "``APF <userid>`` - Will show the profile of your admin.\n";

var LoAdmin_help = moderator_help
                    + "``Ahint <user>`` - Will show the hint of other players.\n"
                    + "``Complaint <user>`` - Will complaint the user to higher admins.\n"
                    + "``Suspend <user>`` - Will suspend the user.\n"
                    + "``LookSuspend`` - Will show the suspended users.\n"
                    + "``RemSuspend <user>`` - Will remove the suspension of the user.\n"
                    + "``Warn <user>`` - Will warn the user.\n"
                    + "``ListWarn <user>`` - Will list the warns given to a user.\n"
                    + "``RemWarn <user>`` - Will remove the warns given to a user.\n";

var HiAdmin_help = LoAdmin_help
                    + "``ListComplaint`` - Will list the complaints given to a user.\n"
                    + "``RemComplaint <user>`` - Will remove the complaint given to a user.\n"
                    + "``Ban <user>`` - Will ban the user.\n"
                    + "``Spawn <user>`` - Will spawn the user.\n"
                    + "``Unban <user>`` - Will unban the user.\n"
                    + "``Promote <user>`` - Will promote the user.\n"
                    + "``Demote <user>`` - Will demote the user.\n"
                    + "``Unspawn <user>`` - Will unspawn the user.\n";

module.exports = { iseligible, getlevel, getposition, getdesc, getrole, gethelp };