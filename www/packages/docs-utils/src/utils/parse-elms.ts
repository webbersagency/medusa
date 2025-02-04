import { ExpressionJsVar, UnistNode, UnistNodeWithData, UnistTree } from "types"
import { SKIP, VisitorResult } from "unist-util-visit"
import { estreeToJs } from "../estree-to-js.js"
import {
  isExpressionJsVarLiteral,
  isExpressionJsVarObj,
} from "../expression-is-utils.js"

export const parseCard = (
  node: UnistNode,
  index: number,
  parent: UnistTree
): VisitorResult => {
  let title: string | undefined,
    text: string | undefined,
    href: string | undefined
  node.attributes?.some((attr) => {
    if (title && text && href) {
      return true
    }
    if (attr.name === "title") {
      title = attr.value as string
    } else if (attr.name === "text") {
      text = attr.value as string
    } else if (attr.name === "href") {
      href = attr.value as string
    }
    return false
  })
  if (!title || !href) {
    return
  }
  parent?.children.splice(index, 1, {
    type: "paragraph",
    children: [
      {
        type: "link",
        url: href,
        children: [
          {
            type: "text",
            value: title,
          },
        ],
      },
      {
        type: "text",
        value: `: ${text}`,
      },
    ],
  })
  return [SKIP, index]
}

export const parseCardList = (
  node: UnistNodeWithData,
  index: number,
  parent: UnistTree
): VisitorResult => {
  const items = node.attributes?.find((attr) => attr.name === "items")
  if (!items || typeof items.value === "string" || !items.value.data?.estree) {
    return
  }

  const itemsJsVar = estreeToJs(items.value.data.estree)

  if (!itemsJsVar || !Array.isArray(itemsJsVar)) {
    return
  }

  const listItems = itemsJsVar
    .map((item) => {
      if (
        !isExpressionJsVarObj(item) ||
        !("text" in item) ||
        !("link" in item) ||
        !isExpressionJsVarLiteral(item.text) ||
        !isExpressionJsVarLiteral(item.link)
      ) {
        return null
      }
      return {
        type: "listItem",
        children: [
          {
            type: "paragraph",
            children: [
              {
                type: "link",
                url: `#${item.link.data}`,
                children: [
                  {
                    type: "text",
                    value: item.text.data,
                  },
                ],
              },
            ],
          },
        ],
      }
    })
    .filter(Boolean) as UnistNode[]

  parent?.children.splice(index, 1, {
    type: "list",
    ordered: false,
    spread: false,
    children: listItems,
  })
  return [SKIP, index]
}

export const parseCodeTabs = (
  node: UnistNodeWithData,
  index: number,
  parent: UnistTree
): VisitorResult => {
  const tabs = node.children?.filter((child) => child.name === "CodeTab")
  if (!tabs) {
    return
  }

  const children: UnistNode[] = []

  tabs.forEach((tab) => {
    const label = tab.attributes?.find((attr) => attr.name === "label")
    const code = tab.children?.find((child) => child.type === "code")

    if (!label || !code) {
      return
    }

    children.push({
      type: "mdxJsxFlowElement",
      name: "details",
      children: [
        {
          type: "mdxJsxFlowElement",
          name: "summary",
          children: [
            {
              type: "text",
              value: (label.value as string) || "summary",
            },
          ],
        },
        code,
      ],
    })
  })

  parent?.children.splice(index, 1, ...children)
  return [SKIP, index]
}

export const parseDetails = (
  node: UnistNodeWithData,
  index: number,
  parent: UnistTree
): VisitorResult => {
  const summary = node.attributes?.find(
    (attr) => attr.name === "summaryContent"
  )

  parent?.children.splice(index, 1, {
    type: "mdxJsxFlowElement",
    name: "details",
    children: [
      {
        type: "mdxJsxFlowElement",
        name: "summary",
        children: [
          {
            type: "text",
            value: (summary?.value as string) || "Details",
          },
        ],
      },
      ...(node.children || []),
    ],
  })
  return [SKIP, index]
}

export const parseNote = (
  node: UnistNode,
  index: number,
  parent: UnistTree
): VisitorResult => {
  parent.children?.splice(index, 1, ...(node.children || []))
  return [SKIP, index]
}

