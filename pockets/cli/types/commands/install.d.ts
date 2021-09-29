import { PluginAPI } from '../PluginAPI';
import { Options } from '../options';
export default function install(api: PluginAPI, options: Options): void;
export declare function installPackage(to: string, packageName: string, dev?: boolean): Promise<never>;
