import postcss, { AcceptedPlugin, Root, AtRule, Rule } from 'postcss';
import { format } from 'prettier';
import nested from 'postcss-nested';
import prefixer from 'postcss-prefix-selector';
import cssNano from 'cssnano';
import advancedPresets from 'cssnano-preset-advanced';
import discardDuplicates from 'postcss-discard-duplicates';

/**
 * Combine two CSS files, keeping only the unique CSS from each file,
 * sort the CSS, wrap it in a parent, then write it to a file.
 * @param {Options} options The options to use.
 * @returns {string} The combined CSS.
 */
export function combineUniqueCss(options: Options): string {
    const v1 = options.css1;
    const v1Parsed = postcss.parse(v1);
    const v2Parsed = postcss.parse(options.css2);

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

    const sorted = sortCss(combined);

    // format the CSS with prettier
    const formatted = format(sorted.toString(), { parser: 'css' });

    let plugins: AcceptedPlugin[] = [discardDuplicates];

    if (options.parent) {
        const prefixerPlugin = prefixer({
            prefix: options.parent,
            exclude: [options.parent],
        }) as AcceptedPlugin;
        plugins.push(nested, prefixerPlugin);
    }

    // wrap all the CSS in a parent class
    const result = postcss(plugins).process(formatted, {
        from: undefined,
    });

    return result.css;
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
function sortCss(css: string): Root {
    const rootSelectors: Rule[] = [];
    const starSelectors: Rule[] = [];
    const baseSelectors: Rule[] = [];
    const pseudo: Rule[] = [];
    const tags: Rule[] = [];
    const classes: Rule[] = [];
    const atrules: AtRule[] = [];

    const combinedParsed = postcss.parse(css);

    combinedParsed.walkRules((rule) => {
        // skip rules inside of @media
        if (rule.parent?.type === 'atrule') {
            return;
        }

        if (rule.selector.startsWith('*')) {
            starSelectors.push(rule);
        } else if (rule.selector.startsWith(':root')) {
            rootSelectors.push(rule);
        } else if (rule.selector.startsWith('html') || rule.selector.startsWith('body')) {
            baseSelectors.push(rule);
        } else if (rule.selector.startsWith(':')) {
            pseudo.push(rule);
        } else if (rule.selector.startsWith('.')) {
            classes.push(rule);
        } else {
            tags.push(rule);
        }
    });

    // put the @ rules at the end
    combinedParsed.walkAtRules((atrule) => {
        atrules.push(atrule);
    });

    // combine the CSS back together
    const root = postcss.root();
    root.append(rootSelectors);
    root.append(starSelectors);
    root.append(baseSelectors);
    root.append(pseudo);
    root.append(tags);
    root.append(classes);
    root.append(atrules);

    return root;
}

export interface Options {
    /** The first CSS file contents. */
    css1: string;
    /** The second CSS file contents. */
    css2: string;
    /** The parent selector to wrap the combined CSS in. */
    parent?: string;
}
