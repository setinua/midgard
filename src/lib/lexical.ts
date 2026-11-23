// Extracts plain text from a Lexical rich text value (for search and descriptions).
export function lexicalToText(value: unknown): string {
  const out: string[] = []
  const walk = (node: any) => {
    if (!node) return
    if (typeof node.text === 'string') out.push(node.text)
    if (Array.isArray(node.children)) {
      node.children.forEach(walk)
      if (['paragraph', 'heading', 'quote', 'listitem'].includes(node.type)) out.push('\n')
    }
  }
  walk((value as any)?.root)
  return out.join('').replace(/\n{2,}/g, '\n').trim()
}
