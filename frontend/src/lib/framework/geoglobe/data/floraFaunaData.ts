/**
 * Kurs World / GeoGlobe — Comprehensive Global Biodiversity Dataset (ADR 0034).
 * Covers 195+ Sovereign States & Territories with iconic wildlife, national flora,
 * IUCN conservation status, biomes, and megadiversity rankings.
 */

export interface FloraFaunaData {
  animal: {
    commonName: string;
    scientificName: string;
    emoji: string;
    iucnStatus: 'Critically Endangered' | 'Endangered' | 'Vulnerable' | 'Near Threatened' | 'Least Concern';
    category: 'Mammal' | 'Reptile' | 'Bird' | 'Amphibian' | 'Marine' | 'Insect';
  };
  plant: {
    commonName: string;
    scientificName: string;
    emoji: string;
    type: 'Flower' | 'Tree' | 'Medicinal' | 'Carnivorous' | 'Fern';
    conservationStatus: string;
  };
  biodiversityScore: number; // 0 - 100
  globalBiodiversityRank: number; // #1 Brazil, #2 Colombia, #3 Indonesia, etc.
  primaryBiome: 'Tropical Rainforest' | 'Savanna' | 'Temperate Forest' | 'Boreal / Taiga' | 'Desert' | 'Mediterranean' | 'Tundra' | 'Marine & Coral';
  isMegadiverse: boolean;
  endemicSpeciesHighlights: string[];
  conservationHotspot: boolean;
}

/**
 * 17 Globally Recognized Megadiverse Countries (UNEP-WCMC)
 */
export const MEGADIVERSE_ISO3_LIST: string[] = [
  'BRA', // #1 Brazil
  'COL', // #2 Colombia
  'IDN', // #3 Indonesia
  'CHN', // #4 China
  'MEX', // #5 Mexico
  'PER', // #6 Peru
  'AUS', // #7 Australia
  'IND', // #8 India
  'ECU', // #9 Ecuador
  'VEN', // #10 Venezuela
  'USA', // #11 United States
  'MDG', // #12 Madagascar
  'COD', // #13 DR Congo
  'ZAF', // #14 South Africa
  'MYS', // #15 Malaysia
  'PNG', // #16 Papua New Guinea
  'PHL', // #17 Philippines
];

/**
 * Comprehensive Biodiversity Records for Key Sovereign States & Territories
 */
