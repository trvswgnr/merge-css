"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineUniqueCss = void 0;
const postcss_1 = __importDefault(require("postcss"));
const unique_css_1 = __importDefault(require("./lib/unique-css"));
const prettier_1 = require("prettier");
const postcss_nested_1 = __importDefault(require("postcss-nested"));
const postcss_prefix_selector_1 = __importDefault(require("postcss-prefix-selector"));
/**
 * Combine two CSS files, keeping only the unique CSS from each file,
 * sort the CSS, wrap it in a parent, then write it to a file.
 * @param {Options} options The options to use.
 * @returns {string} The combined CSS.
 */
function combineUniqueCss(options) {
    const v1 = options.css1;
    const v1Parsed = postcss_1.default.parse(v1);
    // remove the parent class from all selectors
    if (options.parent) {
        v1Parsed.walkRules((rule) => {
            const regex = new RegExp(`${options.parent}\\s?`, 'g');
            rule.selector = rule.selector.replace(regex, '');
        });
    }
    // convert the CSS back to a string
    const v1NoParent = v1Parsed.toString();
    const v2 = options.css2;
    // get the unique CSS from v1 compared to v2
    const v1Unique = (0, unique_css_1.default)(v1NoParent, v2);
    // get the unique CSS from v2 compared to v1
    const v2Unique = (0, unique_css_1.default)(v2, v1NoParent);
    const combined = v1Unique + '\n' + v2Unique;
    const sorted = sortCss(combined);
    // format the CSS with prettier
    const formatted = (0, prettier_1.format)(sorted.toString(), { parser: 'css' });
    let plugins = [];
    if (options.parent) {
        plugins = [
            postcss_nested_1.default,
            // @ts-ignore
            (0, postcss_prefix_selector_1.default)({
                prefix: options.parent,
                exclude: [options.parent],
            }),
        ];
    }
    // wrap all the CSS in a parent class
    const result = (0, postcss_1.default)(plugins).process(formatted, {
        from: undefined,
    });
    return result.css;
}
exports.combineUniqueCss = combineUniqueCss;
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
