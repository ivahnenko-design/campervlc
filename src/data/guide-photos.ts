// Guide photos by code (content/guides/*.json: Guide.heroImage, GuideSection.image).
// Files live in public/images/guides/. Unsplash License and CC0 need no credit;
// CC BY / CC BY-SA photos carry author, licence and source link.
export interface GuidePhoto {
  src: string;
  width: number;
  height: number;
  credit?: string;
  creditUrl?: string;
}

export const GUIDE_PHOTOS: Record<string, GuidePhoto> = {
  "H-1": { src: "/images/guides/paises/h-1.jpg", width: 1920, height: 1280 },
  "FR-1": { src: "/images/guides/paises/fr-1.jpg", width: 1600, height: 1067 },
  "AD-2": { src: "/images/guides/paises/ad-2.jpg", width: 1600, height: 897 },
  "IT-4": {
    src: "/images/guides/paises/it-4.jpg",
    width: 1600,
    height: 939,
    credit: "Diliff · CC BY-SA 2.5 · Wikimedia Commons",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Colosseum_in_Rome-April_2007-1-_copie_2B.jpg",
  },
  "CH-3": { src: "/images/guides/paises/ch-3.jpg", width: 1600, height: 1038 },
  "AT-4": {
    src: "/images/guides/paises/at-4.jpg",
    width: 1600,
    height: 887,
    credit: "Markus Leupold-Löwenthal · CC BY-SA 3.0 · Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:StateOperaViennaNightBackside.jpg",
  },
  "ES-1": {
    src: "/images/guides/paises/es-1.jpg",
    width: 1600,
    height: 920,
    credit: "Diliff · CC BY-SA 3.0 · Wikimedia Commons",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:El_Palau_de_les_Arts_Reina_Sof%C3%ADa,_Valencia_-_Jan_2007.jpg",
  },
  "BE-1": {
    src: "/images/guides/paises/be-1.jpg",
    width: 1600,
    height: 1067,
    credit: "CEphoto, Uwe Aranas · CC BY-SA 3.0 · Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Bruges_Belgium_Bakkersrei-Canal-01.jpg",
  },
  "NL-1": {
    src: "/images/guides/paises/nl-1.jpg",
    width: 1600,
    height: 1067,
    credit: "Tarod · CC BY-SA 3.0 nl · Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:The_windmills_of_Kinderdijk.JPG",
  },
  "LU-1": {
    src: "/images/guides/paises/lu-1.jpg",
    width: 1600,
    height: 900,
    credit: "Dietmar Rabich · CC BY-SA 4.0 · Wikimedia Commons",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Luxembourg_(LU),_Grund_und_%C3%89glise_Saint-Jean_--_2023_--_8132.jpg",
  },
  "GB-1": {
    src: "/images/guides/paises/gb-1.jpg",
    width: 1600,
    height: 709,
    credit: "Diliff · CC BY-SA 3.0 · Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Tower_Bridge_London_Dusk_Feb_2006.jpg",
  },
  "IE-1": {
    src: "/images/guides/paises/ie-1.jpg",
    width: 1600,
    height: 1200,
    credit: "Ajay Suresh · CC BY 2.0 · Wikimedia Commons",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Cliffs_of_Moher_-_Into_the_Sunset_(49540453606).jpg",
  },
  "DK-2": {
    src: "/images/guides/paises/dk-2.jpg",
    width: 1600,
    height: 866,
    credit: "Jakub Hałun · CC BY-SA 4.0 · Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Nyhavn,_Copenhagen,_20220618_1728_7354.jpg",
  },
  "SE-1": {
    src: "/images/guides/paises/se-1.jpg",
    width: 1600,
    height: 900,
    credit: "Julian Herzog · CC BY 4.0 · Wikimedia Commons",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Skeppsbrokajen_Gamla_Stan_from_Skeppsholmen_Stockholm_2016_01.jpg",
  },
  "IS-1": {
    src: "/images/guides/paises/is-1.jpg",
    width: 1600,
    height: 855,
    credit: "Martin Falbisoner · CC BY-SA 4.0 · Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Sk%C3%B3gafoss_July_2014.JPG",
  },
  "EE-3": {
    src: "/images/guides/paises/ee-3.jpg",
    width: 1600,
    height: 997,
    credit: "Diego Delso · CC BY-SA 3.0 · Wikimedia Commons",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Vistas_panor%C3%A1micas_desde_Toompea,_Tallinn,_Estonia,_2012-08-05,_DD_16.JPG",
  },
  "LV-3": {
    src: "/images/guides/paises/lv-3.jpg",
    width: 1600,
    height: 1169,
    credit: "Diego Delso · CC BY-SA 3.0 · Wikimedia Commons",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Plaza_del_Ayuntamiento,_Riga,_Letonia,_2012-08-07,_DD_24.JPG",
  },
  "LT-1": {
    src: "/images/guides/paises/lt-1.jpg",
    width: 1600,
    height: 958,
    credit: "Scotch Mist · CC BY-SA 4.0 · Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Trakai_Island_11.jpg",
  },
  "PL-2": {
    src: "/images/guides/paises/pl-2.jpg",
    width: 1600,
    height: 949,
    credit: "Ingo Mehling · CC BY-SA 4.0 · Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Wawel_-_Castle_from_Sandomierz_Tower.jpg",
  },
  "CZ-1": {
    src: "/images/guides/paises/cz-1.jpg",
    width: 1600,
    height: 900,
    credit: "DXR · CC BY-SA 4.0 · Wikimedia Commons",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:North_view_of_Charles_Bridge_from_M%C3%A1nes%C5%AFv_most,_Prague_20160808_1.jpg",
  },
  "SK-1": {
    src: "/images/guides/paises/sk-1.jpg",
    width: 1600,
    height: 1067,
    credit: "Ingo Mehling · CC BY-SA 4.0 · Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Bratislava_Castle_with_Danube.jpeg",
  },
  "HU-3": { src: "/images/guides/paises/hu-3.jpg", width: 1600, height: 894 },
  "SI-3": {
    src: "/images/guides/paises/si-3.jpg",
    width: 1600,
    height: 1068,
    credit: "Abrget47j · CC BY-SA 3.0 · Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:SloveeniaBled.jpg",
  },
  "HR-2": {
    src: "/images/guides/paises/hr-2.jpg",
    width: 1600,
    height: 871,
    credit: "Diego Delso · CC BY-SA 3.0 · Wikimedia Commons",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Casco_viejo_de_Dubrovnik,_Croacia,_2014-04-14,_DD_04.JPG",
  },
  "GR-3": {
    src: "/images/guides/paises/gr-3.jpg",
    width: 1600,
    height: 1067,
    credit: "Bernard Gagnon · CC BY-SA 4.0 · Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:St_Nicholas_Monastery,_Meteora.jpg",
  },
  "CY-2": {
    src: "/images/guides/paises/cy-2.jpg",
    width: 1600,
    height: 1067,
    credit: "Anton Zelenov · CC BY-SA 4.0 · Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Petra_tou_romiou_3.jpg",
  },
  "PT-1": { src: "/images/guides/paises/pt-1.jpg", width: 1600, height: 1067 },
  "NO-6": {
    src: "/images/guides/paises/no-6.jpg",
    width: 1600,
    height: 1198,
    credit: "Clementp.fr · CC BY-SA 4.0 · Wikimedia Commons",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Route_de_l%27Atlantique_en_norv%C3%A8ge.jpg",
  },
  "DE-2": {
    src: "/images/guides/paises/de-2.jpg",
    width: 1600,
    height: 1067,
    credit: "Ximonic, Simo Räsänen · CC BY-SA 3.0 · Wikimedia Commons",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Neuschwanstein_Castle_from_Marienbr%C3%BCcke,_2011_May.jpg",
  },
  "FI-7": {
    src: "/images/guides/paises/fi-7.jpg",
    width: 1600,
    height: 1084,
    credit: "Ninara · CC BY 2.0 · Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/w/index.php?curid=112159057",
  },
  "MT-4": {
    src: "/images/guides/paises/mt-4.jpg",
    width: 1600,
    height: 1200,
    credit: "HH58 · CC BY-SA 4.0 · Wikimedia Commons",
    creditUrl: "https://commons.wikimedia.org/w/index.php?curid=54626159",
  },
};

export function guidePhoto(code: string | undefined): GuidePhoto | undefined {
  return code ? GUIDE_PHOTOS[code] : undefined;
}
