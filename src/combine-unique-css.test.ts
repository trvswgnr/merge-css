import { combineUniqueCss } from './combine-unique-css';
import postcss from 'postcss';

describe('combineUniqueCss', () => {
    it('should combine two basic CSS files', () => {
        const css1 = `
            .a {
                color: red;
            }
        `;
        const css2 = `
            .b {
                color: blue;
            }
        `;
        const result = combineUniqueCss({ css1, css2 });
        expect(cleanCss(result)).toBe(cleanCss`
            .a {
                color: red;
            }
            .b {
                color: blue;
            }
        `);
    });

    it('should combine two CSS files with overlapping', () => {
        const css1 = `
            .a {
                color: red;
            }
        `;
        const css2 = `
            .a {
                color: red;
            }
        `;
        const result = combineUniqueCss({ css1, css2 });
        expect(cleanCss(result)).toBe(cleanCss`
            .a {
                color: red;
            }
        `);
    });

    it('should combine two CSS files with a parent', () => {
        const css1 = `
            .a {
                color: red;
            }
        `;
        const css2 = `
            .parent .b {
                color: blue;
            }
        `;
        const result = combineUniqueCss({ css1, css2, parent: '.parent' });
        expect(cleanCss(result)).toBe(cleanCss`
            .parent .a {
                color: red;
            }
            .parent .b {
                color: blue;
            }
        `);
    });

    it('should combine two CSS files with a parent and media queries', () => {
        const css1 = `
            .a {
                color: red;
            }
        `;
        const css2 = `
            .parent .b {
                color: blue;
            }
            @media (min-width: 768px) {
                .parent .b {
                    color: green;
                }
            }
        `;
        const result = combineUniqueCss({ css1, css2, parent: '.parent' });
        expect(cleanCss(result)).toBe(cleanCss`
            .parent .a {
                color: red;
            }
            .parent .b {
                color: blue;
            }
            @media (min-width: 768px) {
                .parent .b {
                    color: green;
                }
            }
        `);
    });

    it('should combine two CSS files with a parent and keyframes', () => {
        const css1 = `
            .a {
                color: red;
            }
        `;
        const css2 = `
            .parent .b {
                color: blue;
            }
            @keyframes fade {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
        `;
        const result = combineUniqueCss({ css1, css2, parent: '.parent' });
        expect(cleanCss(result)).toBe(cleanCss`
            .parent .a {
                color: red;
            }
            .parent .b {
                color: blue;
            }
            @keyframes fade {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
        `);
    });

    it('should combine two CSS files and be sorted properly (:root, *, tag, .class, @media, etc...)', () => {
        const css1 = `
            @media (min-width: 768px) {
                .a {
                    color: green;
                }
            }
            .a {
                color: red;
            }
            :root {
                --color: red;
            }
            .b {
                color: blue;
            }
            * {
                box-sizing: border-box;
            }
            ::before {
                content: '';
            }
            h1 {
                color: red;
            }
        `;
        const css2 = `
            .parent .c {
                color: blue;
            }
            @media (min-width: 768px) {
                .parent .b {
                    color: green;
                }
            }
            .parent .a {
                color: red;
            }
            .parent :root {
                --color: black;
            }
            .parent * {
                box-sizing: content-box;
            }
            .parent ::after {
                content: '';
            }
            .parent h1 {
                color: black;
            }
        `;
        const result = combineUniqueCss({ css1, css2, parent: '.parent' });
        const actual = cleanCss(result);
        console.log('actual', actual);
        expect(actual).toBe(cleanCss`
            .parent :root {
                --color: red;
            }
            .parent :root {
                --color: black;
            }
            .parent * {
                box-sizing: border-box;
            }
            .parent * {
                box-sizing: content-box;
            }
            .parent ::before {
                content: "";
            }
            .parent ::after {
                content: "";
            }
            .parent h1 {
                color: red;
            }
            .parent h1 {
                color: black;
            }
            .parent .a {
                color: red;
            }
            .parent .b {
                color: blue;
            }
            .parent .c {
                color: blue;
            }
            @media (min-width: 768px) {
                .parent .a {
                    color: green;
                }
            }
            @media (min-width: 768px) {
                .parent .b {
                    color: green;
                }
            }
        `)
    });
});

/**
 * Normalize a CSS string by parsing, removing all raws, and converting back to string.
 *
 * @param input The CSS to clean, either as a string or a template literal
 * @returns The cleaned CSS string
 * @example
 * const cleaned = css`
 *  .test-class-1   {
 *
 *   background: blue
 *      }`
 * @example
 * const cleaned = cleanCss('.test-class-1 { background: blue; }')
 */
function cleanCss<T>(input: T extends TemplateStringsArray ? T : string): string {
  const css = Array.isArray(input) ? input.join('') : String(input)
  const parsed = postcss.parse(css)
  parsed.cleanRaws()
  return parsed.toString()
}
