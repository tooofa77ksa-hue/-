interface SectionTitleProps {
  children: React.ReactNode
  note?: React.ReactNode
}

/** حبّة عنوان القسم بتدرّج الهوية، كما في دليل الهوية البصرية. */
export function SectionTitle({ children, note }: SectionTitleProps) {
  return (
    <div className="section-head">
      <h2 className="section-pill">{children}</h2>
      {note && <p className="section-head__note">{note}</p>}
    </div>
  )
}
