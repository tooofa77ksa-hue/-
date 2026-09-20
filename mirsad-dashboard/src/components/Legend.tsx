interface LegendProps {
  items: { label: string; tone: string }[]
}

export function Legend({ items }: LegendProps) {
  return (
    <ul className="legend">
      {items.map((i) => (
        <li key={i.label}>
          <span className="legend__swatch" style={{ background: i.tone }} aria-hidden="true" />
          {i.label}
        </li>
      ))}
    </ul>
  )
}
