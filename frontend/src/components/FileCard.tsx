import { formatFileSize } from '../utils/format'
import styles from './FileCard.module.css'

interface Props {
  url: string
  fileName: string
  mediaType: string
  fileSize?: number
}

function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf': return '📄'
    case 'zip': case 'rar': case '7z': return '🗜'
    case 'docx': case 'doc': return '📝'
    case 'txt': return '📃'
    default: return '📎'
  }
}

export default function FileCard({ url, fileName, fileSize }: Props) {
  const sizeLabel = formatFileSize(fileSize)

  return (
    <a href={url} download={fileName} className={styles.card}>
      <span className={styles.icon}>{getFileIcon(fileName)}</span>
      <div className={styles.info}>
        <span className={styles.name}>{fileName}</span>
        {sizeLabel && <span className={styles.size}>{sizeLabel}</span>}
      </div>
      <span className={styles.downloadIcon} aria-hidden>↓</span>
    </a>
  )
}