export const parsePrerequisites = (
  node: UnistNodeWithData,
  index: number,
  parent: UnistTree
): VisitorResult => {
  const items = node.attributes?.find((attr) => attr.name === "items")
  if (!items || typeof items.value === "string" || !items.value.data?.estree) {
    return
  }

  const itemsJsVar = estreeToJs(items.value.data.estree)

  if (!itemsJsVar || !Array.isArray(itemsJsVar)) {
    return
  }

  const listItems = itemsJsVar
    .map((item) => {
      if (
        !isExpressionJsVarObj(item) ||
        !("text" in item) ||
        !("link" in item) ||
        !isExpressionJsVarLiteral(item.text) ||
        !isExpressionJsVarLiteral(item.link)
      ) {
        return null
      }
      return {
        type: "listItem",
        children: [
          {
            type: "paragraph",
            children: [
              {
                type: "link",
                url: `${item.link.data}`,
                children: [
                  {
                    type: "text",
                    value: item.text.data,
                  },
                ],
              },
            ],
          },
        ],
      }
    })
    .filter(Boolean) as UnistNode[]

  parent?.children.splice(
    index,
    1,
    {
      type: "heading",
      depth: 3,
      children: [
        {
          type: "text",
          value: "Prerequisites",
        },
      ],
    },
    {
      type: "list",
      ordered: false,
      spread: false,
      children: listItems,
    }
  )
  return [SKIP, index]
}

export const parseSourceCodeLink = (
  node: UnistNodeWithData,
  index: number,
  parent: UnistTree
): VisitorResult => {
  const link = node.attributes?.find((attr) => attr.name === "link")
  if (!link) {
    return
  }

  parent?.children.splice(index, 1, {
    type: "paragraph",
    children: [
      {
        type: "link",
        url: link?.value as string,
        children: [
          {
            type: "text",
            value: "Source code",
          },
        ],
      },
    ],
  })
  return [SKIP, index]
}

export const parseTable = (
  node: UnistNodeWithData,
  index: number,
  parent: UnistTree
): VisitorResult => {
  const headerNode = node.children?.find(
    (child) => child.name === "Table.Header"
  )
  const bodyNode = node.children?.find((child) => child.name === "Table.Body")

  let nodeText = ``
  let headerCellsCount = 0

  headerNode?.children?.forEach((headerRow, rowIndex) => {
    if (rowIndex > 0) {
      nodeText += `\n`
    }
    const childCells =
      headerRow.children?.length === 1 &&
      headerRow.children[0].type === "paragraph"
        ? headerRow.children[0].children
        : headerRow.children
    headerCellsCount = childCells?.length || 0
    childCells?.forEach((headerCell) => {
      if (headerCell.name !== "Table.HeaderCell") {
        return
      }
      nodeText += `|`
      nodeText += formatNodeText(getTextNode(headerCell))
    })
    nodeText += `|`
  })

  nodeText += `\n|${new Array(headerCellsCount).fill(`---`).join(`|`)}|`

  bodyNode?.children?.forEach((bodyRow) => {
    nodeText += `\n`
    bodyRow.children?.forEach((bodyCell) => {
      nodeText += `|`
      nodeText += formatNodeText(getTextNode(bodyCell))
    })
    nodeText += `|`
  })

  parent.children?.splice(index, 1, {
    type: "paragraph",
    children: [
      {
        type: "text",
        value: nodeText,
      },
    ],
  })
}

export const parseTabs = (
  node: UnistNodeWithData,
  index: number,
  parent: UnistTree
): VisitorResult => {
  if ((node.children?.length || 0) < 2) {
    return
  }

  const tabs: UnistNode[] = []

  node.children![0].children?.forEach((tabList) => {
    tabList.children?.forEach((tabTrigger, index) => {
      const tabContentNode = node.children?.[1].children?.[index]
      const tabLabel = formatNodeText(getTextNode(tabTrigger))
      const tabContent = tabContentNode?.children || []
      if (!tabLabel || !tabContent) {
        return
      }

      tabs.push({
        type: "mdxJsxFlowElement",
        name: "details",
        children: [
          {
            type: "mdxJsxFlowElement",
            name: "summary",
            children: [
              {
                type: "text",
                value: tabLabel,
              },
            ],
          },
          ...tabContent,
        ],
      })
    })
  })

  parent.children?.splice(index, 1, ...tabs)
  return [SKIP, index]
}

