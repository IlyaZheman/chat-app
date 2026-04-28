import styles from './Avatar.module.css'

const AVATAR_PALETTE = [
  ['#8fb89a', '#6f9a7c'],
  ['#b3c499', '#90a76e'],
  ['#9bb6c2', '#6f95a6'],
  ['#c2a99b', '#a6856f'],
  ['#a89bc2', '#856fa6'],
  ['#c2b09b', '#a68b6f'],
  ['#9bc2b8', '#6fa69a'],
] as const

function avatarColor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface AvatarProps {
  name: string
  size?: number
}

export function Avatar({ name, size = 40 }: AvatarProps) {
  const [a, b] = avatarColor(name)
  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${a}, ${b})`,
        fontSize: Math.round(size * 0.38),
      }}
      aria-hidden
    >
      {initials(name || '?')}
    </span>
  )
}
