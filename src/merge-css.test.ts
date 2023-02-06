import { combineUniqueCss } from './merge-css';
import postcss from 'postcss';
import prettier from 'prettier';

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
        combineUniqueCss({ css1, css2 }).then(result => {
            const actual = cleanCss(result);
            const expected = cleanCss`
                .a {
                    color: red;
                }
                .b {
                    color: blue;
                }
            `
            expect(actual).toBe(expected);
        });
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
            .b {
                color: blue;
            }
        `;
        combineUniqueCss({ css1, css2 }).then(result => {
            const actual = cleanCss(result);
            const expected = cleanCss`
                .a {
                    color: red;
                }
                .b {
                    color: blue;
                }
            `
            expect(actual).toBe(expected);
        });
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
        combineUniqueCss({ css1, css2, parent: '.parent' }).then(result => {
            const actual = cleanCss(result);
            const expected = cleanCss`
                .parent .a {
                    color: red;
                }
                .parent .b {
                    color: blue;
                }
            `
            expect(actual).toBe(expected);
        });
    });

    it('should combine two CSS files with a parent and media queries', () => {
        const css1 = `
            .a {
                color: red;
            }
        `;
        const css2 = `
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
        `;
        combineUniqueCss({ css1, css2, parent: '.parent' }).then(result => {
            const actual = cleanCss(result);
            const expected = cleanCss`
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
            `
            expect(actual).toBe(expected);
        });
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
        combineUniqueCss({ css1, css2, parent: '.parent' }).then(result => {
            const actual = cleanCss(result);
            const expected = cleanCss`
                .parent .a {
                    color: red;
                }
                .parent .b {
                    color: blue;
                }
                @keyframes fade {
                    0% {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
            `
            expect(actual).toBe(expected);
        });
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
        combineUniqueCss({ css1, css2, parent: '.parent' }).then(result => {
            const actual = cleanCss(result);
            console.log('actual');
            console.log(actual);
            const expected = cleanCss`
                .parent :root {
                    --color: black;
                }
                .parent * {
                    box-sizing: content-box;
                }
                .parent :after,
                .parent :before {
                    content: "";
                }
                .parent h1 {
                    color: black;
                }
                .parent .a {
                    color: red;
                }
                .parent .b,
                .parent .c {
                    color: blue;
                }
                @media (min-width: 768px) {
                    .parent .a,
                    .parent .b {
                        color: green;
                    }
                }
            `
            expect(actual).toBe(expected);
        });
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
    // format with prettier
    return prettier.format(parsed.toString(), { parser: 'css' })
}
