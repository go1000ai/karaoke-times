/**
 * Real latitude/longitude coordinates for all karaoke venues.
 * Keyed by street address for unique lookups (some venues share names but have different locations).
 * Kept in a separate file so coordinates survive CSV re-syncs of mock-data.ts.
 */
export const VENUE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // ─── BROOKLYN ───
  "1179 Elton Street": { lat: 40.6465, lng: -73.8760 },
  "5814 Clarendon Road": { lat: 40.6538, lng: -73.9160 },
  "911 Broadway": { lat: 40.6935, lng: -73.9326 },
  "4807 Church Ave": { lat: 40.6500, lng: -73.9220 },
  "5501 Glenwood Road": { lat: 40.6420, lng: -73.9050 },
  "774 Flatbush Avenue": { lat: 40.6604, lng: -73.9615 },
  "768 Franklin Avenue": { lat: 40.6720, lng: -73.9570 },
  "683 5th Avenue": { lat: 40.6608, lng: -73.9820 },
  "5505 Church Avenue": { lat: 40.6498, lng: -73.9180 },
  "445 Troutman Street": { lat: 40.7020, lng: -73.9170 },
  "630 Flatbush Ave": { lat: 40.6612, lng: -73.9619 },
  "644 Sackett St": { lat: 40.6783, lng: -73.9893 },
  "358 Columbia Street": { lat: 40.6790, lng: -73.9990 },
  "8920 Avenue D": { lat: 40.6350, lng: -73.8930 },
  "559 Lorimer Street": { lat: 40.7128, lng: -73.9505 },
  "4703 Church Ave": { lat: 40.6505, lng: -73.9240 },
  "79 Grand Street": { lat: 40.7115, lng: -73.9655 },
  "80 Lafayette Ave": { lat: 40.6875, lng: -73.9748 },
  "227 Rogers Avenue": { lat: 40.6625, lng: -73.9530 },
  "5419 Church Avenue": { lat: 40.6498, lng: -73.9195 },
  "279 Flatbush Ave": { lat: 40.6808, lng: -73.9765 },
  "1343 Utica Avenue": { lat: 40.6438, lng: -73.9310 },
  "1039 Surf Avenue": { lat: 40.5742, lng: -73.9815 },
  "444 7th Ave": { lat: 40.6650, lng: -73.9822 },
  "220 Wyckoff Ave": { lat: 40.7055, lng: -73.9120 },
  "600 Metropolitan Ave": { lat: 40.7143, lng: -73.9445 },
  "328 Douglass Street": { lat: 40.6800, lng: -73.9870 },
  "266 Irving Ave": { lat: 40.6963, lng: -73.9198 },
  "8812-14 4th Avenue": { lat: 40.6205, lng: -74.0283 },
  "502 East 95th Street": { lat: 40.6410, lng: -73.9120 },
  "4112 Avenue D": { lat: 40.6360, lng: -73.9250 },
  "1107 Nostrand Avenue": { lat: 40.6625, lng: -73.9500 },
  "1130 East 92nd Street": { lat: 40.6430, lng: -73.9060 },
  "1133 Clarkson Avenue": { lat: 40.6532, lng: -73.9250 },
  "1662 Atlantic Avenue": { lat: 40.6790, lng: -73.9340 },
  "6 Wyckoff Ave": { lat: 40.7118, lng: -73.9225 },
  "73 Atlantic Ave": { lat: 40.6886, lng: -74.0008 },
  "333 Flatbush Avenue": { lat: 40.6762, lng: -73.9695 },
  "1401 Bedford Ave": { lat: 40.6685, lng: -73.9540 },
  "1466 St John's Place": { lat: 40.6725, lng: -73.9282 },
  "577 Flatbush Avenue": { lat: 40.6618, lng: -73.9618 },
  "560 5th Avenue": { lat: 40.6632, lng: -73.9832 },
  "765 Utica Ave": { lat: 40.6605, lng: -73.9310 },
  "225 Rogers Avenue": { lat: 40.6626, lng: -73.9530 },
  "2142 Fulton Street": { lat: 40.6798, lng: -73.9195 },
  "233 Starr Street": { lat: 40.7040, lng: -73.9200 },
  "171 East 42nd Street": { lat: 40.6435, lng: -73.9280 },

  // ─── MANHATTAN / NEW YORK ───
  "174 Orchard Street": { lat: 40.7210, lng: -73.9885 },
  "3493 Broadway": { lat: 40.8228, lng: -73.9476 },
  "17 John Street": { lat: 40.7082, lng: -74.0065 },
  "710 Amsterdam Avenue": { lat: 40.7925, lng: -73.9720 },
  "253 West 47th Street": { lat: 40.7595, lng: -73.9870 },
  "81 Avenue A": { lat: 40.7253, lng: -73.9838 },
  "9 St Marks Place": { lat: 40.7280, lng: -73.9895 },
  "186 West 4th Street": { lat: 40.7325, lng: -74.0010 },
  "152 Orchard Street": { lat: 40.7195, lng: -73.9892 },
  "23 W 32nd Street": { lat: 40.7480, lng: -73.9870 },
  "246 W 54th Street": { lat: 40.7640, lng: -73.9840 },
  "6 West 28th Street Floor 2": { lat: 40.7450, lng: -73.9885 },
  "727 7th Avenue": { lat: 40.7590, lng: -73.9840 },

  // ─── HARLEM ───
  "2361 Adam Clayton Powell Junior Blvd": { lat: 40.8175, lng: -73.9398 },
  "325 Lenox Ave": { lat: 40.8105, lng: -73.9435 },

  // ─── QUEENS ───
  "114-45 Lefferts Blvd": { lat: 40.6665, lng: -73.8355 },
  "133-10 Cross Bay Blvd": { lat: 40.6723, lng: -73.8435 },
  "222-02 Merrick Blvd": { lat: 40.6655, lng: -73.7430 },
  "702 Seneca Ave": { lat: 40.7025, lng: -73.9066 },
  "253-32 Northern Boulevard": { lat: 40.7653, lng: -73.7280 },
  "64-14 Flushing Avenue": { lat: 40.7175, lng: -73.8990 },
  "10-50 44th Drive": { lat: 40.7475, lng: -73.9210 },
  "68-38 Forest Ave": { lat: 40.7100, lng: -73.8775 },
  "32-46 Steinway Street": { lat: 40.7625, lng: -73.9180 },
  "25-30 Broadway": { lat: 40.7610, lng: -73.9215 },
  "135-25 Northern Boulevard": { lat: 40.7636, lng: -73.8293 },
  "247-77 Jericho Turnpike": { lat: 40.7358, lng: -73.7260 },

  // ─── BRONX ───
  "3151 East Tremont Ave": { lat: 40.8408, lng: -73.8380 },
  "3604 East Tremont Avenue": { lat: 40.8420, lng: -73.8290 },
  "2245 Westchester Avenue": { lat: 40.8265, lng: -73.8615 },
  "918 East 233 Street": { lat: 40.8910, lng: -73.8565 },

  // ─── STATEN ISLAND ───
  "4116 Hylan Boulevard 2nd Floor": { lat: 40.5480, lng: -74.1375 },

  // ─── WESTCHESTER ───
  "790 Mclean Avenue": { lat: 40.8910, lng: -73.8750 },
  "106 West 1st Street": { lat: 40.9115, lng: -73.8375 },
  "6 Roosevelt Square West": { lat: 40.9122, lng: -73.8367 },
  "123 N Main St": { lat: 40.9920, lng: -73.6650 },

  // ─── LONG ISLAND ───
  "401 Sunrise Highway": { lat: 40.7095, lng: -73.3055 },
  "226 Higbee Lane": { lat: 40.7058, lng: -73.2968 },
  "924 Hillside Ave": { lat: 40.7360, lng: -73.6850 },
  "1217 Jericho Turnpike": { lat: 40.7350, lng: -73.6730 },
  "990 Middle Country Rd": { lat: 40.8660, lng: -73.0430 },
  "4780 Sunrise Highway": { lat: 40.7655, lng: -73.1175 },
  "2819 North Jerusalem Road": { lat: 40.7315, lng: -73.5520 },
  "109 Front Street": { lat: 40.6790, lng: -73.4515 },
  "706 Main Street": { lat: 40.7160, lng: -73.4420 },
  "2552 Hempstead Turnpike": { lat: 40.7225, lng: -73.5400 },
  "1241 Middle Country Road": { lat: 40.8825, lng: -72.9530 },
  "33 Main Street": { lat: 40.6430, lng: -73.6690 },
  "282 East Jericho Turnpike": { lat: 40.8330, lng: -73.3910 },

  // ─── ASTORIA (address overlap with Queens above, these use "Broadway" Astoria) ───
  // Already covered above via Queens section
};

/**
 * Look up coordinates for a venue by its street address.
 * Returns { lat, lng } or null if not found.
 */
export function getVenueCoordinates(address: string): { lat: number; lng: number } | null {
  return VENUE_COORDINATES[address] ?? null;
}
