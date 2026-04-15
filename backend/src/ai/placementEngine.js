import { callAI } from './client.js';
import { PLACEMENT_ENGINE_PROMPT } from './prompts.js';
import {
  getWalkTime,
  getCluster,
  getRouteType,
  getFeasibleMeetupSpots,
  MEETUP_SPOTS
} from '../data/campusMap.js';

/**
 * Friction-Aware Anchor Placement Engine
 *
 * Makes sure every anchor meetup is physically easy, time-feasible,
 * and low-friction. Never suggest a location without checking
 * physical feasibility.
 *
 * Core rule: Do not just match the right people. Match the right
 * people in the easiest possible place at the easiest possible moment.
 */
export async function computePlacement(participants, routineHook, gapMinutes) {
  // Gather each participant's location context
  const participantContexts = participants.map(p => {
    const courses = JSON.parse(p.academic_contexts || '[]');
    const hookContext = routineHook.context;

    // Find the class that matches the hook context
    const matchedClass = courses.find(c => c.course === hookContext);
    const classBuilding = matchedClass?.building || null;

    // Find the next class after the hook time
    const nextClass = findNextClass(courses, routineHook.day, routineHook.time);

    return {
      studentId: p.id,
      studentName: p.name,
      lastClassBuilding: classBuilding,
      nextClassBuilding: nextClass?.building || null,
      nextClassTime: nextClass?.time || null,
      preferredZones: JSON.parse(p.location_patterns || '[]'),
      accessibilityNeeds: null
    };
  });

  const lastClassBuildings = participantContexts
    .map(p => p.lastClassBuilding)
    .filter(Boolean);

  const duration = routineHook.duration_minutes || 10;
  const maxWalkMinutes = computeMaxWalk(gapMinutes, duration);

  // Find feasible spots using campus map data
  const feasibleSpots = getFeasibleMeetupSpots(lastClassBuildings, maxWalkMinutes);

  // Compute lateness risk for each participant at each spot
  const scoredPlacements = feasibleSpots.map(spot => {
    const walkDetails = participantContexts.map((ctx, i) => {
      const walkMin = spot.walkTimesByParticipant[i] || 0;
      const walkBack = ctx.nextClassBuilding
        ? getWalkTime(spot.building, ctx.nextClassBuilding)
        : 0;

      const totalTimeNeeded = walkMin + duration + Math.max(walkBack, 0);
      const latenessRisk = ctx.nextClassTime
        ? totalTimeNeeded > gapMinutes ? 'high' : totalTimeNeeded > gapMinutes - 3 ? 'medium' : 'low'
        : 'low';

      return {
        studentId: ctx.studentId,
        studentName: ctx.studentName,
        walkMinutes: walkMin,
        walkBack: walkBack >= 0 ? walkBack : null,
        latenessRisk,
        routeType: ctx.lastClassBuilding
          ? getRouteType(ctx.lastClassBuilding, spot.building)
          : 'unknown'
      };
    });

    // Reject if any participant has high lateness risk
    const hasHighRisk = walkDetails.some(w => w.latenessRisk === 'high');

    return {
      location: spot.name,
      building: spot.building,
      locationType: spot.type,
      emotionalEase: spot.emotionalEase,
      sameBuilding: spot.sameBuilding,
      sameCluster: spot.sameCluster,
      walkDetails,
      hasHighRisk,
      compositeScore: spot.score + (hasHighRisk ? 100 : 0)
    };
  });

  // Sort by composite score (lower = better), filter out high-risk
  const validPlacements = scoredPlacements
    .filter(p => !p.hasHighRisk)
    .sort((a, b) => a.compositeScore - b.compositeScore);

  // Determine confidence
  const hasEnoughData = lastClassBuildings.length >= 1;
  const hasFeasibleOptions = validPlacements.length > 0;
  const confidence = hasEnoughData && hasFeasibleOptions ? 0.85 : 0.3;

  // If confidence is low, ask for clarification
  if (confidence < 0.5) {
    return buildClarificationResult(participantContexts, routineHook, gapMinutes);
  }

  const best = validPlacements[0];
  const fallback = validPlacements[1] || null;

  // Build fit reason
  const fitReason = buildFitReason(best, gapMinutes, duration);

  // Try AI for the final fit reason and location explanation
  const aiResult = await callAI({
    systemPrompt: PLACEMENT_ENGINE_PROMPT,
    userMessage: {
      participants: participantContexts,
      routine_hook: routineHook,
      gap_minutes: gapMinutes,
      duration_minutes: duration,
      best_spot: {
        name: best.location,
        building: best.building,
        walkDetails: best.walkDetails,
        sameBuilding: best.sameBuilding
      },
      fallback_spot: fallback ? {
        name: fallback.location,
        building: fallback.building,
        walkDetails: fallback.walkDetails
      } : null
    },
    temperature: 0.4,
    maxTokens: 300,
    fallback: () => ({
      fit_reason: fitReason,
      time_fit_message: buildTimeFitMessage(best, gapMinutes, duration),
      arrival_note: `Head to ${best.location} right after class. It is ${best.walkDetails[0]?.walkMinutes || 1} minutes from your lecture.`
    })
  });

  return {
    recommended_location: best.location,
    recommended_building: best.building,
    fallback_location: fallback?.location || null,
    fallback_building: fallback?.building || null,
    walk_minutes_by_participant: Object.fromEntries(
      best.walkDetails.map(w => [w.studentId, w.walkMinutes])
    ),
    lateness_risk_by_participant: Object.fromEntries(
      best.walkDetails.map(w => [w.studentId, w.latenessRisk])
    ),
    fit_reason: aiResult.fit_reason || fitReason,
    time_fit_message: aiResult.time_fit_message || buildTimeFitMessage(best, gapMinutes, duration),
    arrival_note: aiResult.arrival_note || `Head to ${best.location} right after class.`,
    route_type: best.walkDetails[0]?.routeType || 'unknown',
    same_building: best.sameBuilding,
    emotional_ease: best.emotionalEase,
    confidence,
    clarification_needed: false,
    clarification_prompt: null
  };
}

