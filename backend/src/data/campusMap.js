/**
 * Anchor OS — Campus Map Data
 *
 * Building-to-building walking times (in minutes), building clusters,
 * and meetup-friendly locations on campus.
 *
 * This is synthetic data for the MVP. In production, this would come
 * from a campus GIS system or manually curated dataset.
 */

// Building identifiers used across the system
export const BUILDINGS = {
  PSYCH_HALL: 'Psych Hall',
  ECON_BUILDING: 'Econ Building',
  SCIENCE_HALL: 'Science Hall',
  TECH_CENTER: 'Tech Center',
  LIBERAL_ARTS: 'Liberal Arts',
  FINE_ARTS: 'Fine Arts',
  LIBRARY_EAST: 'Library East',
  LIBRARY_WEST: 'Library West',
  STUDENT_COMMONS: 'Student Commons',
  PARKING_LOT_B: 'Parking Lot B'
};

// Building clusters — buildings within the same area of campus
export const BUILDING_CLUSTERS = {
  north: ['Science Hall', 'Tech Center', 'Library West'],
  central: ['Student Commons', 'Econ Building', 'Liberal Arts', 'Library East'],
  south: ['Psych Hall', 'Fine Arts'],
  edges: ['Parking Lot B']
};

// Which cluster does a building belong to?
export function getCluster(building) {
  for (const [cluster, buildings] of Object.entries(BUILDING_CLUSTERS)) {
    if (buildings.some(b => building?.toLowerCase().includes(b.toLowerCase()))) {
      return cluster;
    }
  }
  return 'unknown';
}

// Walking time matrix (minutes) between building pairs.
// Symmetric: walkTime(A, B) === walkTime(B, A)
const WALK_TIMES = {
  'Psych Hall|Econ Building': 6,
  'Psych Hall|Science Hall': 8,
  'Psych Hall|Tech Center': 9,
  'Psych Hall|Liberal Arts': 5,
  'Psych Hall|Fine Arts': 3,
  'Psych Hall|Library East': 4,
  'Psych Hall|Library West': 10,
  'Psych Hall|Student Commons': 5,
  'Psych Hall|Parking Lot B': 12,

  'Econ Building|Science Hall': 5,
  'Econ Building|Tech Center': 6,
  'Econ Building|Liberal Arts': 3,
  'Econ Building|Fine Arts': 7,
  'Econ Building|Library East': 3,
  'Econ Building|Library West': 7,
  'Econ Building|Student Commons': 2,
  'Econ Building|Parking Lot B': 10,

  'Science Hall|Tech Center': 3,
  'Science Hall|Liberal Arts': 6,
  'Science Hall|Fine Arts': 10,
  'Science Hall|Library East': 7,
  'Science Hall|Library West': 2,
  'Science Hall|Student Commons': 5,
  'Science Hall|Parking Lot B': 8,

  'Tech Center|Liberal Arts': 7,
  'Tech Center|Fine Arts': 11,
  'Tech Center|Library East': 8,
  'Tech Center|Library West': 3,
  'Tech Center|Student Commons': 6,
  'Tech Center|Parking Lot B': 7,

  'Liberal Arts|Fine Arts': 5,
  'Liberal Arts|Library East': 4,
  'Liberal Arts|Library West': 8,
  'Liberal Arts|Student Commons': 2,
  'Liberal Arts|Parking Lot B': 11,

  'Fine Arts|Library East': 5,
  'Fine Arts|Library West': 11,
  'Fine Arts|Student Commons': 6,
  'Fine Arts|Parking Lot B': 14,

  'Library East|Library West': 9,
  'Library East|Student Commons': 3,
  'Library East|Parking Lot B': 11,

  'Library West|Student Commons': 7,
  'Library West|Parking Lot B': 6,

  'Student Commons|Parking Lot B': 9
};

/**
 * Get walking time between two buildings in minutes.
 * Returns 0 if same building, -1 if unknown pair.
 */
export function getWalkTime(buildingA, buildingB) {
  if (!buildingA || !buildingB) return -1;

  const a = normalizeBuildingName(buildingA);
  const b = normalizeBuildingName(buildingB);

  if (a === b) return 0;

  const key1 = `${a}|${b}`;
  const key2 = `${b}|${a}`;

  return WALK_TIMES[key1] ?? WALK_TIMES[key2] ?? -1;
}

/**
 * Normalize building name variants to canonical names.
 */
function normalizeBuildingName(name) {
  if (!name) return '';
  const lower = name.toLowerCase().trim();

  const aliases = {
    'psych hall': 'Psych Hall',
    'psych hall lobby': 'Psych Hall',
    'psychology hall': 'Psych Hall',
    'econ building': 'Econ Building',
    'econ building lobby': 'Econ Building',
    'economics building': 'Econ Building',
    'science hall': 'Science Hall',
    'science hall atrium': 'Science Hall',
    'tech center': 'Tech Center',
    'tech center café': 'Tech Center',
    'tech center cafe': 'Tech Center',
    'liberal arts': 'Liberal Arts',
    'fine arts': 'Fine Arts',
    'fine arts café': 'Fine Arts',
    'fine arts cafe': 'Fine Arts',
    'library east': 'Library East',
    'library west': 'Library West',
    'student commons': 'Student Commons',
    'parking lot b': 'Parking Lot B'
  };

  return aliases[lower] || name;
}

