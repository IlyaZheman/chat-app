import type { MessagePayload } from '../types'
import FileCard from './FileCard'
import styles from './ChatWindow.module.css'

interface Props {
  payload: MessagePayload
  onOpenImage: (image: { url: string; fileName: string; fileSize?: number }) => void
}

export default function MessageContent({ payload, onOpenImage }: Props) {
  switch (payload.type) {
    case 'text':
      return <span className={styles.bubbleText}>{payload.text}</span>

    case 'image':
      return (
        <>
          {payload.captionPosition === 'above' && payload.caption && (
            <span className={styles.bubbleText}>{payload.caption}</span>
          )}
          <button
            className={styles.imageBtn}
            onClick={() => onOpenImage({ url: payload.url, fileName: payload.fileName, fileSize: payload.fileSize })}
            aria-label="Открыть изображение"
          >
            <img
              src={payload.url}
              alt={payload.fileName}
              className={styles.attachmentImage}
              loading="lazy"
            />
          </button>
          {payload.captionPosition !== 'above' && payload.caption && (
            <span className={styles.bubbleCaption}>{payload.caption}</span>
          )}
        </>
      )

    case 'file':
      if (payload.mediaType.startsWith('video/')) {
        return <video src={payload.url} controls className={styles.attachmentVideo} />
      }
      if (payload.mediaType.startsWith('audio/')) {
        return <audio src={payload.url} controls className={styles.attachmentAudio} />
      }
      return (
        <FileCard
          url={payload.url}
          fileName={payload.fileName}
          mediaType={payload.mediaType}
          fileSize={payload.fileSize}
        />
      )
  }
}
