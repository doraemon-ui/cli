export interface ConvertCssVarsOptions {
    bodyNode: string;
    rootNode: string;
    generateFallback?: boolean;
}
/**
 * Convert CSS custom-property usage into a dual declaration:
 * keep the original `var(...)` declaration, and inject a resolved fallback
 * declaration before it for miniprogram runtimes that don't fully support CSS vars.
 *
 * Example:
 * `font-size: var(--font-size);`
 * becomes:
 * `font-size: 14px;`
 * `font-size: var(--font-size);`
 */
export declare function convertCssVars(css: string, options?: ConvertCssVarsOptions): string;
