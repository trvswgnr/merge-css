/**
 * Combine two CSS files, keeping only the unique CSS from each file,
 * sort the CSS, wrap it in a parent, then write it to a file.
 * @param {Options} options The options to use.
 * @returns {string} The combined CSS.
 */
export declare function combineUniqueCss(options: Options): Promise<string>;
export interface Options {
    /** The first CSS file contents. */
    css1: string;
    /** The second CSS file contents. */
    css2: string;
    /** The parent selector to wrap the combined CSS in. */
    parent?: string;
}
//# sourceMappingURL=combine-unique-css.d.ts.map