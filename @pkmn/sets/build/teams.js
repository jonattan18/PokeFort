"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Teams = exports.Team = void 0;
const sets_1 = require("./sets");
const CURRENT = 8;
class Team {
    constructor(team, data, format, name, folder) {
        this.team = team;
        this.data = data;
        this.format = format;
        this.name = name;
        this.folder = folder;
        this.team = team;
        this.format = format;
        this.name = name;
        this.folder = folder;
        this.data = data;
        if (format && data && data.forGen) {
            if (format.slice(0, 3) === 'gen') {
                this.data = data.forGen(parseInt(format[3]));
            }
            else {
                this.format = `gen6${format}`;
                this.data = data.forGen(6);
            }
        }
    }
    get gen() {
        var _a;
        return (_a = this.data) === null || _a === void 0 ? void 0 : _a.gen;
    }
    pack() {
        return exports.Teams.packTeam(this);
    }
    static unpack(buf, data) {
        return exports.Teams.unpackTeam(buf, data);
    }
    export(data) {
        let buf = '';
        for (const s of this.team) {
            buf += sets_1.Sets.exportSet(s, data || this.data);
        }
        return buf;
    }
    static import(buf, data) {
        return exports.Teams.importTeam(buf, data);
    }
    toString(data) {
        return this.export(data);
    }
    static fromString(str, data) {
        return exports.Teams.importTeam(str, data);
    }
    toJSON() {
        return JSON.stringify(this.team);
    }
    static fromJSON(json) {
        if (json.charAt(0) !== '[' || json.charAt(json.length - 1) !== ']') {
            return undefined;
        }
        // BUG: this is completely unvalidated...
        const team = JSON.parse(json);
        return new Team(team);
    }
}
exports.Team = Team;
exports.Teams = new class {
    packTeam(team) {
        let buf = '';
        for (const s of team.team) {
            if (buf)
                buf += ']';
            buf += sets_1.Sets.packSet(s);
        }
        return buf;
    }
    unpackTeam(buf, data) {
        if (!buf)
            return undefined;
        if (buf.charAt(0) === '[' && buf.charAt(buf.length - 1) === ']') {
            return Team.fromJSON(buf);
        }
        const team = [];
        let i = 0, j = 0;
        for (let k = 0; k < 24; k++) {
            const r = (0, sets_1._unpack)(buf, i, j, data);
            if (!r.set)
                return undefined;
            team.push(r.set);
            i = r.i;
            j = r.j;
            if (j < 0)
                break;
            i = j + 1;
        }
        return new Team(team, data);
    }
    importTeam(buf, data) {
        const teams = exports.Teams.importTeams(buf, data, true);
        return teams.length ? teams[0] : undefined;
    }
    importTeams(buf, data, one) {
        const lines = buf.split('\n');
        if (lines.length === 1 || (lines.length === 2 && !lines[1])) {
            const team = exports.Teams.unpackTeam(lines[0], data);
            return team ? [team] : [];
        }
        const teams = [];
        let setLine = -1;
        let team = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (line.substr(0, 3) === '===') {
                if (one && teams.length)
                    return teams;
                team = [];
                line = line.substr(3, line.length - 6).trim();
                let format = `gen${(data === null || data === void 0 ? void 0 : data.gen) || CURRENT}`;
                const bracketIndex = line.indexOf(']');
                if (bracketIndex >= 0) {
                    format = line.substr(1, bracketIndex - 1);
                    line = line.substr(bracketIndex + 1).trim();
                }
                const slashIndex = line.lastIndexOf('/');
                let folder = '';
                if (slashIndex > 0) {
                    folder = line.slice(0, slashIndex);
                    line = line.slice(slashIndex + 1);
                }
                teams.push(new Team(team, data, format, line, folder));
            }
            else if (line.includes('|')) {
                // packed format
                const t = unpackLine(line, data);
                if (t)
                    teams.push(t);
            }
            else if (setLine !== i) {
                const r = (0, sets_1._import)(lines, i, data);
                if (r.set)
                    team.push(r.set);
                if (r.line === i) {
                    continue;
                }
                // Reread the line to find out if we can process what _import couldn't
                setLine = r.line;
                i = setLine - 1;
            }
        }
        // If we made it here we read in some sets but there was no '===' marker
        // in the file so we assume only one (unnamed) team.
        if (team.length && !teams.length) {
            teams.push(new Team(team, data));
        }
        return teams;
    }
    exportTeams(teams, data) {
        let buf = '';
        let i = 0;
        for (const team of teams) {
            buf += '=== ' + (team.format ? '[' + team.format.toString() + '] ' : '') +
                (team.folder ? '' + team.folder + '/' : '') +
                (team.name || 'Untitled ' + ++i) + ' ===\n\n';
            buf += team.export(data);
            buf += '\n';
        }
        return buf;
    }
    toString(teams, data) {
        return exports.Teams.exportTeams(teams, data);
    }
    fromString(str, data) {
        return exports.Teams.importTeams(str, data);
    }
};
function unpackLine(line, data) {
    const pipeIndex = line.indexOf('|');
    if (pipeIndex < 0)
        return undefined;
    let bracketIndex = line.indexOf(']');
    if (bracketIndex > pipeIndex)
        bracketIndex = -1;
    let slashIndex = line.lastIndexOf('/', pipeIndex);
    // line.slice(slashIndex + 1, pipeIndex) will be ''
    if (slashIndex < 0)
        slashIndex = bracketIndex;
    const format = bracketIndex > 0 ? line.slice(0, bracketIndex) : `gen${(data === null || data === void 0 ? void 0 : data.gen) || CURRENT}`;
    const team = exports.Teams.unpackTeam(line.slice(pipeIndex + 1), data);
    return !team
        ? team
        : new Team(team.team, data, format, line.slice(slashIndex + 1, pipeIndex), line.slice(bracketIndex + 1, slashIndex > 0 ? slashIndex : bracketIndex + 1));
}
//# sourceMappingURL=teams.js.map