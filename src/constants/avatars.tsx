import React from 'react'

// ======================================================
// GEOBOARD — AVATAR ICON SET
// 18 total: 6 animals · 6 geometric · 6 space
// Each is a self-contained inline SVG — no image hosting,
// no upload pipeline. The `id` is what gets stored on
// User.avatar in the database.
// ======================================================

export interface AvatarOption {
  id: string
  label: string
  category: 'animal' | 'geometric' | 'space'
  gradient: [string, string]
  Icon: React.FC
}

const IconBase: React.FC<{ children: React.ReactNode; gradId: string; colors: [string, string] }> = ({
  children,
  gradId,
  colors,
}) => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={gradId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor={colors[0]} />
        <stop offset="100%" stopColor={colors[1]} />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill={`url(#${gradId})`} />
    {children}
  </svg>
)

const Fox: React.FC = () => (
  <IconBase gradId="av-fox" colors={['#ff8a4c', '#ff5d5d']}>
    <path d="M20 26 L14 16 L24 22 Z" fill="#fff" opacity="0.95" />
    <path d="M44 26 L50 16 L40 22 Z" fill="#fff" opacity="0.95" />
    <ellipse cx="32" cy="36" rx="14" ry="12" fill="#fff" opacity="0.95" />
    <circle cx="26" cy="34" r="2.4" fill="#1a1a1a" />
    <circle cx="38" cy="34" r="2.4" fill="#1a1a1a" />
    <path d="M32 38 L29 42 L35 42 Z" fill="#1a1a1a" opacity="0.85" />
  </IconBase>
)

const Owl: React.FC = () => (
  <IconBase gradId="av-owl" colors={['#7c6bff', '#4d3fc7']}>
    <ellipse cx="32" cy="36" rx="15" ry="14" fill="#fff" opacity="0.95" />
    <circle cx="25" cy="32" r="6" fill="#fff" />
    <circle cx="39" cy="32" r="6" fill="#fff" />
    <circle cx="25" cy="32" r="3" fill="#1a1a1a" />
    <circle cx="39" cy="32" r="3" fill="#1a1a1a" />
    <path d="M32 38 L29 43 L35 43 Z" fill="#ffb347" />
    <path d="M18 22 L24 26 M46 22 L40 26" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
  </IconBase>
)

const Cat: React.FC = () => (
  <IconBase gradId="av-cat" colors={['#ffb86b', '#ff7eb3']}>
    <path d="M19 20 L25 30 L17 30 Z" fill="#fff" opacity="0.95" />
    <path d="M45 20 L39 30 L47 30 Z" fill="#fff" opacity="0.95" />
    <ellipse cx="32" cy="38" rx="14" ry="12" fill="#fff" opacity="0.95" />
    <circle cx="26" cy="36" r="2" fill="#1a1a1a" />
    <circle cx="38" cy="36" r="2" fill="#1a1a1a" />
    <path d="M30 41 Q32 43 34 41" stroke="#1a1a1a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
  </IconBase>
)

const Panda: React.FC = () => (
  <IconBase gradId="av-panda" colors={['#9ad1ff', '#5b8def']}>
    <circle cx="20" cy="22" r="6" fill="#1a1a1a" />
    <circle cx="44" cy="22" r="6" fill="#1a1a1a" />
    <ellipse cx="32" cy="36" rx="15" ry="13" fill="#fff" opacity="0.97" />
    <ellipse cx="25" cy="34" rx="4" ry="5" fill="#1a1a1a" />
    <ellipse cx="39" cy="34" rx="4" ry="5" fill="#1a1a1a" />
    <circle cx="25" cy="34" r="1.6" fill="#fff" />
    <circle cx="39" cy="34" r="1.6" fill="#fff" />
    <ellipse cx="32" cy="41" rx="2.4" ry="1.8" fill="#1a1a1a" />
  </IconBase>
)

const Bunny: React.FC = () => (
  <IconBase gradId="av-bunny" colors={['#ffd1e8', '#ff9ecb']}>
    <ellipse cx="24" cy="18" rx="4.5" ry="11" fill="#fff" opacity="0.95" transform="rotate(-8 24 18)" />
    <ellipse cx="40" cy="18" rx="4.5" ry="11" fill="#fff" opacity="0.95" transform="rotate(8 40 18)" />
    <ellipse cx="32" cy="38" rx="14" ry="12" fill="#fff" opacity="0.97" />
    <circle cx="27" cy="36" r="2" fill="#1a1a1a" />
    <circle cx="37" cy="36" r="2" fill="#1a1a1a" />
    <ellipse cx="32" cy="41" rx="2" ry="1.5" fill="#e0708f" />
  </IconBase>
)

