import postcss from 'postcss'
import type { Root, Rule, AtRule, ChildNode } from 'postcss'

type CssNode = Root | Rule | AtRule | ChildNode

/**
 * Given two CSS strings, creates a new CSS string with only the CSS that is unique to the target file
 * @param targetCss - The target CSS that we want to keep the unique rules from
 * @param otherCss - The other CSS that should be compared against the target
 * @returns The CSS output with only unique rules from the target
 */
function uniqueCss (targetCss: string, otherCss: string): string {
  const target = postcss.parse(targetCss)
  const other = postcss.parse(otherCss)
  target.cleanRaws()
  other.cleanRaws()

  const uniqueNodes = getUniqueNodes(target, other)
  target.nodes = uniqueNodes

  return target.toString().replace(/\}@/g, '}\n@')
}

/**
 * Recursively get the unique nodes from two parent nodes
 * @param targetParentNode - The target parent node
 * @param otherParentNode - The other parent node
 * @returns The unique nodes
 */
function getUniqueNodes (targetParentNode: CssNode, otherParentNode: CssNode): ChildNode[] {
  const uniqueNodes: ChildNode[] = []

  if (!('nodes' in targetParentNode)) {
    return uniqueNodes
  }

  for (const targetNode of targetParentNode.nodes) {
    if (targetNode.type === 'atrule') {
      const alwaysInclude = ['charset', 'namespace']

      if (!('nodes' in otherParentNode) || alwaysInclude.includes(targetNode.name)) {
        uniqueNodes.push(targetNode)
        continue
      }

      const otherNodes = otherParentNode.nodes.filter(node => {
        return node.type === 'atrule' && node.params === targetNode.params
      })

      let otherNode = null

      if (otherNodes.length === 1) {
        otherNode = otherNodes[0]
      }

      // if more than one media query is the same, then try
      // to find a media query with the most matching rules
      let mostMatchingRules = 0
      if (otherNodes.length > 1) {
        for (const oNode of otherNodes) {
          if (!('nodes' in targetNode)) {
            continue
          }

          for (const rule of targetNode.nodes) {
            if (rule.type !== 'rule' || !('nodes' in oNode)) {
              continue
            }

            const otherRules = oNode.nodes.filter(node => {
              return node.type === 'rule' && node.selector === rule.selector
            })

            if (otherRules.length > mostMatchingRules) {
              otherNode = oNode
              mostMatchingRules = otherRules.length
            }
          }
        }
      }

      if (otherNode) {
        const uniqueRules = getUniqueNodes(targetNode, otherNode)

        if ('length' in uniqueRules && uniqueRules.length > 0) {
          const uniqueNode = targetNode.clone()
          uniqueNode.nodes = uniqueRules
          uniqueNodes.push(uniqueNode)
        }
      } else {
        uniqueNodes.push(targetNode)
      }
    } else if (targetNode.type === 'rule') {
      if (!('nodes' in otherParentNode)) {
        uniqueNodes.push(targetNode)
        continue
      }

      const otherNode = otherParentNode.nodes.find(node => {
        return node.type === 'rule' && node.selector === targetNode.selector
      })

      let declarationDiffs = 0

      if (otherNode) {
        // if theyre exactly the same, skip it
        if (targetNode.toString() === otherNode.toString()) {
          continue
        }

        for (const targetDeclaration of targetNode.nodes) {
          if (targetDeclaration.type === 'decl') {
            if (!('nodes' in otherNode)) {
              declarationDiffs++
              continue
            }

            const otherDeclaration = otherNode.nodes.find(node => {
              return node.type === 'decl' && node.prop === targetDeclaration.prop
            })

            if (!otherDeclaration || !('value' in otherDeclaration) || otherDeclaration.value !== targetDeclaration.value) {
              declarationDiffs++
            }
          }
        }
      }

      if (!otherNode || declarationDiffs > 0) {
        uniqueNodes.push(targetNode)
      }
    }
  }

  return uniqueNodes
}

export default uniqueCss
