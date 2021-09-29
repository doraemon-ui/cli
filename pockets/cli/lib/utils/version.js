"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkVersion = void 0;
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
async function checkVersion() {
    const packageJson = require('../../package.json');
    const currentVersion = packageJson.version || '';
    const packageName = packageJson.name || '';
    if (currentVersion && packageName) {
        try {
            const { data: packageMetadata } = await axios_1.default.get(`https://registry.npm.taobao.org/${packageName}`);
            if (!packageMetadata || !packageMetadata['dist-tags']) {
                return;
            }
            const distTags = packageMetadata['dist-tags'];
            const latestVersion = distTags.latest || '';
            if (!latestVersion) {
                return;
            }
            if (currentVersion !== latestVersion) {
                console.log(chalk_1.default.yellow(`${packageName} 当前版本 ${currentVersion}，发现最新版本 ${latestVersion}，请及时更新~`));
            }
        }
        catch (err) {
            console.log(chalk_1.default.yellow('线上版本检查失败，请报告开发者'));
            return;
        }
    }
}
exports.checkVersion = checkVersion;