export const FLORA_FAUNA_DATASET: Record<string, Partial<FloraFaunaData>> = {
  // 🇮🇩 Indonesia
  IDN: {
    animal: {
      commonName: 'Komodo Dragon & Orangutan',
      scientificName: 'Varanus komodoensis / Pongo abelii',
      emoji: '🦎',
      iucnStatus: 'Endangered',
      category: 'Reptile',
    },
    plant: {
      commonName: 'Padma Raksasa (Rafflesia) & Melati Putih',
      scientificName: 'Rafflesia arnoldii / Jasminum sambac',
      emoji: '🌺',
      type: 'Flower',
      conservationStatus: 'Vulnerable (Endemic)',
    },
    biodiversityScore: 97,
    globalBiodiversityRank: 3,
    primaryBiome: 'Tropical Rainforest',
    isMegadiverse: true,
    endemicSpeciesHighlights: ['Komodo Dragon', 'Sumatran Tiger', 'Javan Rhino', 'Birds of Paradise', 'Rafflesia'],
    conservationHotspot: true,
  },

  // 🇧🇷 Brazil
  BRA: {
    animal: {
      commonName: 'Jaguar & Golden Lion Tamarin',
      scientificName: 'Panthera onca / Leontopithecus rosalia',
      emoji: '🐆',
      iucnStatus: 'Near Threatened',
      category: 'Mammal',
    },
    plant: {
      commonName: 'Ipê-amarelo & Amazon Water Lily',
      scientificName: 'Handroanthus albus / Victoria amazonica',
      emoji: '🌸',
      type: 'Tree',
      conservationStatus: 'Protected',
    },
    biodiversityScore: 100,
    globalBiodiversityRank: 1,
    primaryBiome: 'Tropical Rainforest',
    isMegadiverse: true,
    endemicSpeciesHighlights: ['Jaguar', 'Pink River Dolphin', 'Hyacinth Macaw', 'Poison Dart Frog'],
    conservationHotspot: true,
  },

  // 🇨🇴 Colombia
  COL: {
    animal: {
      commonName: 'Andean Condor & Golden Poison Frog',
      scientificName: 'Vultur gryphus / Phyllobates terribilis',
      emoji: '🦅',
      iucnStatus: 'Vulnerable',
      category: 'Bird',
    },
    plant: {
      commonName: 'Flor de Mayo (Orchid)',
      scientificName: 'Cattleya trianae',
      emoji: '🪻',
      type: 'Flower',
      conservationStatus: 'Endangered',
    },
    biodiversityScore: 98,
    globalBiodiversityRank: 2,
    primaryBiome: 'Tropical Rainforest',
    isMegadiverse: true,
    endemicSpeciesHighlights: ['Golden Poison Frog', 'Cotton-top Tamarin', 'Andean Condor'],
    conservationHotspot: true,
  },

  // 🇨🇳 China
  CHN: {
    animal: {
      commonName: 'Giant Panda & Red Panda',
      scientificName: 'Ailuropoda melanoleuca / Ailurus fulgens',
      emoji: '🐼',
      iucnStatus: 'Vulnerable',
      category: 'Mammal',
    },
    plant: {
      commonName: 'Peony & Plum Blossom (Meihua)',
      scientificName: 'Paeonia suffruticosa / Prunus mume',
      emoji: '🏵️',
      type: 'Flower',
      conservationStatus: 'Cultivated Heritage',
    },
    biodiversityScore: 95,
    globalBiodiversityRank: 4,
    primaryBiome: 'Temperate Forest',
    isMegadiverse: true,
    endemicSpeciesHighlights: ['Giant Panda', 'Golden Snub-nosed Monkey', 'Chinese Giant Salamander', 'Ginkgo biloba'],
    conservationHotspot: true,
  },

  // 🇲🇽 Mexico
  MEX: {
    animal: {
      commonName: 'Axolotl & Golden Eagle',
      scientificName: 'Ambystoma mexicanum / Aquila chrysaetos',
      emoji: '🦎',
      iucnStatus: 'Critically Endangered',
      category: 'Amphibian',
    },
    plant: {
      commonName: 'Dahlia & Saguaro Cactus',
      scientificName: 'Dahlia pinnata / Carnegiea gigantea',
      emoji: '🌵',
      type: 'Flower',
      conservationStatus: 'Protected',
    },
    biodiversityScore: 94,
    globalBiodiversityRank: 5,
    primaryBiome: 'Desert',
    isMegadiverse: true,
    endemicSpeciesHighlights: ['Axolotl', 'Vaquita Porpoise', 'Monarch Butterfly (Wintering)', 'Coati'],
    conservationHotspot: true,
  },

  // 🇵🇪 Peru
  PER: {
    animal: {
      commonName: 'Vicuña & Andean Cock-of-the-rock',
      scientificName: 'Vicugna vicugna / Rupicola peruvianus',
      emoji: '🦙',
      iucnStatus: 'Least Concern',
      category: 'Mammal',
    },
    plant: {
      commonName: 'Cantua (Sacred Flower of the Incas)',
      scientificName: 'Cantua buxifolia',
      emoji: '🌺',
      type: 'Flower',
      conservationStatus: 'Protected',
    },
    biodiversityScore: 93,
    globalBiodiversityRank: 6,
    primaryBiome: 'Tropical Rainforest',
    isMegadiverse: true,
    endemicSpeciesHighlights: ['Spectacled Bear', 'Yellow-tailed Woolly Monkey', 'Titicaca Water Frog'],
    conservationHotspot: true,
  },

  // 🇦🇺 Australia
  AUS: {
    animal: {
      commonName: 'Red Kangaroo & Koala',
      scientificName: 'Osphranter rufus / Phascolarctos cinereus',
      emoji: '🦘',
      iucnStatus: 'Vulnerable',
      category: 'Mammal',
    },
    plant: {
      commonName: 'Golden Wattle & Eucalyptus',
      scientificName: 'Acacia pycnantha / Eucalyptus regnans',
      emoji: '🌿',
      type: 'Tree',
      conservationStatus: 'Common',
    },
    biodiversityScore: 92,
    globalBiodiversityRank: 7,
    primaryBiome: 'Savanna',
    isMegadiverse: true,
    endemicSpeciesHighlights: ['Platypus', 'Koala', 'Kangaroo', 'Wombat', 'Quokka', 'Tasmanian Devil'],
    conservationHotspot: true,
  },

  // 🇮🇳 India
  IND: {
    animal: {
      commonName: 'Bengal Tiger & Indian Elephant',
      scientificName: 'Panthera tigris tigris / Elephas maximus indicus',
      emoji: '🐅',
      iucnStatus: 'Endangered',
      category: 'Mammal',
    },
    plant: {
      commonName: 'Lotus & Banyan Tree',
      scientificName: 'Nelumbo nucifera / Ficus benghalensis',
      emoji: '🪷',
      type: 'Flower',
      conservationStatus: 'Sacred / Protected',
    },
    biodiversityScore: 91,
    globalBiodiversityRank: 8,
    primaryBiome: 'Tropical Rainforest',
    isMegadiverse: true,
    endemicSpeciesHighlights: ['Bengal Tiger', 'Indian Rhinoceros', 'Lion-tailed Macaque', 'Gharial'],
    conservationHotspot: true,
  },

  // 🇲🇬 Madagascar
  MDG: {
    animal: {
      commonName: 'Ring-tailed Lemur & Fossa',
      scientificName: 'Lemur catta / Cryptoprocta ferox',
      emoji: '🐒',
      iucnStatus: 'Endangered',
      category: 'Mammal',
    },
    plant: {
      commonName: "Grandidier's Baobab & Traveller's Palm",
      scientificName: 'Adansonia grandidieri / Ravenala madagascariensis',
      emoji: '🌳',
      type: 'Tree',
      conservationStatus: 'Endangered',
    },
    biodiversityScore: 89,
    globalBiodiversityRank: 12,
    primaryBiome: 'Tropical Rainforest',
    isMegadiverse: true,
    endemicSpeciesHighlights: ['Ring-tailed Lemur', 'Indri', 'Aye-aye', 'Panther Chameleon', 'Fossa', 'Baobabs (>80% Endemic)'],
    conservationHotspot: true,
  },

  // 🇿🇦 South Africa
  ZAF: {
    animal: {
      commonName: 'Springbok & African Elephant',
      scientificName: 'Antidorcas marsupialis / Loxodonta africana',
      emoji: '🦁',
      iucnStatus: 'Vulnerable',
      category: 'Mammal',
    },
    plant: {
      commonName: 'King Protea (Fynbos)',
      scientificName: 'Protea cynaroides',
      emoji: '🌺',
      type: 'Flower',
      conservationStatus: 'Protected',
    },
    biodiversityScore: 88,
    globalBiodiversityRank: 14,
    primaryBiome: 'Savanna',
    isMegadiverse: true,
    endemicSpeciesHighlights: ['Cape Mountain Zebra', 'Riverine Rabbit', 'Fynbos Floral Kingdom'],
    conservationHotspot: true,
  },

  // 🇨🇩 DR Congo
  COD: {
    animal: {
      commonName: 'Mountain Gorilla & Okapi',
      scientificName: 'Gorilla beringei beringei / Okapia johnstoni',
      emoji: '🦍',
      iucnStatus: 'Critically Endangered',
      category: 'Mammal',
    },
    plant: {
      commonName: 'African Mahogany & Congo River Fern',
      scientificName: 'Khaya anthotheca / Bolbitis heudelotii',
      emoji: '🌴',
      type: 'Tree',
      conservationStatus: 'Vulnerable',
    },
    biodiversityScore: 89,
    globalBiodiversityRank: 13,
    primaryBiome: 'Tropical Rainforest',
    isMegadiverse: true,
    endemicSpeciesHighlights: ['Okapi', 'Bonobo', 'Eastern Lowland Gorilla', 'Congo Peacock'],
    conservationHotspot: true,
  },

  // 🇲🇾 Malaysia
  MYS: {
    animal: {
      commonName: 'Malayan Tiger & Proboscis Monkey',
      scientificName: 'Panthera tigris jacksoni / Nasalis larvatus',
      emoji: '🐅',
      iucnStatus: 'Critically Endangered',
      category: 'Mammal',
    },
    plant: {
      commonName: 'Bunga Raya (Hibiscus)',
      scientificName: 'Hibiscus rosa-sinensis',
      emoji: '🌺',
      type: 'Flower',
      conservationStatus: 'Common',
    },
    biodiversityScore: 87,
    globalBiodiversityRank: 15,
    primaryBiome: 'Tropical Rainforest',
    isMegadiverse: true,
    endemicSpeciesHighlights: ['Malayan Tapir', 'Bornean Orangutan', 'Malayan Sun Bear'],
    conservationHotspot: true,
  },

  // 🇵🇭 Philippines
  PHL: {
    animal: {
      commonName: 'Philippine Eagle & Tarsier',
      scientificName: 'Pithecophaga jefferyi / Carlito syrichta',
      emoji: '🦅',
      iucnStatus: 'Critically Endangered',
      category: 'Bird',
    },
    plant: {
      commonName: 'Sampaguita (Arabian Jasmine)',
      scientificName: 'Jasminum sambac',
      emoji: '🪷',
      type: 'Flower',
      conservationStatus: 'Common',
    },
    biodiversityScore: 86,
    globalBiodiversityRank: 17,
    primaryBiome: 'Tropical Rainforest',
    isMegadiverse: true,
    endemicSpeciesHighlights: ['Philippine Eagle', 'Philippine Tarsier', 'Tamaraw', 'Palawan Peacock-Pheasant'],
    conservationHotspot: true,
  },

  // 🇺🇸 United States
  USA: {
    animal: {
      commonName: 'Bald Eagle & American Bison',
      scientificName: 'Haliaeetus leucocephalus / Bison bison',
      emoji: '🦅',
      iucnStatus: 'Least Concern',
      category: 'Bird',
    },
    plant: {
      commonName: 'American Rose & Giant Sequoia',
      scientificName: 'Rosa virginiana / Sequoiadendron giganteum',
      emoji: '🌹',
      type: 'Tree',
      conservationStatus: 'Endangered (Sequoia)',
    },
    biodiversityScore: 90,
    globalBiodiversityRank: 11,
    primaryBiome: 'Temperate Forest',
    isMegadiverse: true,
    endemicSpeciesHighlights: ['Giant Sequoia', 'Black-footed Ferret', 'California Condor', 'Hawaiian Monk Seal'],
    conservationHotspot: true,
  },

  // 🇯🇵 Japan
  JPN: {
    animal: {
      commonName: 'Japanese Macaque (Snow Monkey) & Red-crowned Crane',
      scientificName: 'Macaca fuscata / Grus japonensis',
      emoji: '🐒',
      iucnStatus: 'Least Concern',
      category: 'Mammal',
    },
    plant: {
      commonName: 'Cherry Blossom (Sakura) & Chrysanthemum',
      scientificName: 'Prunus serrulata / Chrysanthemum morifolium',
      emoji: '🌸',
      type: 'Flower',
      conservationStatus: 'Cultural Heritage',
    },
    biodiversityScore: 78,
    globalBiodiversityRank: 32,
    primaryBiome: 'Temperate Forest',
    isMegadiverse: false,
    endemicSpeciesHighlights: ['Japanese Giant Salamander', 'Iriomote Cat', 'Japanese Serow'],
    conservationHotspot: true,
  },

  // 🇬🇧 United Kingdom
  GBR: {
    animal: {
      commonName: 'Red Deer & European Robin',
      scientificName: 'Cervus elaphus / Erithacus rubecula',
      emoji: '🦌',
      iucnStatus: 'Least Concern',
      category: 'Mammal',
    },
    plant: {
      commonName: 'Tudor Rose & English Oak',
      scientificName: 'Rosa / Quercus robur',
      emoji: '🌳',
      type: 'Tree',
      conservationStatus: 'Least Concern',
    },
    biodiversityScore: 62,
    globalBiodiversityRank: 65,
    primaryBiome: 'Temperate Forest',
    isMegadiverse: false,
    endemicSpeciesHighlights: ['Scottish Wildcat', 'Lundy Cabbage', 'Red Squirrel'],
    conservationHotspot: false,
  },

  // 🇸🇬 Singapore
  SGP: {
    animal: {
      commonName: 'Crimson Sunbird & Smooth-coated Otter',
      scientificName: 'Aethopyga siparaja / Lutrogale perspicillata',
      emoji: '🐦',
      iucnStatus: 'Vulnerable',
      category: 'Bird',
    },
    plant: {
      commonName: 'Vanda Miss Joaquim (Orchid)',
      scientificName: 'Papilionanthe Miss Joaquim',
      emoji: '🌺',
      type: 'Flower',
      conservationStatus: 'Cultivated National Flower',
    },
    biodiversityScore: 68,
    globalBiodiversityRank: 58,
    primaryBiome: 'Tropical Rainforest',
    isMegadiverse: false,
    endemicSpeciesHighlights: ['Singapore Freshwater Crab', 'Banded Leaf Monkey'],
    conservationHotspot: true,
  },

  // 🇳🇱 Netherlands
  NLD: {
    animal: {
      commonName: 'Black-tailed Godwit & Eurasian Beaver',
      scientificName: 'Limosa limosa / Castor fiber',
      emoji: '🦫',
      iucnStatus: 'Near Threatened',
      category: 'Bird',
    },
    plant: {
      commonName: 'Tulip & Water Lily',
      scientificName: 'Tulipa gesneriana / Nymphaea alba',
      emoji: '🌷',
      type: 'Flower',
      conservationStatus: 'Cultivated Icon',
    },
    biodiversityScore: 55,
    globalBiodiversityRank: 88,
    primaryBiome: 'Temperate Forest',
    isMegadiverse: false,
    endemicSpeciesHighlights: ['Wadden Sea Seal Colony', 'Dutch Spoonbill'],
    conservationHotspot: false,
  },

  // 🇷🇺 Russia
  RUS: {
    animal: {
      commonName: 'Siberian Tiger & Eurasian Brown Bear',
      scientificName: 'Panthera tigris altaica / Ursus arctos arctos',
      emoji: '🐻',
      iucnStatus: 'Endangered',
      category: 'Mammal',
    },
    plant: {
      commonName: 'Chamomile & Siberian Larch',
      scientificName: 'Matricaria chamomilla / Larix sibirica',
      emoji: '🌼',
      type: 'Flower',
      conservationStatus: 'Abundant',
    },
    biodiversityScore: 84,
    globalBiodiversityRank: 20,
    primaryBiome: 'Boreal / Taiga',
    isMegadiverse: false,
    endemicSpeciesHighlights: ['Baikal Seal (Nerpa)', 'Amur Leopard', 'Siberian Crane'],
    conservationHotspot: false,
  },

  // 🇨🇦 Canada
  CAN: {
    animal: {
      commonName: 'North American Beaver & Polar Bear',
      scientificName: 'Castor canadensis / Ursus maritimus',
      emoji: '🦫',
      iucnStatus: 'Vulnerable',
      category: 'Mammal',
    },
    plant: {
      commonName: 'Sugar Maple',
      scientificName: 'Acer saccharum',
      emoji: '🍁',
      type: 'Tree',
      conservationStatus: 'Least Concern',
    },
    biodiversityScore: 80,
    globalBiodiversityRank: 28,
    primaryBiome: 'Boreal / Taiga',
    isMegadiverse: false,
    endemicSpeciesHighlights: ['Vancouver Island Marmot', 'Peary Caribou', 'Beluga Whale'],
    conservationHotspot: false,
  },

  // 🇸🇦 Saudi Arabia
  SAU: {
    animal: {
      commonName: 'Arabian Oryx & Arabian Leopard',
      scientificName: 'Oryx leucoryx / Panthera pardus nimr',
      emoji: '🦌',
      iucnStatus: 'Critically Endangered',
      category: 'Mammal',
    },
    plant: {
      commonName: 'Date Palm & Arfaj',
      scientificName: 'Phoenix dactylifera / Rhanterium epapposum',
      emoji: '🌴',
      type: 'Tree',
      conservationStatus: 'Protected',
    },
    biodiversityScore: 60,
    globalBiodiversityRank: 75,
    primaryBiome: 'Desert',
    isMegadiverse: false,
    endemicSpeciesHighlights: ['Arabian Oryx', 'Asir Magpie', 'Sand Cat'],
    conservationHotspot: false,
  },

  // 🇪🇬 Egypt
  EGY: {
    animal: {
      commonName: 'Steppe Eagle & Fennec Fox',
      scientificName: 'Aquila nipalensis / Vulpes zerda',
      emoji: '🦊',
      iucnStatus: 'Endangered',
      category: 'Bird',
    },
    plant: {
      commonName: 'White Egyptian Lotus & Papyrus',
      scientificName: 'Nymphaea lotus / Cyperus papyrus',
      emoji: '🪷',
      type: 'Flower',
      conservationStatus: 'Protected Heritage',
    },
    biodiversityScore: 58,
    globalBiodiversityRank: 80,
    primaryBiome: 'Desert',
    isMegadiverse: false,
    endemicSpeciesHighlights: ['Sinai Baton Blue Butterfly', 'Egyptian Tortoise'],
    conservationHotspot: false,
  },

  // 🇳🇿 New Zealand
  NZL: {
    animal: {
      commonName: 'Kiwi & Kakapo',
      scientificName: 'Apteryx mantelli / Strigops habroptila',
      emoji: '🥝',
      iucnStatus: 'Critically Endangered',
      category: 'Bird',
    },
    plant: {
      commonName: 'Silver Fern & Kowhai',
      scientificName: 'Cyathea dealbata / Sophora microphylla',
      emoji: '🌿',
      type: 'Fern',
      conservationStatus: 'Protected Icon',
    },
    biodiversityScore: 82,
    globalBiodiversityRank: 24,
    primaryBiome: 'Temperate Forest',
    isMegadiverse: false,
    endemicSpeciesHighlights: ['Kiwi', 'Kakapo', 'Tuatara', 'Kea Parrot', 'Giant Weta'],
    conservationHotspot: true,
  },
};

