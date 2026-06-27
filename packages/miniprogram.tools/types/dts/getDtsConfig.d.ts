import ts from 'typescript';
export interface DtsConfig {
    /**
     * Entry declaration file used as the primary expansion root (default: <tsconfig.outDir>/index.d.ts)
     */
    entry?: string;
    /**
     * Output path for the bundled declaration file (default: <buildDir>/index.d.ts)
     */
    outputFile?: string;
    /**
     * Path to tsconfig.dts.json (default: finds nearest tsconfig.dts.json)
     */
    tsconfig?: string;
    /**
     * TypeScript compiler options (e.g., for path mapping).
     */
    compilerOptions?: ts.CompilerOptions;
    /**
     * Directory for emitted temporary declaration files (default: resolved from <tsconfig.outDir>)
     */
    tempDir?: string;
    /**
     * Remove the temporary declaration directory before and after bundling.
     */
    cleanTempDir?: boolean;
}
declare function getDtsConfig(options?: Partial<Omit<DtsConfig, 'tempDir'>>): Required<DtsConfig>;
export { getDtsConfig };