export const parseTypeList = (
  node: UnistNodeWithData,
  index: number,
  parent: UnistTree
): VisitorResult => {
  const types = node.attributes?.find((attr) => attr.name === "types")
  if (!types || typeof types.value === "string" || !types.value.data?.estree) {
    return
  }

  const typesJsVar = estreeToJs(types.value.data.estree)

  if (!typesJsVar || !Array.isArray(typesJsVar)) {
    return
  }

  const generateTypeListItems = (
    typesJsVar: ExpressionJsVar[]
  ): UnistNode[] => {
    const listItems: UnistNode[] = []

    typesJsVar.forEach((item) => {
      if (!isExpressionJsVarObj(item)) {
        return
      }

      const typeName = isExpressionJsVarLiteral(item.name) ? item.name.data : ""
      const itemType = isExpressionJsVarLiteral(item.type) ? item.type.data : ""
      const itemDescription = isExpressionJsVarLiteral(item.description)
        ? item.description.data
        : ""

      if (!typeName || !itemType) {
        return
      }

      const itemListChildren = item.children || []
      const children: UnistNode[] = [
        {
          type: "paragraph",
          children: [
            {
              type: "text",
              value: `${typeName}: (${itemType}) ${itemDescription}`,
            },
          ],
        },
      ]

      if (Array.isArray(itemListChildren) && itemListChildren.length) {
        children.push(...generateTypeListItems(itemListChildren))
      }

      listItems.push({
        type: "listItem",
        children,
      })
    })

    return listItems
  }

  const listItems = generateTypeListItems(typesJsVar)

  parent?.children.splice(index, 1, {
    type: "list",
    ordered: false,
    spread: false,
    children: listItems,
  })
  return [SKIP, index]
}

export const parseWorkflowDiagram = (
  node: UnistNodeWithData,
  index: number,
  parent: UnistTree
): VisitorResult => {
  const worflowItems = node.attributes?.find((attr) => attr.name === "workflow")
  if (
    !worflowItems ||
    typeof worflowItems.value === "string" ||
    !worflowItems.value.data?.estree
  ) {
    return
  }

  const workflowJsVar = estreeToJs(worflowItems.value.data.estree)

  if (
    !isExpressionJsVarObj(workflowJsVar) ||
    !("steps" in workflowJsVar) ||
    !Array.isArray(workflowJsVar.steps)
  ) {
    return
  }

  const generateWorkflowItems = (
    jsVarItems: ExpressionJsVar[]
  ): UnistNode[] => {
    const listItems: UnistNode[] = []

    jsVarItems.forEach((item) => {
      if (!isExpressionJsVarObj(item)) {
        return
      }

      const stepName = isExpressionJsVarLiteral(item.name) ? item.name.data : ""
      const stepDescription = isExpressionJsVarLiteral(item.description)
        ? item.description.data
        : ""
      const stepLink = isExpressionJsVarLiteral(item.link)
        ? (item.link.data as string)
        : `#${stepName}`

      if (!stepName) {
        return
      }

      const stepChildren = item.steps || []
      const children: UnistNode[] = [
        {
          type: "paragraph",
          children: [
            {
              type: "link",
              url: stepLink,
              children: [
                {
                  type: "text",
                  value: `${stepName}`,
                },
              ],
            },
            {
              type: "text",
              value: `: ${stepDescription}`,
            },
          ],
        },
      ]

      if (Array.isArray(stepChildren) && stepChildren.length) {
        children.push(...generateWorkflowItems(stepChildren))
      }

      listItems.push({
        type: "listItem",
        children,
      })
    })

    return listItems
  }

  const listItems = generateWorkflowItems(workflowJsVar.steps)

  parent?.children.splice(index, 1, {
    type: "list",
    ordered: false,
    spread: false,
    children: listItems,
  })
  return [SKIP, index]
}

/**
 * Helpers
 */
const getTextNode = (node: UnistNode): UnistNode | undefined => {
  let textNode: UnistNode | undefined
  node.children?.some((child) => {
    if (textNode) {
      return true
    }
    if (child.type === "text") {
      textNode = child
    } else if (child.type === "paragraph") {
      textNode = getTextNode(child)
    } else if (child.value) {
      textNode = child
    }

    return false
  })

  return textNode
}

const formatNodeText = (node?: UnistNode): string => {
  if (!node) {
    return ""
  }
  if (node.type === "inlineCode") {
    return `\`${node.value}\``
  } else if (node.type === "code") {
    return `\`\`\`${"lang" in node ? node.lang : "ts"}\n${node.value}\n\`\`\``
  } else if (node.type === "link") {
    return `[${node.children?.[0].value}](${node.url})`
  }

  return node.value || ""
}
