const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'BlockLancer',
  url: 'https://blocklancer.app',
  description:
    'Trustless milestone-based payment contracts between employers and workers. Built on Stacks with Bitcoin-level security.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  creator: {
    '@type': 'Organization',
    name: 'BlockLancer',
    url: 'https://blocklancer.app',
  },
  featureList: [
    'Smart Escrow Contracts',
    'Milestone-Based Payments',
    'DAO Governance',
    'Dispute Resolution',
    'Reputation System',
    'Bitcoin Security via Stacks',
  ],
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
