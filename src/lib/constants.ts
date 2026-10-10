// TODO: Replace with real WhatsApp Business number
export const WHATSAPP_NUMBER = "34624038085";
export const INSTAGRAM_URL = "https://www.instagram.com/camper.retreat.vlc";
export const INSTAGRAM_HANDLE = "@camper.retreat.vlc";

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Pickup and return point (same as the rental conditions); coordinates from Google Maps.
export const PICKUP_ADDRESS = "Carrer de Nino Bravo, 3, 46013 València";
export const PICKUP_LAT = 39.4570837;
export const PICKUP_LNG = -0.3583681;
export const MAPS_OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(PICKUP_ADDRESS)}`;
export const MAPS_ROUTE_URL = `https://www.google.com/maps/dir/?api=1&destination=${PICKUP_LAT},${PICKUP_LNG}`;

// Google review form of the business profile (g.page short link).
export const GOOGLE_REVIEW_URL = "https://g.page/r/CZURsHE9aJOhEBM/review";
