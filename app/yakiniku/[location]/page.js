import { createListingPage } from '@/lib/seo/createListingPage';

const { generateStaticParams, generateMetadata, Page } = createListingPage('yakiniku');

export const dynamicParams = false; // must stay a literal in each page file
export { generateStaticParams, generateMetadata };
export default Page;