/**
 * Form Analyzer
 * Calculates joint angles and evaluates exercise form quality
 */

import { POSE_LANDMARKS } from './poseEngine';

const L = POSE_LANDMARKS;

/**
 * Calculate angle between three points (in degrees)
 * Point B is the vertex (joint)
 */
export function calculateAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * (180 / Math.PI));
  if (angle > 180) angle = 360 - angle;
  return angle;
}

/**
 * Smoothing buffer for angle readings
 */
const angleBuffers = {};
const BUFFER_SIZE = 5;

export function resetAngleBuffers() {
  for (const key of Object.keys(angleBuffers)) {
    delete angleBuffers[key];
  }
}

function smoothAngle(key, rawAngle) {
  if (!angleBuffers[key]) angleBuffers[key] = [];
  angleBuffers[key].push(rawAngle);
  if (angleBuffers[key].length > BUFFER_SIZE) angleBuffers[key].shift();
  return angleBuffers[key].reduce((a, b) => a + b, 0) / angleBuffers[key].length;
}

/**
 * Exercise definitions with angle thresholds
 */
export const EXERCISE_RULES = {
  squat: {
    name: 'Squat',
    type: 'flex',
    jointCandidates: ['leftKnee', 'rightKnee'],
    angles: {
      leftKnee: { points: [L.LEFT_HIP, L.LEFT_KNEE, L.LEFT_ANKLE], idealRange: [70, 170] },
      rightKnee: { points: [L.RIGHT_HIP, L.RIGHT_KNEE, L.RIGHT_ANKLE], idealRange: [70, 170] },
      hipHinge: { points: [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_KNEE], idealRange: [60, 170] }
    },
    repThresholds: { start: 155, inflection: 105, triggerHalf: 130 },
    involvedJoints: [L.LEFT_HIP, L.RIGHT_HIP, L.LEFT_KNEE, L.RIGHT_KNEE, L.LEFT_ANKLE, L.RIGHT_ANKLE, L.LEFT_SHOULDER, L.RIGHT_SHOULDER],
    formChecks: [
      { name: 'Knee Alignment', check: (angles) => {
        const kneeAngle = angles.leftKnee || angles.rightKnee;
        if (kneeAngle === undefined) return { status: 'good', message: 'Ready' };
        if (kneeAngle < 60) return { status: 'bad', message: '⚠️ Too deep! Ease up on the depth' };
        if (kneeAngle < 70) return { status: 'warning', message: '⚡ Almost too deep, careful!' };
        if (kneeAngle <= 105) return { status: 'good', message: '✅ Great squat depth!' };
        return { status: 'good', message: 'Squat down smoothly' };
      }},
      { name: 'Back Angle', check: (angles) => {
        const hip = angles.hipHinge;
        if (hip !== undefined && hip < 50) return { status: 'bad', message: '⚠️ Leaning too far forward!' };
        if (hip !== undefined && hip < 65) return { status: 'warning', message: '⚡ Keep your chest up' };
        return { status: 'good', message: '✅ Great posture!' };
      }}
    ]
  },

  bicep_curl: {
    name: 'Bicep Curl',
    type: 'flex',
    jointCandidates: ['rightElbow', 'leftElbow'],
    angles: {
      leftElbow: { points: [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST], idealRange: [35, 165] },
      rightElbow: { points: [L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_WRIST], idealRange: [35, 165] }
    },
    repThresholds: { start: 130, inflection: 75, triggerHalf: 100 },
    involvedJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_ELBOW, L.RIGHT_ELBOW, L.LEFT_WRIST, L.RIGHT_WRIST],
    formChecks: [
      { name: 'Elbow Position', check: (angles, landmarks) => {
        if (!landmarks) return { status: 'good', message: '✅ Good form' };

        const lShoulder = landmarks[L.LEFT_SHOULDER];
        const rShoulder = landmarks[L.RIGHT_SHOULDER];
        const lElbow = landmarks[L.LEFT_ELBOW];
        const rElbow = landmarks[L.RIGHT_ELBOW];

        // An elbow is flared out horizontally if it is raised up to shoulder level and pushed out wide
        const leftArmRaised = lShoulder && lElbow && (lElbow.y <= lShoulder.y + 0.03) && Math.abs(lElbow.x - lShoulder.x) > 0.14;
        const rightArmRaised = rShoulder && rElbow && (rElbow.y <= rShoulder.y + 0.03) && Math.abs(rElbow.x - rShoulder.x) > 0.14;

        // Check excessive lateral flare
        const leftFlaredWide = lShoulder && lElbow && Math.abs(lElbow.x - lShoulder.x) > 0.22;
        const rightFlaredWide = rShoulder && rElbow && Math.abs(rElbow.x - rShoulder.x) > 0.22;

        if (leftArmRaised || rightArmRaised || leftFlaredWide || rightFlaredWide) {
          return {
            status: 'bad',
            message: '❌ Upper arms flared out! Lower elbows and pin to sides'
          };
        }

        const moderateDrift = (lShoulder && lElbow && Math.abs(lElbow.x - lShoulder.x) > 0.16) ||
                              (rShoulder && rElbow && Math.abs(rElbow.x - rShoulder.x) > 0.16);

        if (moderateDrift) {
          return {
            status: 'warning',
            message: '⚡ Keep elbows closer to your sides'
          };
        }

        return { status: 'good', message: '✅ Great bicep curl form!' };
      }}
    ]
  },

  pushup: {
    name: 'Push-Up',
    type: 'flex',
    jointCandidates: ['leftElbow', 'rightElbow'],
    angles: {
      leftElbow: { points: [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST], idealRange: [60, 175] },
      rightElbow: { points: [L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_WRIST], idealRange: [60, 175] },
      hipLine: { points: [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_ANKLE], idealRange: [155, 180] }
    },
    repThresholds: { start: 155, inflection: 95, triggerHalf: 125 },
    involvedJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_ELBOW, L.RIGHT_ELBOW, L.LEFT_WRIST, L.RIGHT_WRIST, L.LEFT_HIP, L.RIGHT_HIP, L.LEFT_ANKLE, L.RIGHT_ANKLE],
    formChecks: [
      { name: 'Hip Alignment', check: (angles) => {
        const hip = angles.hipLine;
        if (hip !== undefined && hip < 150) return { status: 'bad', message: '⚠️ Hips sagging! Tighten core' };
        if (hip !== undefined && hip < 160) return { status: 'warning', message: '⚡ Keep hips up in line' };
        return { status: 'good', message: '✅ Great straight body line!' };
      }}
    ]
  },

  lunge: {
    name: 'Lunge',
    type: 'flex',
    jointCandidates: ['leftKnee', 'rightKnee'],
    angles: {
      leftKnee: { points: [L.LEFT_HIP, L.LEFT_KNEE, L.LEFT_ANKLE], idealRange: [70, 170] },
      rightKnee: { points: [L.RIGHT_HIP, L.RIGHT_KNEE, L.RIGHT_ANKLE], idealRange: [70, 170] }
    },
    repThresholds: { start: 150, inflection: 100, triggerHalf: 125 },
    involvedJoints: [L.LEFT_HIP, L.RIGHT_HIP, L.LEFT_KNEE, L.RIGHT_KNEE, L.LEFT_ANKLE, L.RIGHT_ANKLE],
    formChecks: [
      { name: 'Knee Depth', check: (angles) => {
        const activeKnee = angles.leftKnee || angles.rightKnee;
        if (activeKnee !== undefined && activeKnee < 65) return { status: 'bad', message: '⚠️ Knee too far forward!' };
        if (activeKnee !== undefined && activeKnee <= 100) return { status: 'good', message: '✅ Good lunge depth!' };
        return { status: 'good', message: 'Step forward and lower hips' };
      }}
    ]
  },

  shoulder_press: {
    name: 'Shoulder Press',
    type: 'extend',
    jointCandidates: ['rightElbow', 'leftElbow'],
    angles: {
      leftElbow: { points: [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST], idealRange: [60, 175] },
      rightElbow: { points: [L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_WRIST], idealRange: [60, 175] }
    },
    repThresholds: { start: 95, inflection: 155, triggerHalf: 125 },
    involvedJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_ELBOW, L.RIGHT_ELBOW, L.LEFT_WRIST, L.RIGHT_WRIST],
    formChecks: [
      { name: 'Press Form', check: (angles) => {
        const activeElbow = angles.rightElbow || angles.leftElbow;
        if (activeElbow !== undefined && activeElbow >= 155) return { status: 'good', message: '✅ Full overhead lockout!' };
        return { status: 'good', message: 'Press straight overhead' };
      }}
    ]
  },

  plank: {
    name: 'Plank',
    type: 'hold',
    jointCandidates: ['hipLine'],
    repThresholds: null,
    angles: {
      hipLine: { points: [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_ANKLE], idealRange: [160, 180] }
    },
    involvedJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_HIP, L.RIGHT_HIP, L.LEFT_ANKLE, L.RIGHT_ANKLE],
    formChecks: [
      { name: 'Body Line', check: (angles) => {
        const hip = angles.hipLine;
        if (hip !== undefined && hip < 150) return { status: 'bad', message: '⚠️ Hips sagging! Engage core' };
        if (hip !== undefined && hip > 185) return { status: 'warning', message: '⚡ Hips too high, lower slightly' };
        if (hip !== undefined && hip < 160) return { status: 'warning', message: '⚡ Keep body straight' };
        return { status: 'good', message: '✅ Perfect plank hold!' };
      }}
    ]
  },

  deadlift: {
    name: 'Deadlift',
    type: 'flex',
    jointCandidates: ['hipHinge'],
    angles: {
      hipHinge: { points: [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_KNEE], idealRange: [60, 175] },
      kneeAngle: { points: [L.LEFT_HIP, L.LEFT_KNEE, L.LEFT_ANKLE], idealRange: [140, 175] }
    },
    repThresholds: { start: 155, inflection: 105, triggerHalf: 130 },
    involvedJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_HIP, L.RIGHT_HIP, L.LEFT_KNEE, L.RIGHT_KNEE, L.LEFT_ANKLE, L.RIGHT_ANKLE],
    formChecks: [
      { name: 'Back Position', check: (angles) => {
        const hip = angles.hipHinge;
        if (hip !== undefined && hip < 50) return { status: 'bad', message: '⚠️ Back rounding! Keep neutral spine' };
        return { status: 'good', message: '✅ Good hip hinge!' };
      }}
    ]
  }
};

