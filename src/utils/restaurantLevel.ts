import { CustomerFeedback, RestaurantLevelInfo, RestaurantLevelTier } from '../types';

export interface RestaurantLevelDefinition {
  tier: RestaurantLevelTier;
  levelNumber: 1 | 2 | 3 | 4 | 5;
  title: string;
  shortLabel: string;
  subtitle: string;
  minScore: number;
  isAtRisk: boolean;
}

export const RESTAURANT_LEVEL_SCALE: RestaurantLevelDefinition[] = [
  {
    tier: 'critical',
    levelNumber: 1,
    title: 'Diqqat talab',
    shortLabel: '1-daraja',
    subtitle: 'Past reyting — xizmat va oshxona sifatini zudlik bilan nazorat qiling',
    minScore: 0,
    isAtRisk: true,
  },
  {
    tier: 'bronze',
    levelNumber: 2,
    title: 'Bronza Daraja',
    shortLabel: '2-daraja',
    subtitle: "O'rtacha baho — Kumush darajaga chiqish uchun 4.0★ dan oshiring",
    minScore: 3.0,
    isAtRisk: true,
  },
  {
    tier: 'silver',
    levelNumber: 3,
    title: 'Kumush Daraja',
    shortLabel: '3-daraja',
    subtitle: 'Barqaror sifat — Oltin darajaga chiqish uchun 4.5★ kerak',
    minScore: 4.0,
    isAtRisk: false,
  },
  {
    tier: 'gold',
    levelNumber: 4,
    title: 'Oltin Daraja',
    shortLabel: '4-daraja',
    subtitle: 'Yuqori mehmon ishonchi — Oliy daraja uchun 4.8★ kerak',
    minScore: 4.5,
    isAtRisk: false,
  },
  {
    tier: 'platinum',
    levelNumber: 5,
    title: 'Oliy Daraja',
    shortLabel: '5-daraja · Premium',
    subtitle: 'Eng yuqori restoran maqomi — namunali taom va xizmat',
    minScore: 4.8,
    isAtRisk: false,
  },
];

function avgOf(values: number[]): number | null {
  if (values.length === 0) return null;
  return Number((values.reduce((acc, v) => acc + v, 0) / values.length).toFixed(1));
}

export function computeRestaurantLevel(
  averageRating: number,
  totalReviews: number,
  feedbacks: CustomerFeedback[]
): RestaurantLevelInfo {
  const safeAvg = Number.isFinite(averageRating)
    ? Math.min(5, Math.max(0, Number(averageRating.toFixed(2))))
    : 5.0;

  let currentIdx = 0;
  for (let i = RESTAURANT_LEVEL_SCALE.length - 1; i >= 0; i--) {
    if (safeAvg >= RESTAURANT_LEVEL_SCALE[i].minScore) {
      currentIdx = i;
      break;
    }
  }

  const current = RESTAURANT_LEVEL_SCALE[currentIdx];
  const next =
    currentIdx < RESTAURANT_LEVEL_SCALE.length - 1
      ? RESTAURANT_LEVEL_SCALE[currentIdx + 1]
      : undefined;

  let progressPercent = 100;
  let pointsToNextLevel = 0;

  if (next) {
    const floor = current.minScore === 0 ? 1.0 : current.minScore;
    const span = Math.max(0.1, next.minScore - floor);
    const rawPct = ((safeAvg - floor) / span) * 100;
    progressPercent = Math.min(99, Math.max(6, Math.round(rawPct)));
    pointsToNextLevel = Math.max(0, Number((next.minScore - safeAvg).toFixed(2)));
  }

  const foodScores = feedbacks.map((f) => f.food_rating).filter((n): n is number => typeof n === 'number' && n > 0);
  const speedScores = feedbacks.map((f) => f.speed_rating).filter((n): n is number => typeof n === 'number' && n > 0);
  const waiterScores = feedbacks.map((f) => f.waiter_rating).filter((n): n is number => typeof n === 'number' && n > 0);
  const atmosphereScores = feedbacks
    .map((f) => f.atmosphere_rating)
    .filter((n): n is number => typeof n === 'number' && n > 0);

  return {
    tier: current.tier,
    levelNumber: current.levelNumber,
    title: current.title,
    shortLabel: current.shortLabel,
    subtitle:
      totalReviews === 0
        ? "Ilk mehmon baholari bilan restoran darajasi shakllanadi"
        : current.subtitle,
    minScore: current.minScore,
    nextLevelTitle: next?.title,
    nextLevelMinScore: next?.minScore,
    pointsToNextLevel,
    progressPercent,
    isAtRisk: totalReviews > 0 && current.isAtRisk,
    categoryAverages: {
      food: avgOf(foodScores),
      speed: avgOf(speedScores),
      waiter: avgOf(waiterScores),
      atmosphere: avgOf(atmosphereScores),
    },
  };
}
