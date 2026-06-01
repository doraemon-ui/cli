import cssbeautify from 'cssbeautify'
import csstree from 'css-tree'
import type { Atrule, CssNode, Declaration, ListItem } from 'css-tree'

export interface ConvertCssVarsOptions {
  bodyNode: string
  rootNode: string
  // Whether to inject literal fallback declarations before `var(...)` declarations.
  generateFallback?: boolean
}

interface ColorMapValue {
  value: string
  type?: string
}

/**
 * Convert CSS custom-property usage into a dual declaration:
 * keep the original `var(...)` declaration, and inject a resolved fallback
 * declaration before it for miniprogram runtimes that don't fully support CSS vars.
 *
 * Example:
 * `font-size: var(--font-size);`
 * becomes:
 * `font-size: 14px;`
 * `font-size: var(--font-size);`
 */
export function convertCssVars(
  css: string,
  options: ConvertCssVarsOptions = { bodyNode: 'page', rootNode: 'root', generateFallback: true },
): string {
  const normalizedOptions: Required<ConvertCssVarsOptions> = {
    bodyNode: options.bodyNode,
    rootNode: options.rootNode,
    generateFallback: options.generateFallback ?? true,
  }
  const colorMap: Record<string, ColorMapValue> = {}
  const blockVarMap: Record<string, Record<string, string>> = {}
  const ast = csstree.parse(css)

  // Parse one `var(...)` call and split it into:
  // 1. the custom property name, e.g. `--font-size`
  // 2. the inline fallback, e.g. `14px`
  // This is the base unit used by the whole conversion process.
  const parseVarFunction = (value: string): { name: string; fallback?: string } | null => {
    const matches = value.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/)
    if (!matches) return null

    return {
      name: matches[1],
      fallback: matches[2]?.trim(),
    }
  }

  // Find every `var(...)` call inside a declaration/value AST.
  // For example, `background: var(--bg, #fff)` becomes one record with:
  // - source: `var(--bg, #fff)`
  // - name: `--bg`
  // - fallback: `#fff`
  const collectVarFunctions = (astNode: CssNode): Array<{ source: string; name: string; fallback?: string }> => {
    const result: Array<{ source: string; name: string; fallback?: string }> = []

    csstree.walk(astNode, (node: CssNode) => {
      if (node.type === 'Function' && node.name === 'var') {
        const source = csstree.generate(node)
        const parsed = parseVarFunction(source)

        if (parsed) {
          result.push({
            source,
            name: parsed.name,
            fallback: parsed.fallback,
          })
        }
      }
    })

    return result
  }

  // Replace every `var(...)` call inside a plain CSS value string.
  // The replacer decides whether a given `var(...)` can be resolved into a literal fallback.
  const replaceVarFunctions = (
    value: string,
    replacer: (item: { source: string; name: string; fallback?: string }) => string | null,
  ): string => {
    let transformed = value
    const valueAst = csstree.parse(value, { context: 'value' })

    collectVarFunctions(valueAst).forEach((item) => {
      const replacement = replacer(item)
      if (replacement && replacement !== item.source) {
        transformed = transformed.split(item.source).join(replacement)
      }
    })

    return transformed
  }

  // Resolve a single custom property reference to a concrete value.
  //
  // Resolution order:
  // 1. variables defined in the current rule
  // 2. variables inherited from the component base block
  // 3. variables defined globally on `page` / `:root`
  // 4. inline fallback from `var(--token, fallback)`
  //
  // Example:
  // `var(--title-height)` -> `var(--dora-sticky-title-height, 44px)` -> `44px`
  const resolveVarReference = (
    name: string,
    fallback: string | undefined,
    localVarMap: Record<string, string>,
    resolving = new Set<string>(),
  ): string | null => {
    // Break cycles like `--a: var(--b)` + `--b: var(--a)` by falling back to the literal fallback branch.
    if (resolving.has(name)) {
      return fallback ? resolveValue(fallback, localVarMap, resolving) : null
    }

    if (localVarMap[name]) {
      const nextResolving = new Set(resolving)
      nextResolving.add(name)
      return resolveValue(localVarMap[name], localVarMap, nextResolving)
    }

    if (colorMap[name]) {
      const nextResolving = new Set(resolving)
      nextResolving.add(name)
      return resolveValue(colorMap[name].value.trim(), localVarMap, nextResolving)
    }

    return fallback ? resolveValue(fallback, localVarMap, resolving) : null
  }

  // Resolve nested `var(...)` calls inside a value until we get a plain literal value.
  // Example:
  // `var(--title-background-color)`
  // -> `var(--dora-sticky-title-background-color, var(--dora-color-step-10, #e6e6e6))`
  // -> `#e6e6e6`
  const resolveValue = (
    value: string,
    localVarMap: Record<string, string>,
    resolving = new Set<string>(),
  ): string => {
    return replaceVarFunctions(value, ({ name, fallback }) => resolveVarReference(name, fallback, localVarMap, resolving))
  }

  const checkIsDarkRule = (atrule: Atrule | null): boolean => {
    let isDark = false
    if (!atrule) return false
    csstree.walk(atrule, {
      visit: 'Feature' as never,
      enter(node) {
        if (node.name === 'prefers-color-scheme' && node.value && node.value.type === 'Identifier' && node.value.name === 'dark') {
          isDark = true
        }
      },
    })
    return isDark
  }

  // Check whether the selector contains the configured root selector,
  // usually `page` or `:root`.
  const checkIsRootTag = (astNode: CssNode | null | undefined, opts: ConvertCssVarsOptions): boolean => {
    let isRoot = false
    if (!astNode) return false
    csstree.walk(astNode, {
      enter(node: CssNode) {
        if (
          (node.type === 'TypeSelector' && node.name === opts.bodyNode) ||
          (node.type === 'PseudoClassSelector' && node.name === opts.rootNode)
        ) {
          isRoot = true
        }
      },
    })
    return isRoot
  }

  // Only treat a selector as a "plain root variable definition" when the selector
  // is exactly the root node itself, not when root is mixed with other selectors.
  const checkIsSingleRoot = (astNode: CssNode | null | undefined, opts: ConvertCssVarsOptions): boolean => {
    let isSingle = false
    if (!astNode) return false
    csstree.walk(astNode, {
      enter(node: CssNode, item: ListItem<CssNode>) {
        if (
          (node.type === 'TypeSelector' && node.name === opts.bodyNode) ||
          (node.type === 'PseudoClassSelector' && node.name === opts.rootNode)
        ) {
          if (!item.prev && !item.next) {
            isSingle = true
          }
        }
      },
    })
    return isSingle
  }

  // Extract related block names from a selector so element/modifier selectors
  // can inherit variables from their base block.
  // Example:
  // `.dora-sticky__title` -> `dora-sticky`
  // `.dora-sticky--fixed .dora-sticky__title` -> `dora-sticky`
  const getRuleBlockNames = (astNode: CssNode | null | undefined): string[] => {
    const names: string[] = []

    if (!astNode) return names

    csstree.walk(astNode, (node: CssNode) => {
      if (node.type === 'ClassSelector') {
        const blockName = node.name.replace(/(__|--).+$/, '')
        if (blockName && !names.includes(blockName)) {
          names.push(blockName)
        }
      }
    })

    return names
  }

  // Only selectors that are exactly a base block, like `.dora-sticky-item`,
  // are used as variable providers for the block inheritance map.
  const getBaseBlockName = (astNode: CssNode | null | undefined): string | null => {
    if (!astNode) return null

    const selector = csstree.generate(astNode).trim()
    const match = selector.match(/^\.(?<name>[\w-]+)$/)
    if (!match?.groups?.name) return null

    const blockName = match.groups.name.replace(/(__|--).+$/, '')
    return blockName === match.groups.name ? blockName : null
  }

  const hasPriorDeclaration = (ruleNode: CssNode, currentItem: ListItem<CssNode>, declaration: string): boolean => {
    if (ruleNode.type !== 'Rule') return false

    // Avoid inserting the same fallback twice when source CSS already contains a manual backup declaration.
    let cursor = currentItem.prev
    while (cursor) {
      if (cursor.data.type === 'Declaration' && csstree.generate(cursor.data) === declaration) {
        return true
      }
      cursor = cursor.prev
    }

    return false
  }

  // First pass:
  // collect global variables from `page` / `:root`.
  // These are shared design tokens such as color steps and spacing scales.
  csstree.walk(ast, {
    visit: 'Declaration',
    enter(this: csstree.WalkContext, node: Declaration) {
      if (node.property && /^--/.test(node.property)) {
        const isMediaDark = checkIsDarkRule(this.atrule as Atrule | null)
        const isRootTag = checkIsRootTag(this.rule?.prelude, normalizedOptions)
        const isSingle = checkIsSingleRoot(this.rule?.prelude, normalizedOptions)

        if (isMediaDark && isRootTag) {
          colorMap[`${node.property}_dark`] = { value: csstree.generate(node.value) }
        } else if (!isMediaDark && isSingle) {
          colorMap[node.property] = { value: csstree.generate(node.value) }
        }
      }
    },
  })

  // Second pass:
  // collect variables declared directly on the component base block,
  // e.g. `.dora-sticky-item { --title-height: ... }`.
  // Later, `.dora-sticky-item__hd` and `.dora-sticky-item--fixed` can reuse them.
  csstree.walk(ast, (node: CssNode) => {
    if (node.type !== 'Rule') return

    const baseBlockName = getBaseBlockName(node.prelude)
    if (!baseBlockName) return

    const vars = blockVarMap[baseBlockName] || {}
    node.block.children.forEach((child) => {
      if (child.type === 'Declaration' && child.property && /^--/.test(child.property)) {
        vars[child.property] = csstree.generate(child.value).trim()
      }
    })
    blockVarMap[baseBlockName] = vars
  })

  // Third pass:
  // walk real style declarations and inject a literal fallback declaration
  // immediately before the original CSS variable declaration.
  // When `generateFallback` is false, this pass is skipped and the original CSS is preserved.
  //
  // Example:
  // `height: var(--title-height);`
  // becomes:
  // `height: 44px;`
  // `height: var(--title-height);`
  if (normalizedOptions.generateFallback) {
    csstree.walk(ast, (node: CssNode) => {
      if (node.type === 'Rule') {
        const inheritedVarMap: Record<string, string> = {}
        getRuleBlockNames(node.prelude).forEach((blockName) => {
          Object.assign(inheritedVarMap, blockVarMap[blockName] || {})
        })

        // `localVarMap` contains all variables visible to the current rule:
        // inherited block variables first, then variables declared inside this rule.
        const localVarMap: Record<string, string> = { ...inheritedVarMap }

        node.block.children.forEach((child) => {
          if (child.type === 'Declaration' && child.property && /^--/.test(child.property)) {
            localVarMap[child.property] = csstree.generate(child.value).trim()
          }
        })

        node.block.children.forEach((child, item) => {
          if (child.type !== 'Declaration' || !child.property || /^--/.test(child.property)) {
            return
          }

          const varFunctions = collectVarFunctions(child)
          if (!varFunctions.length) {
            return
          }

          const cssStyle = csstree.generate(child)
          let fallbackStyle = cssStyle

          varFunctions.forEach(({ source, name, fallback }) => {
            const replacement = resolveVarReference(name, fallback, localVarMap)
            if (replacement && replacement !== source) {
              fallbackStyle = fallbackStyle.split(source).join(replacement)
            }
          })

          if (fallbackStyle !== cssStyle && !hasPriorDeclaration(node, item, fallbackStyle)) {
            const rule: ListItem<CssNode> = {
              prev: null,
              next: null,
              data: csstree.parse(fallbackStyle, { context: 'declaration' }),
            }
            node.block.children.insert(rule, item)
          }
        })
      }
    })
  }

  return cssbeautify(csstree.generate(ast), {
    indent: '  ',
    openbrace: 'end-of-line',
    autosemicolon: true,
  })
}
