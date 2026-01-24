export type CountryTzInfo = {
  capital: string;
  timeZone: string; // IANA timezone
};

export function normalizeCountryName(name: string) {
  return (name || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ");
}

/**
 * NOTE: This intentionally uses the CAPITAL city's timezone as a proxy.
 * Countries with multiple time zones (USA, Canada, Brazil, Russia, Australia, etc.)
 * will be "close enough" for a travel blog vibe — but not perfect.
 */
export const COUNTRY_TZ: Record<string, CountryTzInfo> = {
  // ===== Europe =====
  [normalizeCountryName("Albania")]: { capital: "Tirana", timeZone: "Europe/Tirane" },
  [normalizeCountryName("Andorra")]: { capital: "Andorra la Vella", timeZone: "Europe/Andorra" },
  [normalizeCountryName("Austria")]: { capital: "Vienna", timeZone: "Europe/Vienna" },
  [normalizeCountryName("Belarus")]: { capital: "Minsk", timeZone: "Europe/Minsk" },
  [normalizeCountryName("Belgium")]: { capital: "Brussels", timeZone: "Europe/Brussels" },
  [normalizeCountryName("Bosnia")]: { capital: "Sarajevo", timeZone: "Europe/Sarajevo" },
  [normalizeCountryName("Bosnia and Herzegovina")]: { capital: "Sarajevo", timeZone: "Europe/Sarajevo" },
  [normalizeCountryName("Bulgaria")]: { capital: "Sofia", timeZone: "Europe/Sofia" },
  [normalizeCountryName("Croatia")]: { capital: "Zagreb", timeZone: "Europe/Zagreb" },
  [normalizeCountryName("Cyprus")]: { capital: "Nicosia", timeZone: "Asia/Nicosia" },
  [normalizeCountryName("Czechia")]: { capital: "Prague", timeZone: "Europe/Prague" },
  [normalizeCountryName("Czech Republic")]: { capital: "Prague", timeZone: "Europe/Prague" },
  [normalizeCountryName("Denmark")]: { capital: "Copenhagen", timeZone: "Europe/Copenhagen" },
  [normalizeCountryName("Estonia")]: { capital: "Tallinn", timeZone: "Europe/Tallinn" },
  [normalizeCountryName("Finland")]: { capital: "Helsinki", timeZone: "Europe/Helsinki" },
  [normalizeCountryName("France")]: { capital: "Paris", timeZone: "Europe/Paris" },
  [normalizeCountryName("Germany")]: { capital: "Berlin", timeZone: "Europe/Berlin" },
  [normalizeCountryName("Greece")]: { capital: "Athens", timeZone: "Europe/Athens" },
  [normalizeCountryName("Hungary")]: { capital: "Budapest", timeZone: "Europe/Budapest" },
  [normalizeCountryName("Iceland")]: { capital: "Reykjavík", timeZone: "Atlantic/Reykjavik" },
  [normalizeCountryName("Ireland")]: { capital: "Dublin", timeZone: "Europe/Dublin" },
  [normalizeCountryName("Italy")]: { capital: "Rome", timeZone: "Europe/Rome" },
  [normalizeCountryName("Latvia")]: { capital: "Riga", timeZone: "Europe/Riga" },
  [normalizeCountryName("Liechtenstein")]: { capital: "Vaduz", timeZone: "Europe/Vaduz" },
  [normalizeCountryName("Lithuania")]: { capital: "Vilnius", timeZone: "Europe/Vilnius" },
  [normalizeCountryName("Luxembourg")]: { capital: "Luxembourg", timeZone: "Europe/Luxembourg" },
  [normalizeCountryName("Malta")]: { capital: "Valletta", timeZone: "Europe/Malta" },
  [normalizeCountryName("Moldova")]: { capital: "Chișinău", timeZone: "Europe/Chisinau" },
  [normalizeCountryName("Monaco")]: { capital: "Monaco", timeZone: "Europe/Monaco" },
  [normalizeCountryName("Montenegro")]: { capital: "Podgorica", timeZone: "Europe/Podgorica" },
  [normalizeCountryName("Netherlands")]: { capital: "Amsterdam", timeZone: "Europe/Amsterdam" },
  [normalizeCountryName("Norway")]: { capital: "Oslo", timeZone: "Europe/Oslo" },
  [normalizeCountryName("Poland")]: { capital: "Warsaw", timeZone: "Europe/Warsaw" },
  [normalizeCountryName("Portugal")]: { capital: "Lisbon", timeZone: "Europe/Lisbon" },
  [normalizeCountryName("Romania")]: { capital: "Bucharest", timeZone: "Europe/Bucharest" },
  [normalizeCountryName("Russia")]: { capital: "Moscow", timeZone: "Europe/Moscow" },
  [normalizeCountryName("San Marino")]: { capital: "San Marino", timeZone: "Europe/Rome" },
  [normalizeCountryName("SanMarino")]: { capital: "San Marino", timeZone: "Europe/Rome" },
  [normalizeCountryName("Serbia")]: { capital: "Belgrade", timeZone: "Europe/Belgrade" },
  [normalizeCountryName("Slovakia")]: { capital: "Bratislava", timeZone: "Europe/Bratislava" },
  [normalizeCountryName("Slovenia")]: { capital: "Ljubljana", timeZone: "Europe/Ljubljana" },
  [normalizeCountryName("Spain")]: { capital: "Madrid", timeZone: "Europe/Madrid" },
  [normalizeCountryName("Sweden")]: { capital: "Stockholm", timeZone: "Europe/Stockholm" },
  [normalizeCountryName("Switzerland")]: { capital: "Bern", timeZone: "Europe/Zurich" },
  [normalizeCountryName("Ukraine")]: { capital: "Kyiv", timeZone: "Europe/Kyiv" },
  [normalizeCountryName("United Kingdom")]: { capital: "London", timeZone: "Europe/London" },
  [normalizeCountryName("UK")]: { capital: "London", timeZone: "Europe/London" },
  [normalizeCountryName("England")]: { capital: "London", timeZone: "Europe/London" },
  [normalizeCountryName("Scotland")]: { capital: "Edinburgh", timeZone: "Europe/London" },
  [normalizeCountryName("Wales")]: { capital: "Cardiff", timeZone: "Europe/London" },
  [normalizeCountryName("Vatican")]: { capital: "Vatican City", timeZone: "Europe/Rome" },
  [normalizeCountryName("Vatican City")]: { capital: "Vatican City", timeZone: "Europe/Rome" },

  // ===== Asia =====
  [normalizeCountryName("Afghanistan")]: { capital: "Kabul", timeZone: "Asia/Kabul" },
  [normalizeCountryName("Armenia")]: { capital: "Yerevan", timeZone: "Asia/Yerevan" },
  [normalizeCountryName("Azerbaijan")]: { capital: "Baku", timeZone: "Asia/Baku" },
  [normalizeCountryName("Bahrain")]: { capital: "Manama", timeZone: "Asia/Bahrain" },
  [normalizeCountryName("Bangladesh")]: { capital: "Dhaka", timeZone: "Asia/Dhaka" },
  [normalizeCountryName("Bhutan")]: { capital: "Thimphu", timeZone: "Asia/Thimphu" },
  [normalizeCountryName("Brunei")]: { capital: "Bandar Seri Begawan", timeZone: "Asia/Brunei" },
  [normalizeCountryName("Cambodia")]: { capital: "Phnom Penh", timeZone: "Asia/Phnom_Penh" },
  [normalizeCountryName("China")]: { capital: "Beijing", timeZone: "Asia/Shanghai" },
  [normalizeCountryName("Georgia")]: { capital: "Tbilisi", timeZone: "Asia/Tbilisi" },
  [normalizeCountryName("Hong Kong")]: { capital: "Hong Kong", timeZone: "Asia/Hong_Kong" },
  [normalizeCountryName("HongKong")]: { capital: "Hong Kong", timeZone: "Asia/Hong_Kong" },
  [normalizeCountryName("India")]: { capital: "New Delhi", timeZone: "Asia/Kolkata" },
  [normalizeCountryName("Indonesia")]: { capital: "Jakarta", timeZone: "Asia/Jakarta" },
  [normalizeCountryName("Iran")]: { capital: "Tehran", timeZone: "Asia/Tehran" },
  [normalizeCountryName("Iraq")]: { capital: "Baghdad", timeZone: "Asia/Baghdad" },
  [normalizeCountryName("Israel")]: { capital: "Jerusalem", timeZone: "Asia/Jerusalem" },
  [normalizeCountryName("Japan")]: { capital: "Tokyo", timeZone: "Asia/Tokyo" },
  [normalizeCountryName("Jordan")]: { capital: "Amman", timeZone: "Asia/Amman" },
  [normalizeCountryName("Kazakhstan")]: { capital: "Astana", timeZone: "Asia/Almaty" },
  [normalizeCountryName("Kuwait")]: { capital: "Kuwait City", timeZone: "Asia/Kuwait" },
  [normalizeCountryName("Kyrgyzstan")]: { capital: "Bishkek", timeZone: "Asia/Bishkek" },
  [normalizeCountryName("Laos")]: { capital: "Vientiane", timeZone: "Asia/Vientiane" },
  [normalizeCountryName("Lebanon")]: { capital: "Beirut", timeZone: "Asia/Beirut" },
  [normalizeCountryName("Malaysia")]: { capital: "Kuala Lumpur", timeZone: "Asia/Kuala_Lumpur" },
  [normalizeCountryName("Maldives")]: { capital: "Malé", timeZone: "Indian/Maldives" },
  [normalizeCountryName("Mongolia")]: { capital: "Ulaanbaatar", timeZone: "Asia/Ulaanbaatar" },
  [normalizeCountryName("Myanmar")]: { capital: "Naypyidaw", timeZone: "Asia/Yangon" },
  [normalizeCountryName("Nepal")]: { capital: "Kathmandu", timeZone: "Asia/Kathmandu" },
  [normalizeCountryName("North Korea")]: { capital: "Pyongyang", timeZone: "Asia/Pyongyang" },
  [normalizeCountryName("Oman")]: { capital: "Muscat", timeZone: "Asia/Muscat" },
  [normalizeCountryName("Pakistan")]: { capital: "Islamabad", timeZone: "Asia/Karachi" },
  [normalizeCountryName("Philippines")]: { capital: "Manila", timeZone: "Asia/Manila" },
  [normalizeCountryName("Qatar")]: { capital: "Doha", timeZone: "Asia/Qatar" },
  [normalizeCountryName("Saudi Arabia")]: { capital: "Riyadh", timeZone: "Asia/Riyadh" },
  [normalizeCountryName("Singapore")]: { capital: "Singapore", timeZone: "Asia/Singapore" },
  [normalizeCountryName("South Korea")]: { capital: "Seoul", timeZone: "Asia/Seoul" },
  [normalizeCountryName("Korea")]: { capital: "Seoul", timeZone: "Asia/Seoul" },
  [normalizeCountryName("Sri Lanka")]: { capital: "Sri Jayawardenepura Kotte", timeZone: "Asia/Colombo" },
  [normalizeCountryName("Syria")]: { capital: "Damascus", timeZone: "Asia/Damascus" },
  [normalizeCountryName("Taiwan")]: { capital: "Taipei", timeZone: "Asia/Taipei" },
  [normalizeCountryName("Tajikistan")]: { capital: "Dushanbe", timeZone: "Asia/Dushanbe" },
  [normalizeCountryName("Thailand")]: { capital: "Bangkok", timeZone: "Asia/Bangkok" },
  [normalizeCountryName("Turkey")]: { capital: "Ankara", timeZone: "Europe/Istanbul" },
  [normalizeCountryName("Turkmenistan")]: { capital: "Ashgabat", timeZone: "Asia/Ashgabat" },
  [normalizeCountryName("UAE")]: { capital: "Abu Dhabi", timeZone: "Asia/Dubai" },
  [normalizeCountryName("United Arab Emirates")]: { capital: "Abu Dhabi", timeZone: "Asia/Dubai" },
  [normalizeCountryName("Uzbekistan")]: { capital: "Tashkent", timeZone: "Asia/Tashkent" },
  [normalizeCountryName("Vietnam")]: { capital: "Hanoi", timeZone: "Asia/Ho_Chi_Minh" },
  [normalizeCountryName("Yemen")]: { capital: "Sana'a", timeZone: "Asia/Aden" },

  // ===== Americas / Other =====
  [normalizeCountryName("USA")]: { capital: "Washington, D.C.", timeZone: "America/New_York" },
  [normalizeCountryName("United States")]: { capital: "Washington, D.C.", timeZone: "America/New_York" },
  [normalizeCountryName("Canada")]: { capital: "Ottawa", timeZone: "America/Toronto" },
  [normalizeCountryName("Mexico")]: { capital: "Mexico City", timeZone: "America/Mexico_City" },
  [normalizeCountryName("Brazil")]: { capital: "Brasília", timeZone: "America/Sao_Paulo" },
  [normalizeCountryName("Argentina")]: { capital: "Buenos Aires", timeZone: "America/Argentina/Buenos_Aires" },
  [normalizeCountryName("Chile")]: { capital: "Santiago", timeZone: "America/Santiago" },
  [normalizeCountryName("Peru")]: { capital: "Lima", timeZone: "America/Lima" },
  [normalizeCountryName("Colombia")]: { capital: "Bogotá", timeZone: "America/Bogota" },
  [normalizeCountryName("Australia")]: { capital: "Canberra", timeZone: "Australia/Sydney" },
  [normalizeCountryName("New Zealand")]: { capital: "Wellington", timeZone: "Pacific/Auckland" },
  [normalizeCountryName("Egypt")]: { capital: "Cairo", timeZone: "Africa/Cairo" },
  [normalizeCountryName("Morocco")]: { capital: "Rabat", timeZone: "Africa/Casablanca" },
  [normalizeCountryName("South Africa")]: { capital: "Pretoria", timeZone: "Africa/Johannesburg" },
};

export function getCapitalTzForCountry(country?: string | null): CountryTzInfo | null {
  if (!country) return null;
  const key = normalizeCountryName(country);
  return COUNTRY_TZ[key] ?? null;
}
