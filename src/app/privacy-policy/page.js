import LegalLayout from '../components/LegalLayout';

export const metadata = {
  title: 'Privacy & Identity Binding Policy - Howler',
  description: 'How Howler handles institutional identity, authentication, and account data.',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy & Identity Binding Policy" updated="July 12, 2026">
      <p>
        {`We believe in absolute transparency regarding how your data is handled. Because access is gated by institutional OAuth providers (Google Workspace and Microsoft Entra ID), your data privacy functions differently than traditional social media.`}
      </p>

      <h2>Identity Mapping</h2>
      <p>
        {`When you authenticate via UW Single-Sign-On, the system collects your institutional email address, your verified full name, and your provider avatar link. To prevent account fragmentation, if you log in via Google one day and Microsoft the next, our system automatically merges these pathways under a single, unique database user.id.`}
      </p>

      <h2>The Non-Anonymity Clause</h2>
      <p>
        {`By creating an account, you explicitly acknowledge and accept that your actions on this platform are not anonymous. In the event of severe platform abuse, digital harassment, or threats to campus safety, your verified account metadata may be used by administrators to enforce community safety and accountability.`}
      </p>

      <h2>Data Storage & Content Management</h2>
      <h3>Avatars</h3>
      <p>
        {`To protect third-party API limits, your profile picture is securely cloned and hosted natively within our Supabase cloud storage buckets.`}
      </p>

      <h3>Data Rights</h3>
      <p>
        {`You maintain ownership of your text updates ("howls") and replies. You have the functional authority to permanently delete any content you have authored from the timeline at any time.`}
      </p>
    </LegalLayout>
  );
}
