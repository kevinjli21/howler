import LegalLayout from '../components/LegalLayout';

export const metadata = {
  title: 'Terms of Use - Howler',
  description: 'Platform guardrails and operational boundaries for Howler.',
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Use & Platform Guardrails" updated="July 12, 2026">
      <p>
        {`By accessing howler-teal.vercel.app, you agree to abide by the technical and operational boundaries established to keep the platform stable and highly available.`}
      </p>

      <h2>System Safeguards & Rate Limiting</h2>
      <p>
        {`To ensure a smooth ~150ms response latency for all students, our backend uses a distributed Upstash Redis middleware layer to actively monitor network request frequencies.`}
      </p>
      <p>
        {`Intentional script operations, automated API flooding, or attempts to bypass token restrictions will flag your device's network signature.`}
      </p>
      <p>
        {`Abusive traffic profiles will automatically receive a 429 Too Many Requests block, and repeat offenses will result in an absolute hardware and account suspension.`}
      </p>

      <h2>Institutional Alignment</h2>
      <p>
        {`Howler is an independent, student-engineered platform. While we strictly restrict access to verified @uw.edu identities, this network is not officially managed, sponsored, or moderated by the University of Washington administration. Users are expected to independently uphold the UW Student Conduct Code while participating in this forum.`}
      </p>
    </LegalLayout>
  );
}
