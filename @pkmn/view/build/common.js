"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toID = void 0;
function toID(text) {
    if (text === null || text === void 0 ? void 0 : text.id)
        text = text.id;
    if (typeof text !== 'string' && typeof text !== 'number')
        return '';
    return ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '');
}
exports.toID = toID;
//# sourceMappingURL=common.js.map