// ---- Helper functions ----

function findNextClass(courses, hookDay, hookTime) {
  if (!courses || !hookDay || !hookTime) return null;

  const [hookH, hookM] = hookTime.split(':').map(Number);
  const hookMinutes = hookH * 60 + hookM;

  let nextClass = null;
  let smallestGap = Infinity;

  for (const course of courses) {
    if (!course.days?.includes(hookDay)) continue;
    const [cH, cM] = (course.time || '').split(':').map(Number);
    if (isNaN(cH)) continue;
    const classMinutes = cH * 60 + cM;
    const gap = classMinutes - hookMinutes;

    if (gap > 0 && gap < smallestGap) {
      smallestGap = gap;
      nextClass = course;
    }
  }

  return nextClass;
}

function computeMaxWalk(gapMinutes, durationMinutes) {
  const availableForWalking = gapMinutes - durationMinutes;
  // Walking burden should not exceed 40% of total gap for short interactions
  if (durationMinutes <= 15) {
    return Math.min(Math.floor(gapMinutes * 0.4 / 2), Math.floor(availableForWalking / 2));
  }
  return Math.floor(availableForWalking / 2);
}

function buildFitReason(placement, gapMinutes, duration) {
  const walk = placement.walkDetails[0]?.walkMinutes || 0;
  if (placement.sameBuilding) {
    return `Same building as your class. ${walk} minute walk.`;
  }
  if (placement.sameCluster) {
    return `${walk} minutes from your class in the same area of campus.`;
  }
  if (walk <= 2) {
    return `${walk} minute walk from your lecture.`;
  }
  return `${walk} minutes from your class and on your way.`;
}

function buildTimeFitMessage(placement, gapMinutes, duration) {
  const maxWalk = Math.max(...placement.walkDetails.map(w => w.walkMinutes));
  const maxWalkBack = Math.max(...placement.walkDetails.map(w => w.walkBack || 0));
  const bufferMinutes = gapMinutes - maxWalk - duration - maxWalkBack;

  if (bufferMinutes >= 8) {
    return `Ends ${bufferMinutes} minutes before your next class.`;
  }
  if (bufferMinutes >= 4) {
    return `Comfortable timing with ${bufferMinutes} minutes to spare.`;
  }
  return `Tight but doable. ${bufferMinutes} minutes buffer before your next class.`;
}

function buildClarificationResult(participantContexts, routineHook, gapMinutes) {
  const missingLocations = participantContexts.filter(p => !p.lastClassBuilding);
  const prompt = missingLocations.length > 0
    ? `Where does your ${routineHook.context} class meet? That helps us find the closest spot.`
    : `Which area of campus are you usually in around ${routineHook.time}?`;

  return {
    recommended_location: null,
    recommended_building: null,
    fallback_location: null,
    fallback_building: null,
    walk_minutes_by_participant: {},
    lateness_risk_by_participant: {},
    fit_reason: null,
    time_fit_message: null,
    arrival_note: null,
    route_type: null,
    same_building: false,
    emotional_ease: null,
    confidence: 0.3,
    clarification_needed: true,
    clarification_prompt: prompt
  };
}
