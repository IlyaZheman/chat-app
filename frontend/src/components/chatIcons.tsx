import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export const Icon = {
  Brand: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M21 12a8 8 0 0 1-11.6 7.13L4 20l1-4.4A8 8 0 1 1 21 12z" />
    </svg>
  ),
  Group: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M16 14a4 4 0 1 0-8 0" />
      <circle cx="12" cy="8" r="3" />
      <path d="M3 19c.6-2.3 2.7-4 5-4" />
      <path d="M21 19c-.6-2.3-2.7-4-5-4" />
      <circle cx="6" cy="11" r="2" />
      <circle cx="18" cy="11" r="2" />
    </svg>
  ),
  Private: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1-4 4.5-6 8-6s7 2 8 6" />
    </svg>
  ),
  Search: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  Plus: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  ArrowLeft: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  ),
  Send: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
    </svg>
  ),
  Paperclip: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M21 12.5 12.5 21a5.5 5.5 0 0 1-7.8-7.8L13.6 4.3a3.7 3.7 0 0 1 5.2 5.2L9.9 18.4a1.8 1.8 0 0 1-2.6-2.6l8-8" />
    </svg>
  ),
  Logout: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
  Settings: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.4l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
  More: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  Phone: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" />
    </svg>
  ),
  Video: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M22 8 16 12l6 4V8z" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  ),
  Bell: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  ),
  Image: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  ),
  File: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  ),
  Lock: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Trash: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  ),
  Close: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  Check: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  CheckDouble: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M2 12 7 17l9-9" />
      <path d="m12 17 9-9" />
    </svg>
  ),
  Edit: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  ),
  BellOff: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      <path d="M18.6 14a8.3 8.3 0 0 1-.6-3.4V8a6 6 0 0 0-9.6-4.8" />
      <path d="M18 8a6 6 0 0 0-.6-2.6" />
      <path d="M2 2l20 20" />
      <path d="M6.3 6.3A6 6 0 0 0 6 8c0 7-3 9-3 9h14" />
    </svg>
  ),
  Clock: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  ChevronRight: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
  Channel: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 5a10 10 0 0 1 0 14" />
    </svg>
  ),
  Compass: ({ size = 18, ...rest }: IconProps) => (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="10" />
      <path d="m16 8-2 6-6 2 2-6 6-2z" />
    </svg>
  ),
}

export type IconName = keyof typeof Icon
