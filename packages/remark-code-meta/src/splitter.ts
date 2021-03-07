export default function splitter(str: string): string[] | null {
  return str.match(/(?:[^\s"']+|("|')[^"']*("|'))+/g)
}
