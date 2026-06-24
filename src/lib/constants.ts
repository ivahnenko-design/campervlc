// TODO: Replace with real WhatsApp Business number
export const WHATSAPP_NUMBER = "34624038085";
export const INSTAGRAM_URL = "https://www.instagram.com/camper.retreat.vlc";
export const INSTAGRAM_HANDLE = "@camper.retreat.vlc";

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
