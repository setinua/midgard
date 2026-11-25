const P = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, 'aria-hidden': true } as const

export const Icon = {
  facebook: () => <svg {...P}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>,
  telegram: () => <svg {...P}><path d="M22 3 2 11l7 3 2 7 4-5 5 4z" /><path d="m9 14 13-11" /></svg>,
  youtube: () => <svg {...P}><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3z" /></svg>,
  instagram: () => <svg {...P}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /></svg>,
  x: () => <svg {...P}><path d="M4 4l16 16M20 4 4 20" /></svg>,
  rss: () => <svg {...P}><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1" /></svg>,
  search: () => <svg {...P} width={20} height={20}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
  menu: () => <svg {...P} width={24} height={24} strokeWidth={2}><path d="M4 6h16M4 12h16M4 18h16" /></svg>,
  link: () => <svg {...P}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>,
  info: () => <svg {...P} width={20} height={20} stroke="#1F5FA8"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>,
  ruins: () => (
    <svg className="ruins" aria-hidden="true" width="320" height="110" viewBox="0 0 320 110">
      <g fill="#C9D6E8" opacity=".18">
        <rect x="20" y="30" width="16" height="80" />
        <rect x="60" y="30" width="16" height="80" />
        <rect x="100" y="30" width="16" height="80" />
        <rect x="140" y="50" width="16" height="60" />
        <rect x="10" y="20" width="150" height="10" />
        <polygon points="10,20 85,0 160,20" />
        <rect x="280" y="70" width="16" height="44" rx="3" />
      </g>
      <rect x="200" y="60" width="16" height="54" rx="3" fill="#c08a2e" />
      <rect x="240" y="40" width="16" height="74" rx="3" fill="#e6eef8" />
    </svg>
  ),
}
