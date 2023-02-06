"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineUniqueCss = void 0;
const postcss_1 = __importDefault(require("postcss"));
const prettier_1 = require("prettier");
const postcss_nested_1 = __importDefault(require("postcss-nested"));
const postcss_prefix_selector_1 = __importDefault(require("postcss-prefix-selector"));
const cssnano_1 = __importDefault(require("cssnano"));
const cssnano_preset_advanced_1 = __importDefault(require("cssnano-preset-advanced"));
const postcss_combine_duplicated_selectors_1 = __importDefault(require("postcss-combine-duplicated-selectors"));
/**
 * Combine two CSS files, keeping only the unique CSS from each file,
 * sort the CSS, wrap it in a parent, then write it to a file.
 * @param {Options} options The options to use.
 * @returns {string} The combined CSS.
 */
async function combineUniqueCss(options) {
    const v1 = options.css1;
    const v1Parsed = postcss_1.default.parse(v1);
    const v2Parsed = postcss_1.default.parse(options.css2);
    // remove the parent class from all selectors
    if (options.parent) {
        const regex = new RegExp(`${options.parent}\\s?`, 'g');
        v1Parsed.walkRules((rule) => {
            rule.selector = rule.selector.replace(regex, '');
        });
        v2Parsed.walkRules((rule) => {
            rule.selector = rule.selector.replace(regex, '');
        });
    }
    // convert the CSS back to a string
    const v1NoParent = v1Parsed.toString();
    const v2NoParent = v2Parsed.toString();
    const combined = v1NoParent + '\n' + v2NoParent;
    let plugins = [(0, cssnano_1.default)({ preset: (0, cssnano_preset_advanced_1.default)({
                autoprefixer: false,
                cssDeclarationSorter: false,
                calc: false,
                colormin: false,
                convertValues: false,
                discardComments: false,
                discardDuplicates: true,
                discardEmpty: true,
                discardOverridden: true,
                discardUnused: false,
                mergeIdents: false,
                mergeLonghand: false,
                mergeRules: true,
                minifyFontValues: false,
                minifyGradients: false,
                minifyParams: true,
                minifySelectors: true,
                normalizeCharset: true,
                normalizeDisplayValues: false,
                normalizePositions: false,
                normalizeRepeatStyle: false,
                normalizeString: false,
                normalizeTimingFunctions: false,
                normalizeUnicode: false,
                normalizeUrl: false,
                normalizeWhitespace: false,
                orderedValues: false,
                reduceIdents: false,
                reduceInitial: false,
                reduceTransforms: false,
                svgo: false,
                uniqueSelectors: true,
                zindex: false,
            }), })];
    if (options.parent) {
        const prefixerPlugin = (0, postcss_prefix_selector_1.default)({
            prefix: options.parent,
            exclude: [options.parent],
        });
        plugins.unshift(postcss_nested_1.default, postcss_combine_duplicated_selectors_1.default, prefixerPlugin);
    }
    const sorted = sortCss(combined);
    // wrap all the CSS in a parent class
    const result = (0, postcss_1.default)(plugins).process(sorted, {
        from: undefined,
    });
    const resultCss = await result.then((r) => r.css);
    const formatted = (0, prettier_1.format)(resultCss, { parser: 'css' });
    const duplicateDeclarationsRemoved = removeDuplicateDeclarations(formatted);
    return duplicateDeclarationsRemoved;
}
exports.combineUniqueCss = combineUniqueCss;
function removeDuplicateDeclarations(css) {
    const parsed = postcss_1.default.parse(css);
    // we need to walk every rule, then if the rule has a duplicate, remove all but the last one
    parsed.walkRules((rule) => {
        const declarations = rule.nodes;
        const declarationMap = new Map();
        declarations.forEach((declaration) => {
            const existing = declarationMap.get(declaration.prop);
            if (existing) {
                existing.remove();
            }
            declarationMap.set(declaration.prop, declaration);
        });
    });
    return parsed.toString();
}
/**
 * Sorts the CSS like this:
 *  1. :root selectors
 *  2. * selectors
 *  3. html and body selectors
 *  4. pseudo selectors
 *  5. tag selectors
 *  6. class selectors
 *  7. at-rules
 *
 * @param {string} css The CSS to sort.
 */
function sortCss(css) {
    const rootSelectors = [];
    const starSelectors = [];
    const baseSelectors = [];
    const pseudo = [];
    const tags = [];
    const classes = [];
    const atrules = [];
    const combinedParsed = postcss_1.default.parse(css);
    combinedParsed.walkRules((rule) => {
        // skip rules inside of @media
        if (rule.parent?.type === 'atrule') {
            return;
        }
        if (rule.selector.startsWith('*')) {
            starSelectors.push(rule);
        }
        else if (rule.selector.startsWith(':root')) {
            rootSelectors.push(rule);
        }
        else if (rule.selector.startsWith('html') || rule.selector.startsWith('body')) {
            baseSelectors.push(rule);
        }
        else if (rule.selector.startsWith(':')) {
            pseudo.push(rule);
        }
        else if (rule.selector.startsWith('.')) {
            classes.push(rule);
        }
        else {
            tags.push(rule);
        }
    });
    // put the @ rules at the end
    combinedParsed.walkAtRules((atrule) => {
        atrules.push(atrule);
    });
    // combine the CSS back together
    const root = postcss_1.default.root();
    root.append(rootSelectors);
    root.append(starSelectors);
    root.append(baseSelectors);
    root.append(pseudo);
    root.append(tags);
    root.append(classes);
    root.append(atrules);
    return root;
}
