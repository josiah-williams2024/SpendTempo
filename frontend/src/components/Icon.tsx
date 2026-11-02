import type { ReactNode } from 'react'

const paths: Record<string, ReactNode> = {
  home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V21h14V9.8M9 21v-7h6v7"/></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  back: <path d="m15 18-6-6 6-6"/>,
  basket: <><path d="m4 9 2 11h12l2-11M2 9h20M9 4 6 9M15 4l3 5"/></>,
  coffee: <><path d="M4 7h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7Z"/><path d="M17 9h2a3 3 0 0 1 0 6h-2M6 3h8"/></>,
  wallet: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z"/><path d="M4 7h15M15 11h6v5h-6a2.5 2.5 0 0 1 0-5Z"/></>,
  train: <><rect x="5" y="3" width="14" height="15" rx="3"/><path d="M8 21l2-3M16 18l2 3M5 12h14M9 7h.01M15 7h.01"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
}

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
