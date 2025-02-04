import remarkMdx from "remark-mdx"
import remarkParse from "remark-parse"
import remarkStringify from "remark-stringify"
import { read } from "to-vfile"
import { UnistNode, UnistNodeWithData, UnistTree } from "types"
import { Plugin, Transformer, unified } from "unified"
import { SKIP } from "unist-util-visit"
import type { VFile } from "vfile"
import {
  parseCard,
  parseCardList,
  parseCodeTabs,
  parseDetails,
  parseNote,
  parsePrerequisites,
  parseSourceCodeLink,
  parseTable,
  parseTabs,
  parseTypeList,
  parseWorkflowDiagram,
} from "./utils/parse-elms.js"

const parseComponentsPlugin = (): Transformer => {
  return async (tree) => {
    const { visit } = await import("unist-util-visit")

    let pageTitle = ""

    visit(
      tree as UnistTree,
      ["mdxJsxFlowElement", "element", "mdxjsEsm", "heading"],
      (node: UnistNode, index, parent) => {
        if (typeof index !== "number" || !parent) {
          return
        }
        if (
          node.type === "mdxjsEsm" &&
          node.value?.startsWith("export const metadata = ") &&
          node.data &&
          "estree" in node.data
        ) {
          const regexMatch = /title: (?<title>.+),?/.exec(node.value)
          if (regexMatch?.groups?.title) {
            pageTitle = regexMatch.groups.title
              .replace(/,$/, "")
              .replaceAll(/\$\{.+\}/g, "")
              .replaceAll(/^['"`]/g, "")
              .replaceAll(/['"`]$/g, "")
              .trim()
          }
        }
        if (node.type === "heading") {
          if (
            node.depth === 1 &&
            node.children?.length &&
            node.children[0].value === "metadata.title"
          ) {
            node.children[0] = {
              type: "text",
              value: pageTitle,
            }
          }
          return
        }
        if (
          node.type === "mdxjsEsm" ||
          node.name === "Feedback" ||
          node.name === "ChildDocs" ||
          node.name === "DetailsList"
        ) {
          parent?.children.splice(index, 1)
          return [SKIP, index]
        }
        switch (node.name) {
          case "Card":
            return parseCard(node, index, parent)
          case "CardList":
            return parseCardList(node as UnistNodeWithData, index, parent)
          case "CodeTabs":
            return parseCodeTabs(node as UnistNodeWithData, index, parent)
          case "Details":
            return parseDetails(node as UnistNodeWithData, index, parent)
          case "Note":
            return parseNote(node, index, parent)
          case "Prerequisites":
            return parsePrerequisites(node as UnistNodeWithData, index, parent)
          case "SourceCodeLink":
            return parseSourceCodeLink(node as UnistNodeWithData, index, parent)
          case "Table":
            return parseTable(node as UnistNodeWithData, index, parent)
          case "Tabs":
            return parseTabs(node as UnistNodeWithData, index, parent)
          case "TypeList":
            return parseTypeList(node as UnistNodeWithData, index, parent)
          case "WorkflowDiagram":
            return parseWorkflowDiagram(
              node as UnistNodeWithData,
              index,
              parent
            )
        }
      }
    )
  }
}

const getParsedAsString = (file: VFile): string => {
  return file.toString().replaceAll(/^([\s]*)\* /gm, "$1- ")
}

export const getCleanMd = async (
  filePath: string,
  plugins?: {
    before?: Plugin[]
    after?: Plugin[]
  }
): Promise<string> => {
  if (!filePath.endsWith(".md") && !filePath.endsWith(".mdx")) {
    return ""
  }
  const unifier = unified().use(remarkParse).use(remarkMdx).use(remarkStringify)

  plugins?.before?.forEach((plugin) => {
    unifier.use(...(Array.isArray(plugin) ? plugin : [plugin]))
  })

  unifier.use(parseComponentsPlugin)

  plugins?.after?.forEach((plugin) => {
    unifier.use(...(Array.isArray(plugin) ? plugin : [plugin]))
  })

  const parsed = await unifier.process(await read(filePath))

  return getParsedAsString(parsed)
}
