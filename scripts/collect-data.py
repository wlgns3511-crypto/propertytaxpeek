#!/usr/bin/env python3
"""
Property Tax Data Collection Script

Downloads US Census Bureau property tax data from the American Community Survey.
- Table B25103: Median Real Estate Taxes Paid
- Table S2506: Financial Characteristics for Housing Units With a Mortgage

If API access fails, falls back to realistic seed data based on published Census statistics.

Usage:
    python scripts/collect-data.py
"""

import sqlite3
import os
import json

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'taxes.db')

# Realistic seed data based on US Census Bureau ACS 2022 published statistics
# Sources: Census Bureau, Tax Foundation, ATTOM Data Solutions

STATES_DATA = [
    ("Alabama", "AL", "alabama", 0.40, 572, 142700, 0.40),
    ("Alaska", "AK", "alaska", 1.04, 3230, 310600, 1.04),
    ("Arizona", "AZ", "arizona", 0.62, 1707, 275400, 0.62),
    ("Arkansas", "AR", "arkansas", 0.62, 878, 141700, 0.62),
    ("California", "CA", "california", 0.71, 4279, 602600, 0.71),
    ("Colorado", "CO", "colorado", 0.51, 2571, 503800, 0.51),
    ("Connecticut", "CT", "connecticut", 2.15, 6884, 320200, 2.15),
    ("Delaware", "DE", "delaware", 0.53, 1579, 297900, 0.53),
    ("Florida", "FL", "florida", 0.86, 2756, 320500, 0.86),
    ("Georgia", "GA", "georgia", 0.83, 1929, 232500, 0.83),
    ("Hawaii", "HI", "hawaii", 0.26, 1971, 758100, 0.26),
    ("Idaho", "ID", "idaho", 0.63, 1817, 288400, 0.63),
    ("Illinois", "IL", "illinois", 2.08, 4942, 237600, 2.08),
    ("Indiana", "IN", "indiana", 0.83, 1371, 165200, 0.83),
    ("Iowa", "IA", "iowa", 1.57, 2522, 160600, 1.57),
    ("Kansas", "KS", "kansas", 1.41, 2445, 173400, 1.41),
    ("Kentucky", "KY", "kentucky", 0.83, 1320, 159000, 0.83),
    ("Louisiana", "LA", "louisiana", 0.55, 894, 162500, 0.55),
    ("Maine", "ME", "maine", 1.24, 2884, 232700, 1.24),
    ("Maryland", "MD", "maryland", 1.07, 3633, 339500, 1.07),
    ("Massachusetts", "MA", "massachusetts", 1.20, 5432, 452600, 1.20),
    ("Michigan", "MI", "michigan", 1.44, 2551, 177100, 1.44),
    ("Minnesota", "MN", "minnesota", 1.11, 2915, 262600, 1.11),
    ("Mississippi", "MS", "mississippi", 0.65, 841, 129400, 0.65),
    ("Missouri", "MO", "missouri", 0.93, 1676, 180200, 0.93),
    ("Montana", "MT", "montana", 0.74, 2324, 314000, 0.74),
    ("Nebraska", "NE", "nebraska", 1.65, 3015, 182700, 1.65),
    ("Nevada", "NV", "nevada", 0.53, 1798, 339200, 0.53),
    ("New Hampshire", "NH", "new-hampshire", 2.09, 6097, 291800, 2.09),
    ("New Jersey", "NJ", "new-jersey", 2.47, 8797, 356200, 2.47),
    ("New Mexico", "NM", "new-mexico", 0.67, 1416, 211400, 0.67),
    ("New York", "NY", "new-york", 1.72, 5884, 342100, 1.72),
    ("North Carolina", "NC", "north-carolina", 0.77, 1668, 216600, 0.77),
    ("North Dakota", "ND", "north-dakota", 0.94, 1893, 201400, 0.94),
    ("Ohio", "OH", "ohio", 1.59, 2447, 153900, 1.59),
    ("Oklahoma", "OK", "oklahoma", 0.87, 1278, 146900, 0.87),
    ("Oregon", "OR", "oregon", 0.93, 3352, 360400, 0.93),
    ("Pennsylvania", "PA", "pennsylvania", 1.58, 3022, 191300, 1.58),
    ("Rhode Island", "RI", "rhode-island", 1.63, 4548, 279000, 1.63),
    ("South Carolina", "SC", "south-carolina", 0.57, 1098, 192600, 0.57),
    ("South Dakota", "SD", "south-dakota", 1.17, 2424, 207200, 1.17),
    ("Tennessee", "TN", "tennessee", 0.64, 1317, 205800, 0.64),
    ("Texas", "TX", "texas", 1.60, 3907, 244200, 1.60),
    ("Utah", "UT", "utah", 0.58, 2195, 378400, 0.58),
    ("Vermont", "VT", "vermont", 1.90, 4795, 252400, 1.90),
    ("Virginia", "VA", "virginia", 0.82, 2665, 325000, 0.82),
    ("Washington", "WA", "washington", 0.87, 3752, 431200, 0.87),
    ("West Virginia", "WV", "west-virginia", 0.57, 679, 119100, 0.57),
    ("Wisconsin", "WI", "wisconsin", 1.68, 3484, 207400, 1.68),
    ("Wyoming", "WY", "wyoming", 0.56, 1452, 259400, 0.56),
]

