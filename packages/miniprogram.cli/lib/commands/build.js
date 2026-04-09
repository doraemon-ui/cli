"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultModes = void 0;
exports.default = build;
function build(api, options) {
    api.registerCommand("build", {
        description: "build for production",
        usage: "dora build [options]",
        options: {
            "--mode": "specify env mode (default: production)",
            "--watch": "watch for changes",
        },
    }, async (args, rawArgs) => {
        const { buildComponent } = require("@doraemon-ui/miniprogram.tools");
        return buildComponent({
            _: args.watch ? ["watch"] : ["build"],
            onStartMsg: args.watch ? "正在监听文件改变" : "正在构建当前组件",
            onCloseMsg: "构建完成惹",
        });
    });
}
exports.defaultModes = {
    build: "production",
};
