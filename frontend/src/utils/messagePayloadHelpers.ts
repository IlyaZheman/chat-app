import type { MessagePayload } from '../types'

export function previewPayload(p: MessagePayload | undefined): string {
  if (!p) return ''
  if (p.type === 'text') return p.text
  if (p.type === 'image') return p.caption ? `${p.caption}` : 'Изображение'
  return `📎 ${p.fileName ?? 'Файл'}`
}

export function payloadsMatch(a: MessagePayload, b: MessagePayload): boolean {
  if (a.type !== b.type) return false
  if (a.type === 'text' && b.type === 'text') return a.text === b.text
  if (a.type === 'image' && b.type === 'image') return a.url === b.url
  if (a.type === 'file' && b.type === 'file') return a.url === b.url
  return false
}
