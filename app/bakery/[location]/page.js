import { createListingPage } from '@/lib/seo/createListingPage';

const { generateStaticParams, generateMetadata, Page } = createListingPage('bakeries');

export const dynamicParams = false;
export { generateStaticParams, generateMetadata };
export default Page;