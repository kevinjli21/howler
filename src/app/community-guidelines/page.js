import LegalLayout from '../components/LegalLayout';

export const metadata = {
  title: 'Community Guidelines - Howler',
  description: 'The Howler Code of Conduct for UW students.',
};

export default function CommunityGuidelinesPage() {
  return (
    <LegalLayout title="Community Guidelines" updated="July 12, 2026">
      <p>
        {`Howler is our digital campus public square. To keep it a safe, productive, and engaging space for all Huskies, we enforce a strict zero-tolerance policy for behaviors that disrupt our community.`}
      </p>

      <h2>Be Accountable</h2>
      <p>
        {`There is no anonymous posting on Howler. Your posts, replies, and shared content are tied to your verified UW account.`}
      </p>

      <h2>Zero Tolerance for Harassment</h2>
      <p>
        {`Bullying, stalking, targeted intimidation, doxxing, or hate speech directed at peers, faculty, or staff will result in an immediate, permanent ban.`}
      </p>

      <h2>Keep it Relevant</h2>
      <p>
        {`Use the correct category tags (e.g., #classes, #housing, #clubs) to ensure discussions remain organized and useful for everyone across the Seattle, Bothell, and Tacoma campuses.`}
      </p>

      <h2>No Spam or Commercial Exploitation</h2>
      <p>
        {`Do not use the platform for unauthorized commercial advertising, automated bot operations, or scraping user data.`}
      </p>
    </LegalLayout>
  );
}
