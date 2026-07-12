import Link from 'next/link';

export default function LegalLayout({ title, updated, children }) {
  return (
    <div className="legal-page">
      <div className="legal-card">
        <Link href="/" className="legal-back-link">← Back to Howler</Link>
        <h1 className="legal-title">{title}</h1>
        {updated && <p className="legal-updated">Last updated: {updated}</p>}

        <div className="legal-body">{children}</div>

        <nav className="legal-footer-nav">
          <Link href="/community-guidelines">Community Guidelines</Link>
          <Link href="/privacy-policy">Privacy & Identity Binding Policy</Link>
          <Link href="/terms">Terms of Use</Link>
        </nav>
      </div>
    </div>
  );
}
