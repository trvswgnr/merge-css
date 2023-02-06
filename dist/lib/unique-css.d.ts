import type { Root, Rule, AtRule, ChildNode } from 'postcss';
export type CssNode = Root | Rule | AtRule | ChildNode;
/**
 * Given two CSS strings, creates a new CSS string with only the CSS that is unique to the target file
 * @param targetCss - The target CSS that we want to keep the unique rules from
 * @param otherCss - The other CSS that should be compared against the target
 * @returns The CSS output with only unique rules from the target
 */
export declare function uniqueCss(targetCss: string, otherCss: string): string;
/**
 * Recursively get the unique nodes from two parent nodes
 * @param targetParentNode - The target parent node
 * @param otherParentNode - The other parent node
 * @returns The unique nodes
 */
export declare function getUniqueNodes(targetParentNode: CssNode, otherParentNode: CssNode): ChildNode[];
export default uniqueCss;
//# sourceMappingURL=unique-css.d.ts.map