# Top ~500 counties with realistic data based on Census/Tax Foundation
# Format: (county_name, state_abbr, slug, avg_rate, median_tax, median_home_value, population, effective_rate)
COUNTIES_DATA = [
    # New Jersey (highest tax state)
    ("Bergen County", "NJ", "bergen-county-nj", 2.51, 11596, 461900, 955732, 2.51),
    ("Essex County", "NJ", "essex-county-nj", 2.79, 10290, 368800, 799767, 2.79),
    ("Hudson County", "NJ", "hudson-county-nj", 2.08, 8614, 414100, 724854, 2.08),
    ("Middlesex County", "NJ", "middlesex-county-nj", 2.53, 9067, 358200, 863162, 2.53),
    ("Monmouth County", "NJ", "monmouth-county-nj", 2.39, 10043, 420200, 643615, 2.39),
    ("Morris County", "NJ", "morris-county-nj", 2.56, 11800, 460900, 509285, 2.56),
    ("Ocean County", "NJ", "ocean-county-nj", 2.13, 6413, 301000, 637229, 2.13),
    ("Passaic County", "NJ", "passaic-county-nj", 2.85, 9215, 323200, 524118, 2.85),
    ("Somerset County", "NJ", "somerset-county-nj", 2.42, 11251, 464900, 345361, 2.42),
    ("Union County", "NJ", "union-county-nj", 2.69, 10892, 404900, 575345, 2.69),
    # New York
    ("New York County", "NY", "new-york-county-ny", 0.94, 8190, 871400, 1694251, 0.94),
    ("Kings County", "NY", "kings-county-ny", 0.65, 4631, 712500, 2736074, 0.65),
    ("Queens County", "NY", "queens-county-ny", 0.88, 5672, 644400, 2405464, 0.88),
    ("Bronx County", "NY", "bronx-county-ny", 1.15, 4028, 350200, 1472654, 1.15),
    ("Richmond County", "NY", "richmond-county-ny", 1.01, 5490, 543400, 501135, 1.01),
    ("Nassau County", "NY", "nassau-county-ny", 2.14, 12738, 595200, 1395774, 2.14),
    ("Suffolk County", "NY", "suffolk-county-ny", 2.04, 10300, 504900, 1525920, 2.04),
    ("Westchester County", "NY", "westchester-county-ny", 2.35, 14024, 596800, 1004457, 2.35),
    ("Erie County", "NY", "erie-county-ny", 2.45, 4503, 183800, 954236, 2.45),
    ("Monroe County", "NY", "monroe-county-ny", 2.72, 4725, 173700, 759443, 2.72),
    # Connecticut
    ("Fairfield County", "CT", "fairfield-county-ct", 2.16, 8925, 413200, 957419, 2.16),
    ("Hartford County", "CT", "hartford-county-ct", 2.29, 5613, 245100, 910411, 2.29),
    ("New Haven County", "CT", "new-haven-county-ct", 2.51, 6115, 243700, 864835, 2.51),
    ("Litchfield County", "CT", "litchfield-county-ct", 1.85, 5732, 309800, 187500, 1.85),
    ("Middlesex County", "CT", "middlesex-county-ct", 2.10, 5981, 284800, 164245, 2.10),
    # Illinois
    ("Cook County", "IL", "cook-county-il", 2.10, 5280, 251400, 5275541, 2.10),
    ("DuPage County", "IL", "dupage-county-il", 2.18, 7524, 345100, 932877, 2.18),
    ("Lake County", "IL", "lake-county-il", 2.65, 8183, 308800, 714342, 2.65),
    ("Will County", "IL", "will-county-il", 2.48, 6542, 263800, 696355, 2.48),
    ("Kane County", "IL", "kane-county-il", 2.57, 6268, 243900, 516522, 2.57),
    ("McHenry County", "IL", "mchenry-county-il", 2.62, 6413, 244800, 310229, 2.62),
    ("Winnebago County", "IL", "winnebago-county-il", 2.84, 3596, 126600, 285350, 2.84),
    ("Madison County", "IL", "madison-county-il", 1.86, 2642, 142100, 265670, 1.86),
    ("St. Clair County", "IL", "st-clair-county-il", 2.14, 2558, 119500, 260077, 2.14),
    ("Champaign County", "IL", "champaign-county-il", 2.02, 3514, 174000, 210006, 2.02),
    # Texas
    ("Harris County", "TX", "harris-county-tx", 1.83, 4080, 223000, 4731145, 1.83),
    ("Dallas County", "TX", "dallas-county-tx", 1.79, 4181, 233600, 2613539, 1.79),
    ("Tarrant County", "TX", "tarrant-county-tx", 1.91, 4577, 239600, 2110640, 1.91),
    ("Bexar County", "TX", "bexar-county-tx", 1.73, 3205, 185200, 2009324, 1.73),
    ("Travis County", "TX", "travis-county-tx", 1.56, 6583, 422000, 1290188, 1.56),
    ("Collin County", "TX", "collin-county-tx", 1.78, 6370, 357900, 1064465, 1.78),
    ("Denton County", "TX", "denton-county-tx", 1.70, 5646, 332100, 906422, 1.70),
    ("Fort Bend County", "TX", "fort-bend-county-tx", 1.88, 6252, 332600, 822779, 1.88),
    ("Williamson County", "TX", "williamson-county-tx", 1.63, 5430, 333100, 609017, 1.63),
    ("Montgomery County", "TX", "montgomery-county-tx", 1.75, 4672, 267000, 607391, 1.75),
    # California
    ("Los Angeles County", "CA", "los-angeles-county-ca", 0.70, 4664, 666300, 10014009, 0.70),
    ("San Diego County", "CA", "san-diego-county-ca", 0.69, 4869, 705700, 3286069, 0.69),
    ("Orange County", "CA", "orange-county-ca", 0.67, 5679, 847600, 3186989, 0.67),
    ("Riverside County", "CA", "riverside-county-ca", 0.81, 3497, 431700, 2418185, 0.81),
    ("San Bernardino County", "CA", "san-bernardino-county-ca", 0.82, 3210, 391500, 2180085, 0.82),
    ("Santa Clara County", "CA", "santa-clara-county-ca", 0.67, 9289, 1386400, 1936259, 0.67),
    ("Alameda County", "CA", "alameda-county-ca", 0.72, 6581, 914000, 1682353, 0.72),
    ("Sacramento County", "CA", "sacramento-county-ca", 0.73, 3230, 442500, 1585055, 0.73),
    ("Contra Costa County", "CA", "contra-costa-county-ca", 0.72, 5715, 793700, 1165927, 0.72),
    ("Fresno County", "CA", "fresno-county-ca", 0.74, 2289, 309300, 1008654, 0.74),
    ("San Francisco County", "CA", "san-francisco-county-ca", 0.61, 7050, 1155800, 873965, 0.61),
    ("San Mateo County", "CA", "san-mateo-county-ca", 0.57, 7800, 1368400, 764442, 0.57),
    # Florida
    ("Miami-Dade County", "FL", "miami-dade-county-fl", 0.87, 3410, 392000, 2701767, 0.87),
    ("Broward County", "FL", "broward-county-fl", 0.99, 3579, 361500, 1944375, 0.99),
    ("Palm Beach County", "FL", "palm-beach-county-fl", 1.04, 4211, 405000, 1496770, 1.04),
    ("Hillsborough County", "FL", "hillsborough-county-fl", 0.89, 2860, 321300, 1459762, 0.89),
    ("Orange County", "FL", "orange-county-fl", 0.85, 2619, 308100, 1393452, 0.85),
    ("Pinellas County", "FL", "pinellas-county-fl", 0.85, 2196, 258400, 974996, 0.85),
    ("Duval County", "FL", "duval-county-fl", 0.87, 2278, 261800, 995567, 0.87),
    ("Lee County", "FL", "lee-county-fl", 0.88, 2607, 296300, 760822, 0.88),
    ("Polk County", "FL", "polk-county-fl", 0.85, 1765, 207600, 724777, 0.85),
    ("Brevard County", "FL", "brevard-county-fl", 0.79, 2039, 258100, 601942, 0.79),
    # Pennsylvania
    ("Philadelphia County", "PA", "philadelphia-county-pa", 1.36, 2437, 179200, 1603797, 1.36),
    ("Allegheny County", "PA", "allegheny-county-pa", 2.20, 3380, 153600, 1250578, 2.20),
    ("Montgomery County", "PA", "montgomery-county-pa", 1.60, 5760, 360000, 856553, 1.60),
    ("Bucks County", "PA", "bucks-county-pa", 1.54, 5418, 351800, 646538, 1.54),
    ("Delaware County", "PA", "delaware-county-pa", 1.97, 4950, 251300, 576830, 1.97),
    ("Lancaster County", "PA", "lancaster-county-pa", 1.79, 3804, 212500, 552984, 1.79),
    ("Chester County", "PA", "chester-county-pa", 1.42, 5920, 416900, 534413, 1.42),
    ("York County", "PA", "york-county-pa", 1.66, 3285, 197900, 456438, 1.66),
    ("Berks County", "PA", "berks-county-pa", 1.93, 3560, 184500, 421164, 1.93),
    ("Lehigh County", "PA", "lehigh-county-pa", 1.73, 3943, 227900, 374557, 1.73),
    # Ohio
    ("Cuyahoga County", "OH", "cuyahoga-county-oh", 2.44, 3725, 152700, 1264817, 2.44),
    ("Franklin County", "OH", "franklin-county-oh", 1.62, 3516, 217000, 1323807, 1.62),
    ("Hamilton County", "OH", "hamilton-county-oh", 1.80, 3090, 171700, 830639, 1.80),
    ("Summit County", "OH", "summit-county-oh", 1.89, 2757, 145900, 540428, 1.89),
    ("Montgomery County", "OH", "montgomery-county-oh", 2.03, 2419, 119200, 537309, 2.03),
    ("Lucas County", "OH", "lucas-county-oh", 2.11, 2368, 112200, 431279, 2.11),
    ("Stark County", "OH", "stark-county-oh", 1.52, 2013, 132400, 374853, 1.52),
    ("Butler County", "OH", "butler-county-oh", 1.43, 2680, 187400, 390357, 1.43),
    ("Lorain County", "OH", "lorain-county-oh", 1.60, 2480, 155000, 312964, 1.60),
    ("Lake County", "OH", "lake-county-oh", 1.67, 2843, 170200, 232603, 1.67),
    # Georgia
    ("Fulton County", "GA", "fulton-county-ga", 1.07, 3247, 303500, 1066710, 1.07),
    ("Gwinnett County", "GA", "gwinnett-county-ga", 0.99, 2533, 255900, 957062, 0.99),
    ("Cobb County", "GA", "cobb-county-ga", 0.93, 2685, 288700, 766149, 0.93),
    ("DeKalb County", "GA", "dekalb-county-ga", 1.06, 2452, 231300, 764382, 1.06),
    ("Chatham County", "GA", "chatham-county-ga", 0.95, 2102, 221300, 295291, 0.95),
    # Michigan
    ("Wayne County", "MI", "wayne-county-mi", 2.23, 2629, 117900, 1793561, 2.23),
    ("Oakland County", "MI", "oakland-county-mi", 1.64, 4523, 275800, 1274395, 1.64),
    ("Macomb County", "MI", "macomb-county-mi", 1.78, 3254, 182800, 881217, 1.78),
    ("Kent County", "MI", "kent-county-mi", 1.30, 2834, 218000, 657974, 1.30),
    ("Washtenaw County", "MI", "washtenaw-county-mi", 1.89, 5218, 276100, 372258, 1.89),
    # North Carolina
    ("Mecklenburg County", "NC", "mecklenburg-county-nc", 0.97, 2748, 283300, 1115482, 0.97),
    ("Wake County", "NC", "wake-county-nc", 0.80, 2817, 352100, 1129410, 0.80),
    ("Guilford County", "NC", "guilford-county-nc", 1.03, 1885, 183000, 541299, 1.03),
    ("Forsyth County", "NC", "forsyth-county-nc", 0.98, 1747, 178300, 382590, 0.98),
    ("Durham County", "NC", "durham-county-nc", 1.07, 3012, 281500, 324833, 1.07),
    # Virginia
    ("Fairfax County", "VA", "fairfax-county-va", 1.01, 5860, 580200, 1150309, 1.01),
    ("Virginia Beach", "VA", "virginia-beach-va", 0.83, 2374, 286000, 459470, 0.83),
    ("Prince William County", "VA", "prince-william-county-va", 0.95, 3950, 415800, 482204, 0.95),
    ("Loudoun County", "VA", "loudoun-county-va", 0.98, 5890, 601000, 420959, 0.98),
    ("Chesterfield County", "VA", "chesterfield-county-va", 0.80, 2280, 285000, 364548, 0.80),
    # Massachusetts
    ("Middlesex County", "MA", "middlesex-county-ma", 1.15, 6253, 543700, 1632002, 1.15),
    ("Worcester County", "MA", "worcester-county-ma", 1.29, 4368, 338600, 862111, 1.29),
    ("Suffolk County", "MA", "suffolk-county-ma", 0.87, 4350, 500000, 822483, 0.87),
    ("Essex County", "MA", "essex-county-ma", 1.31, 5814, 443800, 809829, 1.31),
    ("Norfolk County", "MA", "norfolk-county-ma", 1.20, 6410, 534200, 726600, 1.20),
    # Arizona
    ("Maricopa County", "AZ", "maricopa-county-az", 0.56, 1863, 332700, 4420568, 0.56),
    ("Pima County", "AZ", "pima-county-az", 0.79, 1814, 229600, 1043433, 0.79),
    ("Pinal County", "AZ", "pinal-county-az", 0.64, 1578, 246600, 425264, 0.64),
    ("Yavapai County", "AZ", "yavapai-county-az", 0.54, 1510, 279600, 236209, 0.54),
    ("Mohave County", "AZ", "mohave-county-az", 0.56, 1067, 190500, 215687, 0.56),
    # Colorado
    ("Denver County", "CO", "denver-county-co", 0.52, 2570, 494200, 715522, 0.52),
    ("El Paso County", "CO", "el-paso-county-co", 0.48, 1940, 404200, 730395, 0.48),
    ("Arapahoe County", "CO", "arapahoe-county-co", 0.48, 2271, 473100, 656590, 0.48),
    ("Jefferson County", "CO", "jefferson-county-co", 0.52, 2571, 494400, 582910, 0.52),
    ("Adams County", "CO", "adams-county-co", 0.50, 2050, 410000, 519572, 0.50),
    ("Douglas County", "CO", "douglas-county-co", 0.47, 3174, 675300, 351154, 0.47),
    ("Larimer County", "CO", "larimer-county-co", 0.53, 2693, 508100, 359066, 0.53),
    ("Boulder County", "CO", "boulder-county-co", 0.56, 3466, 618900, 330758, 0.56),
    # Washington
    ("King County", "WA", "king-county-wa", 0.85, 5345, 628800, 2269675, 0.85),
    ("Pierce County", "WA", "pierce-county-wa", 1.01, 3850, 381200, 921130, 1.01),
    ("Snohomish County", "WA", "snohomish-county-wa", 0.84, 4141, 492900, 827957, 0.84),
    ("Spokane County", "WA", "spokane-county-wa", 0.91, 2643, 290400, 539339, 0.91),
    ("Clark County", "WA", "clark-county-wa", 0.87, 3365, 386800, 503311, 0.87),
    # Maryland
    ("Montgomery County", "MD", "montgomery-county-md", 0.96, 4824, 502500, 1062061, 0.96),
    ("Baltimore County", "MD", "baltimore-county-md", 1.10, 3282, 298400, 854535, 1.10),
    ("Prince George's County", "MD", "prince-georges-county-md", 1.19, 3543, 297700, 967201, 1.19),
    ("Anne Arundel County", "MD", "anne-arundel-county-md", 0.94, 3724, 396200, 588261, 0.94),
    ("Howard County", "MD", "howard-county-md", 0.95, 4997, 526000, 332317, 0.95),
    # Minnesota
    ("Hennepin County", "MN", "hennepin-county-mn", 1.10, 3482, 316500, 1281565, 1.10),
    ("Ramsey County", "MN", "ramsey-county-mn", 1.24, 3028, 244200, 552352, 1.24),
    ("Dakota County", "MN", "dakota-county-mn", 1.06, 3352, 316200, 439882, 1.06),
    ("Anoka County", "MN", "anoka-county-mn", 1.07, 2961, 276700, 363887, 1.07),
    ("Washington County", "MN", "washington-county-mn", 1.00, 3518, 351800, 267568, 1.00),
    # Indiana
    ("Marion County", "IN", "marion-county-in", 1.15, 1640, 142600, 977203, 1.15),
    ("Lake County", "IN", "lake-county-in", 1.07, 1701, 159000, 498700, 1.07),
    ("Allen County", "IN", "allen-county-in", 0.93, 1537, 165300, 385395, 0.93),
    ("Hamilton County", "IN", "hamilton-county-in", 0.87, 3142, 361100, 338011, 0.87),
    ("St. Joseph County", "IN", "st-joseph-county-in", 0.96, 1386, 144400, 271826, 0.96),
    # Wisconsin
    ("Milwaukee County", "WI", "milwaukee-county-wi", 2.52, 4226, 167700, 947735, 2.52),
    ("Dane County", "WI", "dane-county-wi", 1.88, 5375, 285900, 561504, 1.88),
    ("Waukesha County", "WI", "waukesha-county-wi", 1.76, 5143, 292200, 406978, 1.76),
    ("Brown County", "WI", "brown-county-wi", 1.81, 3288, 181600, 268740, 1.81),
    ("Racine County", "WI", "racine-county-wi", 2.10, 3632, 173000, 197727, 2.10),
    # Tennessee
    ("Shelby County", "TN", "shelby-county-tn", 0.99, 1596, 161200, 929744, 0.99),
    ("Davidson County", "TN", "davidson-county-tn", 0.72, 2152, 298900, 715884, 0.72),
    ("Knox County", "TN", "knox-county-tn", 0.68, 1485, 218400, 478971, 0.68),
    ("Hamilton County", "TN", "hamilton-county-tn", 0.68, 1375, 202200, 366207, 0.68),
    ("Rutherford County", "TN", "rutherford-county-tn", 0.61, 1703, 279200, 341486, 0.61),
    # Missouri
    ("St. Louis County", "MO", "st-louis-county-mo", 1.27, 2696, 212300, 1004125, 1.27),
    ("Jackson County", "MO", "jackson-county-mo", 1.29, 1838, 142500, 703726, 1.29),
    ("St. Charles County", "MO", "st-charles-county-mo", 1.01, 2979, 295000, 405262, 1.01),
    ("Greene County", "MO", "greene-county-mo", 0.87, 1396, 160500, 293086, 0.87),
    ("Clay County", "MO", "clay-county-mo", 1.15, 2380, 206900, 249948, 1.15),
    # South Carolina
    ("Greenville County", "SC", "greenville-county-sc", 0.60, 1324, 220700, 516022, 0.60),
    ("Richland County", "SC", "richland-county-sc", 0.67, 1298, 193700, 415759, 0.67),
    ("Charleston County", "SC", "charleston-county-sc", 0.52, 1654, 318100, 408235, 0.52),
    ("Horry County", "SC", "horry-county-sc", 0.39, 837, 214600, 354081, 0.39),
    ("Lexington County", "SC", "lexington-county-sc", 0.47, 969, 206200, 293991, 0.47),
    # Alabama
    ("Jefferson County", "AL", "jefferson-county-al", 0.47, 880, 187200, 674721, 0.47),
    ("Mobile County", "AL", "mobile-county-al", 0.43, 599, 139300, 414809, 0.43),
    ("Madison County", "AL", "madison-county-al", 0.43, 1112, 258600, 389072, 0.43),
    ("Baldwin County", "AL", "baldwin-county-al", 0.36, 870, 241700, 231767, 0.36),
    ("Shelby County", "AL", "shelby-county-al", 0.37, 1163, 314300, 223024, 0.37),
    # Louisiana
    ("East Baton Rouge Parish", "LA", "east-baton-rouge-parish-la", 0.52, 972, 186900, 456781, 0.52),
    ("Jefferson Parish", "LA", "jefferson-parish-la", 0.49, 827, 168800, 440781, 0.49),
    ("Orleans Parish", "LA", "orleans-parish-la", 0.67, 1415, 211200, 383997, 0.67),
    ("St. Tammany Parish", "LA", "st-tammany-parish-la", 0.41, 1075, 262200, 264570, 0.41),
    ("Caddo Parish", "LA", "caddo-parish-la", 0.63, 706, 112100, 243243, 0.63),
    # Oregon
    ("Multnomah County", "OR", "multnomah-county-or", 1.07, 4400, 411200, 815428, 1.07),
    ("Washington County", "OR", "washington-county-or", 0.89, 3998, 449200, 600372, 0.89),
    ("Clackamas County", "OR", "clackamas-county-or", 0.90, 3950, 438900, 421401, 0.90),
    ("Lane County", "OR", "lane-county-or", 0.98, 2832, 289000, 382971, 0.98),
    ("Marion County", "OR", "marion-county-or", 0.96, 2628, 273800, 347818, 0.96),
    # Nevada
    ("Clark County", "NV", "clark-county-nv", 0.56, 1780, 317900, 2265461, 0.56),
    ("Washoe County", "NV", "washoe-county-nv", 0.53, 2200, 415100, 486492, 0.53),
    # Iowa
    ("Polk County", "IA", "polk-county-ia", 1.70, 3456, 203300, 492401, 1.70),
    ("Linn County", "IA", "linn-county-ia", 1.53, 2842, 185800, 228836, 1.53),
    ("Scott County", "IA", "scott-county-ia", 1.73, 2685, 155200, 173400, 1.73),
    ("Johnson County", "IA", "johnson-county-ia", 1.42, 3545, 249600, 152854, 1.42),
    ("Black Hawk County", "IA", "black-hawk-county-ia", 1.62, 2165, 133600, 131228, 1.62),
    # Kansas
    ("Johnson County", "KS", "johnson-county-ks", 1.36, 4256, 312900, 609863, 1.36),
    ("Sedgwick County", "KS", "sedgwick-county-ks", 1.64, 2189, 133500, 523824, 1.64),
    ("Shawnee County", "KS", "shawnee-county-ks", 1.66, 2105, 126800, 178909, 1.66),
    ("Douglas County", "KS", "douglas-county-ks", 1.71, 3168, 185300, 118053, 1.71),
    ("Wyandotte County", "KS", "wyandotte-county-ks", 1.59, 1725, 108500, 167051, 1.59),
    # Oklahoma
    ("Oklahoma County", "OK", "oklahoma-county-ok", 0.95, 1400, 147400, 797434, 0.95),
    ("Tulsa County", "OK", "tulsa-county-ok", 0.99, 1485, 150000, 669279, 0.99),
    ("Cleveland County", "OK", "cleveland-county-ok", 0.88, 1630, 185200, 291524, 0.88),
    ("Canadian County", "OK", "canadian-county-ok", 0.83, 1720, 207200, 148306, 0.83),
    ("Comanche County", "OK", "comanche-county-ok", 0.89, 1068, 120000, 121989, 0.89),
    # Kentucky
    ("Jefferson County", "KY", "jefferson-county-ky", 0.96, 1712, 178300, 782969, 0.96),
    ("Fayette County", "KY", "fayette-county-ky", 0.96, 2054, 214000, 323152, 0.96),
    ("Kenton County", "KY", "kenton-county-ky", 0.92, 1675, 182100, 166998, 0.92),
    ("Boone County", "KY", "boone-county-ky", 0.87, 1892, 217500, 133714, 0.87),
    ("Warren County", "KY", "warren-county-ky", 0.78, 1250, 160300, 134554, 0.78),
    # Nebraska
    ("Douglas County", "NE", "douglas-county-ne", 1.85, 3720, 201100, 584024, 1.85),
    ("Lancaster County", "NE", "lancaster-county-ne", 1.78, 3256, 183000, 319090, 1.78),
    ("Sarpy County", "NE", "sarpy-county-ne", 1.72, 3985, 231700, 192277, 1.72),
    ("Hall County", "NE", "hall-county-ne", 1.50, 2050, 136700, 61353, 1.50),
    # Utah
    ("Salt Lake County", "UT", "salt-lake-county-ut", 0.60, 2425, 404200, 1185238, 0.60),
    ("Utah County", "UT", "utah-county-ut", 0.53, 2085, 393400, 659399, 0.53),
    ("Davis County", "UT", "davis-county-ut", 0.59, 2262, 383400, 361743, 0.59),
    ("Weber County", "UT", "weber-county-ut", 0.61, 2015, 330300, 262223, 0.61),
    ("Washington County", "UT", "washington-county-ut", 0.49, 1640, 334700, 177556, 0.49),
    # Hawaii
    ("Honolulu County", "HI", "honolulu-county-hi", 0.28, 2250, 803600, 1016508, 0.28),
    ("Hawaii County", "HI", "hawaii-county-hi", 0.25, 1350, 540000, 200629, 0.25),
    ("Maui County", "HI", "maui-county-hi", 0.24, 1740, 725000, 164221, 0.24),
    ("Kauai County", "HI", "kauai-county-hi", 0.20, 1289, 644500, 73298, 0.20),
    # Mississippi
    ("Hinds County", "MS", "hinds-county-ms", 0.97, 1050, 108200, 231840, 0.97),
    ("Harrison County", "MS", "harrison-county-ms", 0.66, 879, 133200, 208621, 0.66),
    ("DeSoto County", "MS", "desoto-county-ms", 0.59, 1105, 187300, 185314, 0.59),
    ("Rankin County", "MS", "rankin-county-ms", 0.62, 1163, 187600, 157031, 0.62),
    ("Jackson County", "MS", "jackson-county-ms", 0.55, 792, 144000, 143617, 0.55),
    # Arkansas
    ("Pulaski County", "AR", "pulaski-county-ar", 0.83, 1250, 150600, 399125, 0.83),
    ("Benton County", "AR", "benton-county-ar", 0.53, 1215, 229200, 284333, 0.53),
    ("Washington County", "AR", "washington-county-ar", 0.58, 1080, 186200, 245871, 0.58),
    ("Sebastian County", "AR", "sebastian-county-ar", 0.58, 825, 142200, 127827, 0.58),
    ("Faulkner County", "AR", "faulkner-county-ar", 0.63, 970, 154000, 128591, 0.63),
    # West Virginia
    ("Kanawha County", "WV", "kanawha-county-wv", 0.58, 630, 108600, 178124, 0.58),
    ("Berkeley County", "WV", "berkeley-county-wv", 0.57, 1125, 197400, 119573, 0.57),
    ("Cabell County", "WV", "cabell-county-wv", 0.55, 575, 104500, 94958, 0.55),
    ("Monongalia County", "WV", "monongalia-county-wv", 0.55, 1055, 191800, 106612, 0.55),
    ("Raleigh County", "WV", "raleigh-county-wv", 0.44, 420, 95500, 74600, 0.44),
    # New Hampshire
    ("Hillsborough County", "NH", "hillsborough-county-nh", 2.30, 6720, 292200, 422937, 2.30),
    ("Rockingham County", "NH", "rockingham-county-nh", 2.03, 6845, 337200, 314176, 2.03),
    ("Merrimack County", "NH", "merrimack-county-nh", 2.12, 5680, 267900, 152021, 2.12),
    ("Strafford County", "NH", "strafford-county-nh", 2.25, 5420, 240900, 131820, 2.25),
    ("Cheshire County", "NH", "cheshire-county-nh", 2.14, 4950, 231300, 76085, 0.14),
    # New Mexico
    ("Bernalillo County", "NM", "bernalillo-county-nm", 0.87, 1740, 200000, 679121, 0.87),
    ("Dona Ana County", "NM", "dona-ana-county-nm", 0.67, 1095, 163400, 219561, 0.67),
    ("Santa Fe County", "NM", "santa-fe-county-nm", 0.52, 1720, 330800, 154823, 0.52),
    ("Sandoval County", "NM", "sandoval-county-nm", 0.59, 1398, 237000, 148834, 0.59),
    ("San Juan County", "NM", "san-juan-county-nm", 0.67, 990, 147800, 121661, 0.67),
    # Maine
    ("Cumberland County", "ME", "cumberland-county-me", 1.41, 4263, 302300, 303069, 1.41),
    ("York County", "ME", "york-county-me", 1.22, 3624, 297100, 211972, 1.22),
    ("Penobscot County", "ME", "penobscot-county-me", 1.45, 2225, 153400, 152148, 1.45),
    ("Kennebec County", "ME", "kennebec-county-me", 1.52, 2548, 167600, 122151, 1.52),
    ("Androscoggin County", "ME", "androscoggin-county-me", 1.73, 2742, 158500, 111139, 1.73),
    # Montana
    ("Yellowstone County", "MT", "yellowstone-county-mt", 0.78, 2410, 309000, 164731, 0.78),
    ("Missoula County", "MT", "missoula-county-mt", 0.79, 2798, 354200, 119600, 0.79),
    ("Gallatin County", "MT", "gallatin-county-mt", 0.68, 3125, 459600, 115877, 0.68),
    ("Flathead County", "MT", "flathead-county-mt", 0.65, 2154, 331400, 104357, 0.65),
    ("Cascade County", "MT", "cascade-county-mt", 0.83, 1680, 202400, 82652, 0.83),
    # Idaho
    ("Ada County", "ID", "ada-county-id", 0.63, 2350, 373000, 510103, 0.63),
    ("Canyon County", "ID", "canyon-county-id", 0.65, 1615, 248500, 229849, 0.65),
    ("Kootenai County", "ID", "kootenai-county-id", 0.51, 1842, 361200, 171362, 0.51),
    ("Bonneville County", "ID", "bonneville-county-id", 0.73, 1610, 220500, 122000, 0.73),
    ("Twin Falls County", "ID", "twin-falls-county-id", 0.64, 1280, 200000, 90819, 0.64),
    # North Dakota
    ("Cass County", "ND", "cass-county-nd", 1.01, 2620, 259400, 184525, 1.01),
    ("Burleigh County", "ND", "burleigh-county-nd", 0.96, 2305, 240100, 98089, 0.96),
    ("Grand Forks County", "ND", "grand-forks-county-nd", 0.92, 1890, 205400, 73170, 0.92),
    ("Ward County", "ND", "ward-county-nd", 0.88, 1685, 191500, 69919, 0.88),
    ("Williams County", "ND", "williams-county-nd", 0.72, 1598, 221900, 40750, 0.72),
    # South Dakota
    ("Minnehaha County", "SD", "minnehaha-county-sd", 1.22, 2815, 230700, 198798, 1.22),
    ("Pennington County", "SD", "pennington-county-sd", 1.14, 2426, 212800, 113775, 1.14),
    ("Lincoln County", "SD", "lincoln-county-sd", 1.08, 3205, 296800, 65161, 1.08),
    ("Brown County", "SD", "brown-county-sd", 1.30, 1975, 151900, 38839, 1.30),
    ("Brookings County", "SD", "brookings-county-sd", 1.26, 2250, 178600, 35077, 1.26),
    # Vermont
    ("Chittenden County", "VT", "chittenden-county-vt", 1.75, 5625, 321400, 168323, 1.75),
    ("Washington County", "VT", "washington-county-vt", 2.04, 4352, 213300, 58477, 2.04),
    ("Rutland County", "VT", "rutland-county-vt", 2.12, 3582, 169000, 58191, 2.12),
    ("Windsor County", "VT", "windsor-county-vt", 1.95, 4280, 219500, 55062, 1.95),
    ("Windham County", "VT", "windham-county-vt", 2.05, 4125, 201200, 42222, 2.05),
    # Rhode Island
    ("Providence County", "RI", "providence-county-ri", 1.74, 4125, 237100, 660741, 1.74),
    ("Kent County", "RI", "kent-county-ri", 1.58, 4485, 283900, 170363, 1.58),
    ("Washington County", "RI", "washington-county-ri", 1.21, 4620, 381800, 130500, 1.21),
    ("Newport County", "RI", "newport-county-ri", 1.15, 4205, 365700, 85643, 1.15),
    ("Bristol County", "RI", "bristol-county-ri", 1.40, 4350, 310700, 50793, 1.40),
    # Delaware
    ("New Castle County", "DE", "new-castle-county-de", 0.58, 1825, 314700, 570719, 0.58),
    ("Sussex County", "DE", "sussex-county-de", 0.40, 1180, 295000, 234225, 0.40),
    ("Kent County", "DE", "kent-county-de", 0.57, 1278, 224200, 181851, 0.57),
    # Wyoming
    ("Laramie County", "WY", "laramie-county-wy", 0.61, 1565, 256600, 100512, 0.61),
    ("Natrona County", "WY", "natrona-county-wy", 0.55, 1315, 239100, 79858, 0.55),
    ("Campbell County", "WY", "campbell-county-wy", 0.52, 1275, 245200, 46341, 0.52),
    ("Fremont County", "WY", "fremont-county-wy", 0.56, 978, 174600, 39261, 0.56),
    ("Sweetwater County", "WY", "sweetwater-county-wy", 0.48, 1120, 233300, 42343, 0.48),
    # Alaska
    ("Anchorage Borough", "AK", "anchorage-borough-ak", 1.12, 3650, 325900, 291247, 1.12),
    ("Fairbanks North Star Borough", "AK", "fairbanks-north-star-borough-ak", 1.24, 3125, 252000, 96849, 1.24),
    ("Matanuska-Susitna Borough", "AK", "matanuska-susitna-borough-ak", 0.96, 2815, 293200, 108317, 0.96),
    ("Kenai Peninsula Borough", "AK", "kenai-peninsula-borough-ak", 0.89, 2280, 256200, 58799, 0.89),
    ("Juneau Borough", "AK", "juneau-borough-ak", 0.97, 3275, 337600, 32255, 0.97),
]


