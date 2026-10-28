import './folio.css'
import './scholar.css'
import './focus.css'

export default function FolioHeading({ title, label, description }: { title: string; label?: string; description?: string }) {
  return <div className="folio-heading">{label !== undefined && <span>{label}</span>}<h2>{title}</h2>{description && <p>{description}</p>}</div>
}