/**
 * Meetup-friendly spots near or inside each building.
 * Ranked by emotional ease (lobby > café > study area > hidden room).
 */
export const MEETUP_SPOTS = {
  'Psych Hall': [
    { name: 'Psych Hall Lobby', type: 'lobby', emotionalEase: 0.9 },
    { name: 'Psych Hall 2nd Floor Lounge', type: 'lounge', emotionalEase: 0.7 }
  ],
  'Econ Building': [
    { name: 'Econ Building Lobby', type: 'lobby', emotionalEase: 0.9 },
    { name: 'Econ Building Atrium', type: 'atrium', emotionalEase: 0.85 }
  ],
  'Science Hall': [
    { name: 'Science Hall Atrium', type: 'atrium', emotionalEase: 0.9 },
    { name: 'Science Hall Ground Floor Tables', type: 'study_area', emotionalEase: 0.8 }
  ],
  'Tech Center': [
    { name: 'Tech Center Café', type: 'café', emotionalEase: 0.92 },
    { name: 'Tech Center Lobby', type: 'lobby', emotionalEase: 0.85 }
  ],
  'Liberal Arts': [
    { name: 'Liberal Arts Lobby', type: 'lobby', emotionalEase: 0.88 },
    { name: 'Liberal Arts Courtyard', type: 'outdoor', emotionalEase: 0.82 }
  ],
  'Fine Arts': [
    { name: 'Fine Arts Café', type: 'café', emotionalEase: 0.9 },
    { name: 'Fine Arts Gallery Entrance', type: 'lobby', emotionalEase: 0.75 }
  ],
  'Library East': [
    { name: 'Library East Entrance', type: 'lobby', emotionalEase: 0.92 },
    { name: 'Library East Ground Floor', type: 'study_area', emotionalEase: 0.85 }
  ],
  'Library West': [
    { name: 'Library West Entrance', type: 'lobby', emotionalEase: 0.9 },
    { name: 'Library West Café Corner', type: 'café', emotionalEase: 0.88 }
  ],
  'Student Commons': [
    { name: 'Student Commons Main Hall', type: 'commons', emotionalEase: 0.95 },
    { name: 'Student Commons Café', type: 'café', emotionalEase: 0.9 }
  ]
};

/**
 * Get all feasible meetup spots within a walking radius for a set of buildings.
 * Returns spots sorted by average convenience across all participants.
 */
export function getFeasibleMeetupSpots(participantBuildings, maxWalkMinutes = 8) {
  const allSpots = [];

  for (const [building, spots] of Object.entries(MEETUP_SPOTS)) {
    for (const spot of spots) {
      const walkTimes = participantBuildings.map(pb => getWalkTime(pb, building));

      // Skip if any participant has unknown walk time
      if (walkTimes.some(t => t < 0)) continue;

      const maxWalk = Math.max(...walkTimes);
      const avgWalk = walkTimes.reduce((a, b) => a + b, 0) / walkTimes.length;

      // Skip if any participant walks too far
      if (maxWalk > maxWalkMinutes) continue;

      // Same-building bonus
      const sameBuilding = participantBuildings.some(pb =>
        normalizeBuildingName(pb) === building
      );

      // Same-cluster bonus
      const clusters = participantBuildings.map(getCluster);
      const spotCluster = getCluster(building);
      const sameCluster = clusters.some(c => c === spotCluster);

      allSpots.push({
        ...spot,
        building,
        walkTimesByParticipant: walkTimes,
        maxWalk,
        avgWalk,
        sameBuilding,
        sameCluster,
        // Composite score: lower is better
        score: (
          (sameBuilding ? 0 : 2) +
          avgWalk * 0.5 +
          maxWalk * 0.3 +
          (1 - spot.emotionalEase) * 3 +
          (sameCluster ? 0 : 1.5)
        )
      });
    }
  }

  return allSpots.sort((a, b) => a.score - b.score);
}

/**
 * Determine route type between origin and meetup building.
 */
export function getRouteType(originBuilding, meetupBuilding) {
  const walkTime = getWalkTime(originBuilding, meetupBuilding);
  if (walkTime === 0) return 'same_building';
  if (walkTime <= 3) return 'same_cluster';

  const originCluster = getCluster(originBuilding);
  const meetupCluster = getCluster(meetupBuilding);
  if (originCluster === meetupCluster) return 'same_cluster';
  if (walkTime <= 5) return 'on_path';
  return 'short_detour';
}
