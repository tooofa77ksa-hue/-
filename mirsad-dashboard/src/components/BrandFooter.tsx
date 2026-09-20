import { ORGANIZATION } from '../brand'

export function BrandFooter() {
  return (
    <footer className="footer">
      <span>{ORGANIZATION.directorate}</span>
      <span className="footer__handle">{ORGANIZATION.handle}</span>
    </footer>
  )
}
