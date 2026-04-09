"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultModes = void 0;
exports.default = serve;
const defaults = {
    host: "127.0.0.1",
    port: 8080,
    https: false,
    open: false,
};
function serve(api, options) {
    api.registerCommand("serve", {
        description: "start development server",
        usage: "dora serve [options] [entry]",
        options: {
            "--open": "open miniprogram devtools on server start",
            "--host": `specify host (default: ${defaults.host})`,
            "--port": `specify port (default: ${defaults.port})`,
            "--https": `use https (default: ${defaults.https})`,
            "--build-npm": "server will build npm when file changes are detected",
        },
    }, async (args, rawArgs) => {
        const devServer = {};
        // entry arg
        const entry = args._[0];
        if (entry) {
            devServer.entry = api.resolve(entry);
        }
        const projectDevServerOptions = options.devServer || {};
        // resolve server options
        const https = args.https || projectDevServerOptions.https || defaults.https;
        const host = args.host ||
            process.env.HOST ||
            projectDevServerOptions.host ||
            defaults.host;
        const port = args.port ||
            process.env.PORT ||
            projectDevServerOptions.port ||
            defaults.port;
        devServer.https = https;
        devServer.host = host;
        devServer.port = port;
        const { MiniprogramServer } = require("./ci");
        const ci = new MiniprogramServer(devServer);
        if (args.open || projectDevServerOptions.open) {
            await ci.open();
        }
        if (args["build-npm"]) {
            await ci.buildnpm();
        }
        const { buildComponent } = require("@doraemon-ui/miniprogram.tools");
        return buildComponent({
            _: ["watch"],
            onStartMsg: "启动开发服务...",
            onCloseMsg: "构建完成惹",
            async onListening(eventName) {
                if (eventName === "stop") {
                    if (args["build-npm"]) {
                        await ci.buildnpm();
                    }
                }
            },
        });
    });
}
exports.defaultModes = {
    serve: "development",
};