/**
 * Analyze form for a given exercise
 */
export function analyzeForm(landmarks, exerciseKey) {
  const rules = EXERCISE_RULES[exerciseKey];
  if (!rules || !landmarks || landmarks.length === 0) {
    return { quality: 'none', score: 0, messages: [], angles: {}, involvedJoints: [] };
  }

  const points = landmarks[0];
  if (!points) return { quality: 'none', score: 0, messages: [], angles: {}, involvedJoints: [] };

  // Calculate all angles for this exercise
  const angles = {};
  for (const [angleName, config] of Object.entries(rules.angles)) {
    const [aIdx, bIdx, cIdx] = config.points;
    const a = points[aIdx];
    const b = points[bIdx];
    const c = points[cIdx];
    
    if (a && b && c && a.visibility > 0.4 && b.visibility > 0.4 && c.visibility > 0.4) {
      angles[angleName] = smoothAngle(angleName, calculateAngle(a, b, c));
    }
  }

  // Run form checks
  const messages = [];
  let worstStatus = 'good';
  
  for (const check of rules.formChecks) {
    const result = check.check(angles, points);
    if (result.message) messages.push(result);
    
    if (result.status === 'bad') worstStatus = 'bad';
    else if (result.status === 'warning' && worstStatus !== 'bad') worstStatus = 'warning';
  }

  // Calculate form score (0-100)
  let score = 100;
  for (const [angleName, config] of Object.entries(rules.angles)) {
    if (angles[angleName] !== undefined) {
      const [min, max] = config.idealRange;
      const angle = angles[angleName];
      if (angle < min) score -= Math.min(30, (min - angle) * 2);
      else if (angle > max) score -= Math.min(30, (angle - max) * 2);
    }
  }

  // Strictly enforce score penalty if any form check fails
  if (worstStatus === 'bad') {
    score = Math.min(score, 40);
  } else if (worstStatus === 'warning') {
    score = Math.min(score, 70);
  }

  score = Math.max(0, Math.round(score));

  return {
    quality: worstStatus,
    score,
    messages,
    angles,
    involvedJoints: rules.involvedJoints
  };
}

export function getExerciseList() {
  return Object.entries(EXERCISE_RULES).map(([key, rule]) => ({
    key,
    name: rule.name
  }));
}
