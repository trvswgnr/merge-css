// @ts-check
import { describe, expect, it } from '@jest/globals';
import { combine } from './combine-unique-css.js';
import * as postcss from 'postcss';

describe('combine', () => {
    it('should combine two CSS files', () => {
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

        const combined = combine({ css1, css2 });

        expect(cleanCss(combined)).toBe(cleanCss`
            .a {
                color: red;
            }

            .b {
                color: blue;
            }
        `);
    });

    it('should combine two CSS files with a parent class', () => {
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

        const combined = combine({ css1, css2, parent: '.parent' });

        expect(combined).toBe(`
            .parent .a {
                color: red;
            }

            .parent .b {
                color: blue;
            }
        `);
    });

    it('should combine two CSS files with a parent class and remove the parent class from the selectors', () => {
        const css1 = `
            .parent .a {
                color: red;
            }
        `;

        const css2 = `
            .b {
                color: blue;
            }
        `;

        const combined = combine({ css1, css2, parent: '.parent' });

        expect(combined).toBe(cleanCss`
            .parent .a {
                color: red;
            }

            .parent .b {
                color: blue;
            }
        `);
    });
});

/**
 * Normalize a CSS string by parsing, removing all raws, and converting back to string.
 *
 * @template T
 * @param {T extends TemplateStringsArray ? T : string} input
 * @returns {string} The cleaned CSS as a string
 * @example
 * const cleaned = css`
 *  .test-class-1   {
 *
 *   background: blue
 *      }`
 * @example
 * const cleaned = cleanCss('.test-class-1 { background: blue; }')
 */
function cleanCss (input) {
  const css = Array.isArray(input) ? input.join('') : String(input)
  const parsed = postcss.parse(css)
  parsed.cleanRaws()
  return parsed.toString()
}
