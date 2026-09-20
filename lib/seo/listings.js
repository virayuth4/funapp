// lib/seo/listings.js
import { YAKINIKU_LOCATIONS, getRestaurantLocationConfig } from './restaurantLocations';
import { BAKERY_LOCATIONS, getBakeryLocationConfig } from './bakeryLocations';
import { CAFE_LOCATIONS, getCafeLocationConfig } from './cafeLocations';

export const LISTINGS = {
  yakiniku: {
    label: 'Yakiniku',
    emptyLabel: 'yakiniku restaurants',
    routeBase: 'best-yakiniku',
    ogImage: '/eat-doko-1200.png',
    schemaType: 'Restaurant',
    cuisine: 'Japanese',
    locations: YAKINIKU_LOCATIONS,
    getConfig: getRestaurantLocationConfig,
  },
  bakeries: {
    label: 'Bakeries',
    emptyLabel: 'bakeries',
    routeBase: 'best-bakeries',
    ogImage: '/eat-doko-1200.png',
    schemaType: 'Bakery',
    cuisine: undefined,
    locations: BAKERY_LOCATIONS,
    getConfig: getBakeryLocationConfig,
  },
  cafes: {
    label: 'Cafes',
    emptyLabel: 'cafes',
    routeBase: 'best-cafes',
    ogImage: '/eat-doko-1200.png',
    schemaType: 'CafeOrCoffeeShop',
    cuisine: undefined,
    locations: CAFE_LOCATIONS,
    getConfig: getCafeLocationConfig,
  },
};