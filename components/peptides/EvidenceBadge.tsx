const CONFIG: Record<string, { bg: string; text: string }> = {
  Strong:   { bg: '#DCFCE7', text: '#16A34A' },
  Moderate: { bg: '#FEF3C7', text: '#D97706' },
  Early:    { bg: '#DBEAFE', text: '#2563EB' },
  Limited:  { bg: '#FEE2E2', text: '#DC2626' },
  Human:    { bg: '#EDE9FE', text: '#7C3AED' },
  Animal:   { bg: '#F5F5F7', text: '#6E6E73' },
}

export default function EvidenceBadge({ level }: { level: string }) {
  const cfg = CONFIG[level] ?? { bg: '#F5F5F7', text: '#6E6E73' }
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {level}
    </span>
  )
}
