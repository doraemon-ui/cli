"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRollupConfig = exports.startBuild = void 0;
var build_1 = require("./build");
Object.defineProperty(exports, "startBuild", { enumerable: true, get: function () { return build_1.build; } });
var rollup_conf_1 = require("./rollup.conf");
Object.defineProperty(exports, "getRollupConfig", { enumerable: true, get: function () { return rollup_conf_1.rollupConfig; } });