const Koala: React.FC = () => (
  <IconBase gradId="av-koala" colors={['#b0b8c4', '#7d8a9c']}>
    <circle cx="18" cy="26" r="8" fill="#fff" opacity="0.95" />
    <circle cx="46" cy="26" r="8" fill="#fff" opacity="0.95" />
    <ellipse cx="32" cy="38" rx="14" ry="13" fill="#fff" opacity="0.97" />
    <circle cx="26" cy="36" r="2" fill="#1a1a1a" />
    <circle cx="38" cy="36" r="2" fill="#1a1a1a" />
    <ellipse cx="32" cy="41" rx="3" ry="2.2" fill="#3a3a3a" />
  </IconBase>
)

const Hexagon: React.FC = () => (
  <IconBase gradId="av-hex" colors={['#00f5ff', '#4d7eff']}>
    <path d="M32 14 L48 23 V41 L32 50 L16 41 V23 Z" fill="#fff" opacity="0.92" />
    <path d="M32 22 L40 27 V37 L32 42 L24 37 V27 Z" fill="#0a0f1e" opacity="0.85" />
  </IconBase>
)

const Triangle: React.FC = () => (
  <IconBase gradId="av-tri" colors={['#ff4d8b', '#8b5cf6']}>
    <path d="M32 14 L50 46 H14 Z" fill="#fff" opacity="0.92" />
    <path d="M32 26 L41 42 H23 Z" fill="#1a0a2e" opacity="0.85" />
  </IconBase>
)

const Diamond: React.FC = () => (
  <IconBase gradId="av-dia" colors={['#8b5cf6', '#00f5ff']}>
    <path d="M32 12 L50 32 L32 52 L14 32 Z" fill="#fff" opacity="0.92" />
    <path d="M32 22 L42 32 L32 42 L22 32 Z" fill="#0a0f1e" opacity="0.85" />
  </IconBase>
)

const Orbit: React.FC = () => (
  <IconBase gradId="av-orb" colors={['#00ffa3', '#00b8d9']}>
    <circle cx="32" cy="32" r="6" fill="#fff" />
    <ellipse cx="32" cy="32" rx="20" ry="9" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.85" />
    <ellipse cx="32" cy="32" rx="9" ry="20" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.55" transform="rotate(35 32 32)" />
  </IconBase>
)

const Wave: React.FC = () => (
  <IconBase gradId="av-wave" colors={['#4d7eff', '#00f5ff']}>
    <path
      d="M12 28 Q20 18 28 28 T44 28 T52 28"
      fill="none"
      stroke="#fff"
      strokeWidth="4"
      strokeLinecap="round"
      opacity="0.95"
    />
    <path
      d="M12 40 Q20 30 28 40 T44 40 T52 40"
      fill="none"
      stroke="#fff"
      strokeWidth="4"
      strokeLinecap="round"
      opacity="0.6"
    />
  </IconBase>
)

const Prism: React.FC = () => (
  <IconBase gradId="av-prism" colors={['#ffb347', '#ff5d8a']}>
    <path d="M32 13 L48 41 H16 Z" fill="#fff" opacity="0.92" />
    <path d="M32 13 L40 27 H24 Z" fill="#0a0f1e" opacity="0.5" />
    <path d="M24 27 H40 L32 41 Z" fill="#0a0f1e" opacity="0.75" />
  </IconBase>
)

const Saturn: React.FC = () => (
  <IconBase gradId="av-saturn" colors={['#ffcf86', '#ff9a56']}>
    <circle cx="32" cy="32" r="11" fill="#fff" opacity="0.95" />
    <ellipse cx="32" cy="32" rx="22" ry="6" fill="none" stroke="#fff" strokeWidth="3" opacity="0.9" />
  </IconBase>
)

const Rocket: React.FC = () => (
  <IconBase gradId="av-rocket" colors={['#5b8def', '#9b6bff']}>
    <path d="M32 12 C40 20 40 34 32 44 C24 34 24 20 32 12 Z" fill="#fff" opacity="0.95" />
    <circle cx="32" cy="26" r="3" fill="#5b8def" />
    <path d="M26 38 L20 48 L28 44 Z" fill="#fff" opacity="0.8" />
    <path d="M38 38 L44 48 L36 44 Z" fill="#fff" opacity="0.8" />
    <path d="M30 44 L32 52 L34 44 Z" fill="#ff9a56" />
  </IconBase>
)

const Moon: React.FC = () => (
  <IconBase gradId="av-moon" colors={['#3a3f6e', '#1a1f3e']}>
    <path
      d="M40 18 A16 16 0 1 0 40 46 A12 12 0 1 1 40 18 Z"
      fill="#ffe9b0"
      opacity="0.95"
    />
    <circle cx="22" cy="20" r="1.4" fill="#fff" opacity="0.8" />
    <circle cx="46" cy="44" r="1" fill="#fff" opacity="0.7" />
    <circle cx="48" cy="16" r="0.8" fill="#fff" opacity="0.6" />
  </IconBase>
)

