// app/Components/listingHeader.js
import ExpandableText from '@/app/Components/expandableText';

const YEAR = 2026;

export default function ListingHeader({ category, config }) {
  const suffix = config.slug === 'phnom-penh' ? '' : ', Phnom Penh';

  return (
    <header className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight text-black">
        Best {category} in {config.name}{suffix} ({YEAR})
      </h1>

      {config.intro ? (
        <ExpandableText text={config.intro} />
      ) : (
        <p className="mt-2 max-w-2xl text-gray-600">{config.description}</p>
      )}
    </header>
  );
}