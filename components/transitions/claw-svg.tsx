"use client"

interface ClawSvgProps {
  className?: string
  style?: React.CSSProperties
}

export function ClawSvg({ className, style }: ClawSvgProps) {
  return (
    <svg
      viewBox="0 0 200 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* 豹爪剪影 - 四指向下抓 */}
      <g fill="white" filter="url(#claw-glow)">
        {/* 第一指（左） */}
        <path d="M40 0 Q35 60 25 120 Q20 150 30 180 Q35 160 45 130 Q55 80 50 20 Z" />
        {/* 第二指 */}
        <path d="M70 0 Q65 70 55 140 Q50 175 60 210 Q68 185 78 150 Q90 90 85 25 Z" />
        {/* 第三指（中） */}
        <path d="M105 0 Q100 80 92 160 Q88 200 98 240 Q108 210 118 170 Q130 100 125 30 Z" />
        {/* 第四指（右） */}
        <path d="M140 0 Q135 70 128 140 Q125 175 135 210 Q143 185 150 150 Q162 90 157 25 Z" />
        {/* 掌心部分 */}
        <path d="M30 180 Q50 220 90 230 Q130 225 150 200 Q140 230 100 250 Q60 245 30 180 Z" />
      </g>
      {/* 發光效果 */}
      <defs>
        <filter id="claw-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}