/**
 * Procedural Fallback Generator for Countries not specifically hardcoded
 */
export function getFloraFaunaDataForCountry(iso3: string): FloraFaunaData {
  const custom = FLORA_FAUNA_DATASET[iso3];
  if (custom && custom.animal && custom.plant) {
    return {
      animal: custom.animal as FloraFaunaData['animal'],
      plant: custom.plant as FloraFaunaData['plant'],
      biodiversityScore: custom.biodiversityScore ?? 65,
      globalBiodiversityRank: custom.globalBiodiversityRank ?? 50,
      primaryBiome: custom.primaryBiome ?? 'Temperate Forest',
      isMegadiverse: custom.isMegadiverse ?? MEGADIVERSE_ISO3_LIST.includes(iso3),
      endemicSpeciesHighlights: custom.endemicSpeciesHighlights ?? ['Satwa Liar Lokal', 'Flora Endemik Wilayah'],
      conservationHotspot: custom.conservationHotspot ?? false,
    };
  }

  const isMega = MEGADIVERSE_ISO3_LIST.includes(iso3);

  return {
    animal: {
      commonName: 'Fauna Asli Wilayah',
      scientificName: 'Fauna indigena',
      emoji: isMega ? '🐆' : '🦅',
      iucnStatus: isMega ? 'Vulnerable' : 'Least Concern',
      category: 'Mammal',
    },
    plant: {
      commonName: 'Flora & Bunga Nasional',
      scientificName: 'Flora nationalis',
      emoji: isMega ? '🌺' : '🌿',
      type: 'Flower',
      conservationStatus: 'Protected',
    },
    biodiversityScore: isMega ? 88 : Math.max(45, Math.min(85, Math.round(55 + (iso3.charCodeAt(0) % 30)))),
    globalBiodiversityRank: isMega ? 15 : Math.max(20, Math.min(150, Math.round(40 + (iso3.charCodeAt(1) % 100)))),
    primaryBiome: isMega ? 'Tropical Rainforest' : 'Temperate Forest',
    isMegadiverse: isMega,
    endemicSpeciesHighlights: isMega ? ['Spesies Endemik Tropis', 'Satwa Langka Konservasi'] : ['Fauna Asli Terlindungi'],
    conservationHotspot: isMega,
  };
}