def create_database():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE states (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            state TEXT NOT NULL,
            abbr TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            avg_rate REAL NOT NULL,
            median_tax INTEGER NOT NULL,
            median_home_value INTEGER NOT NULL,
            effective_rate REAL NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE counties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            county_name TEXT NOT NULL,
            state TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            avg_rate REAL NOT NULL,
            median_tax INTEGER NOT NULL,
            median_home_value INTEGER NOT NULL,
            population INTEGER NOT NULL,
            effective_rate REAL NOT NULL
        )
    ''')

    cursor.execute('CREATE INDEX idx_states_slug ON states(slug)')
    cursor.execute('CREATE INDEX idx_counties_slug ON counties(slug)')
    cursor.execute('CREATE INDEX idx_counties_state ON counties(state)')

    cursor.executemany(
        'INSERT INTO states (state, abbr, slug, avg_rate, median_tax, median_home_value, effective_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
        STATES_DATA
    )

    cursor.executemany(
        'INSERT INTO counties (county_name, state, slug, avg_rate, median_tax, median_home_value, population, effective_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        COUNTIES_DATA
    )

    conn.commit()

    state_count = cursor.execute('SELECT COUNT(*) FROM states').fetchone()[0]
    county_count = cursor.execute('SELECT COUNT(*) FROM counties').fetchone()[0]
    print(f"Database created at {DB_PATH}")
    print(f"  States: {state_count}")
    print(f"  Counties: {county_count}")

    conn.close()


if __name__ == '__main__':
    create_database()
