import { ORGANIZATION } from '../brand'

/** شريط التذييل بتدرّج الهوية، كما في دليل الهوية البصرية. */
export function Footer() {
  return (
    <footer className="footer">
      <span>{ORGANIZATION.directorate}</span>
      <span className="footer__handle">{ORGANIZATION.handle}</span>
    </footer>
  )
}
