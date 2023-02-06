// @ts-check
import { writeFileSync } from 'fs';
import postcss from 'postcss';
import uniqueCss from './unique-css.cjs';
import { format } from 'prettier';
import nested from 'postcss-nested';
import prefixer from 'postcss-prefix-selector';

/**
 * Combine two CSS files, keeping only the unique CSS from each file,
 * sort the CSS, wrap it in a parent, then write it to a file.
 * @param {IOptions} options The options to use.
 * @returns {string} The combined CSS.
 */
function combine(options) {
    const v1 = options.css1;
    const v1Parsed = postcss.parse(v1);

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
    const v1Unique = uniqueCss(v1NoParent, v2);

    // get the unique CSS from v2 compared to v1
    const v2Unique = uniqueCss(v2, v1NoParent);

    const combined = v1Unique + '\n' + v2Unique;

    const sorted = sortCss(combined);

    // format the CSS with prettier
    const formatted = format(sorted.toString(), { parser: 'css' });

    /** @type {AcceptedPlugin[]} */
    let plugins = [];

    if (options.parent) {
        plugins = [
            nested,
            // @ts-ignore
            prefixer({
                prefix: options.parent,
                exclude: [options.parent],
            }),
        ];
    }


    // wrap all the CSS in a parent class
    const result = postcss(plugins).process(formatted, {
        from: undefined,
    });


    // write the CSS to a file, or the console if no output file is specified
    if (options.output) {
        writeFileSync(options.output, result.css);
        console.log(`Successfully combined CSS into ${options.output}`);
    } else {
        console.log(result.css);
    }

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
function sortCss(css) {
    const rootSelectors = [];
    const starSelectors = [];
    const baseSelectors = [];
    const pseudo = [];
    const tags = [];
    const classes = [];
    const atrules = [];

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

/**
 * @typedef IOptions
 * @property {string} css1 The first CSS file contents.
 * @property {string} css2 The second CSS file contents.
 * @property {string} [output] The output file to write the combined CSS to.
 * @property {string} [parent] The parent selector to wrap the combined CSS in.
 */

/** @typedef {import('postcss').AcceptedPlugin} AcceptedPlugin */

export {
    combine,
};
