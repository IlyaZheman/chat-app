import { useEffect } from 'react'
import { formatFileSize } from '../utils/format'
import styles from './ImageLightbox.module.css'

interface Props {
  url: string
  fileName: string
  fileSize?: number
  onClose: () => void
}

export default function ImageLightbox({ url, fileName, fileSize, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">×</button>
      <img
        src={url}
        alt={fileName}
        className={styles.image}
        onClick={e => e.stopPropagation()}
      />
      <div className={styles.toolbar} onClick={e => e.stopPropagation()}>
        <span className={styles.fileName}>{fileName}</span>
        {fileSize ? <span className={styles.fileSize}>{formatFileSize(fileSize)}</span> : null}
        <a href={url} download={fileName} className={styles.downloadBtn}>
          ↓ Скачать
        </a>
      </div>
    </div>
  )
}