const Comet: React.FC = () => (
  <IconBase gradId="av-comet" colors={['#00f5ff', '#1a1f3e']}>
    <circle cx="40" cy="24" r="6" fill="#fff" opacity="0.95" />
    <path d="M37 27 L14 50" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    <path d="M40 24 L20 44" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.3" />
  </IconBase>
)

const Galaxy: React.FC = () => (
  <IconBase gradId="av-galaxy" colors={['#8b5cf6', '#ff4d8b']}>
    <path
      d="M32 16 C42 16 48 24 46 32 C44 40 36 42 32 38 C28 34 30 28 34 28 C36 28 37 30 35 31"
      fill="none"
      stroke="#fff"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.92"
    />
    <circle cx="32" cy="32" r="2.6" fill="#fff" />
    <circle cx="20" cy="44" r="1" fill="#fff" opacity="0.7" />
    <circle cx="46" cy="46" r="1.2" fill="#fff" opacity="0.6" />
  </IconBase>
)

const Planet: React.FC = () => (
  <IconBase gradId="av-planet" colors={['#00ffa3', '#4d7eff']}>
    <circle cx="30" cy="32" r="13" fill="#fff" opacity="0.95" />
    <path d="M18 28 Q30 24 42 28" stroke="#4d7eff" strokeWidth="2" fill="none" opacity="0.5" />
    <path d="M19 37 Q30 41 41 37" stroke="#4d7eff" strokeWidth="2" fill="none" opacity="0.5" />
    <circle cx="46" cy="20" r="2" fill="#fff" opacity="0.8" />
  </IconBase>
)

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'fox', label: 'Fox', category: 'animal', gradient: ['#ff8a4c', '#ff5d5d'], Icon: Fox },
  { id: 'owl', label: 'Owl', category: 'animal', gradient: ['#7c6bff', '#4d3fc7'], Icon: Owl },
  { id: 'cat', label: 'Cat', category: 'animal', gradient: ['#ffb86b', '#ff7eb3'], Icon: Cat },
  { id: 'panda', label: 'Panda', category: 'animal', gradient: ['#9ad1ff', '#5b8def'], Icon: Panda },
  { id: 'bunny', label: 'Bunny', category: 'animal', gradient: ['#ffd1e8', '#ff9ecb'], Icon: Bunny },
  { id: 'koala', label: 'Koala', category: 'animal', gradient: ['#b0b8c4', '#7d8a9c'], Icon: Koala },

  { id: 'hexagon', label: 'Hexagon', category: 'geometric', gradient: ['#00f5ff', '#4d7eff'], Icon: Hexagon },
  { id: 'triangle', label: 'Triangle', category: 'geometric', gradient: ['#ff4d8b', '#8b5cf6'], Icon: Triangle },
  { id: 'diamond', label: 'Diamond', category: 'geometric', gradient: ['#8b5cf6', '#00f5ff'], Icon: Diamond },
  { id: 'orbit', label: 'Orbit', category: 'geometric', gradient: ['#00ffa3', '#00b8d9'], Icon: Orbit },
  { id: 'wave', label: 'Wave', category: 'geometric', gradient: ['#4d7eff', '#00f5ff'], Icon: Wave },
  { id: 'prism', label: 'Prism', category: 'geometric', gradient: ['#ffb347', '#ff5d8a'], Icon: Prism },

  { id: 'saturn', label: 'Saturn', category: 'space', gradient: ['#ffcf86', '#ff9a56'], Icon: Saturn },
  { id: 'rocket', label: 'Rocket', category: 'space', gradient: ['#5b8def', '#9b6bff'], Icon: Rocket },
  { id: 'moon', label: 'Moon', category: 'space', gradient: ['#3a3f6e', '#1a1f3e'], Icon: Moon },
  { id: 'comet', label: 'Comet', category: 'space', gradient: ['#00f5ff', '#1a1f3e'], Icon: Comet },
  { id: 'galaxy', label: 'Galaxy', category: 'space', gradient: ['#8b5cf6', '#ff4d8b'], Icon: Galaxy },
  { id: 'planet', label: 'Planet', category: 'space', gradient: ['#00ffa3', '#4d7eff'], Icon: Planet },
]

export const AVATAR_MAP: Record<string, AvatarOption> = AVATAR_OPTIONS.reduce(
  (acc, opt) => ({ ...acc, [opt.id]: opt }),
  {} as Record<string, AvatarOption>,
)

export const DEFAULT_AVATAR_ID = 'fox'

export const AvatarDisplay: React.FC<{ avatarId?: string | null; size?: number }> = ({
  avatarId,
  size = 40,
}) => {
  const option = (avatarId && AVATAR_MAP[avatarId]) || AVATAR_MAP[DEFAULT_AVATAR_ID]
  const { Icon } = option
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <Icon />
    </div>
  )
}