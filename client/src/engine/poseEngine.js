/**
 * MediaPipe PoseLandmarker Engine
 * Handles camera access, pose detection, and skeleton drawing
 */

// MediaPipe landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1, LEFT_EYE: 2, LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4, RIGHT_EYE: 5, RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7, RIGHT_EAR: 8,
  MOUTH_LEFT: 9, MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_PINKY: 17, RIGHT_PINKY: 18,
  LEFT_INDEX: 19, RIGHT_INDEX: 20,
  LEFT_THUMB: 21, RIGHT_THUMB: 22,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
  LEFT_HEEL: 29, RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32
};

// Skeleton connections for drawing
export const POSE_CONNECTIONS = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], [12, 24], // torso
  [23, 24], // hips
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
  [27, 29], [29, 31], // left foot
  [28, 30], [30, 32], // right foot
  [15, 17], [15, 19], [15, 21], // left hand
  [16, 18], [16, 20], [16, 22], // right hand
];

let poseLandmarker = null;
let lastVideoTime = -1;

/**
 * Initialize the PoseLandmarker
 */
export async function initPoseDetection() {
  try {
    const vision = await import('@mediapipe/tasks-vision');
    const { PoseLandmarker, FilesetResolver } = vision;

    const wasmFiles = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    poseLandmarker = await PoseLandmarker.createFromOptions(wasmFiles, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    console.log('✅ PoseLandmarker initialized');
    return true;
  } catch (error) {
    console.error('❌ PoseLandmarker init failed:', error);
    return false;
  }
}

/**
 * Detect pose in a video frame
 */
export function detectPose(videoElement) {
  if (!poseLandmarker || !videoElement) return null;
  
  const currentTime = videoElement.currentTime;
  if (currentTime === lastVideoTime) return null;
  lastVideoTime = currentTime;

  try {
    const results = poseLandmarker.detectForVideo(videoElement, performance.now());
    return results;
  } catch (error) {
    return null;
  }
}

/**
 * Draw skeleton on canvas
 */
export function drawSkeleton(ctx, landmarks, width, height, formFeedback = null) {
  ctx.clearRect(0, 0, width, height);
  
  if (!landmarks || landmarks.length === 0) return;

  const points = landmarks[0];
  if (!points) return;

  // Draw connections
  ctx.lineWidth = 3;
  
  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const start = points[startIdx];
    const end = points[endIdx];
    
    if (!start || !end || start.visibility < 0.5 || end.visibility < 0.5) continue;
    
    // Color based on form feedback
    let color = '#00D2FF';
    if (formFeedback) {
      const involvedJoints = formFeedback.involvedJoints || [];
      if (involvedJoints.includes(startIdx) || involvedJoints.includes(endIdx)) {
        if (formFeedback.quality === 'good') color = '#00E676';
        else if (formFeedback.quality === 'warning') color = '#FFD600';
        else if (formFeedback.quality === 'bad') color = '#FF5252';
      }
    }
    
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(start.x * width, start.y * height);
    ctx.lineTo(end.x * width, end.y * height);
    ctx.stroke();
  }

  // Draw joints
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (!point || point.visibility < 0.5) continue;
    
    // Skip face landmarks for cleaner look (keep only 0-nose)
    if (i > 0 && i < 11) continue;
    
    let jointColor = '#FFFFFF';
    if (formFeedback?.involvedJoints?.includes(i)) {
      if (formFeedback.quality === 'good') jointColor = '#00E676';
      else if (formFeedback.quality === 'warning') jointColor = '#FFD600';
      else if (formFeedback.quality === 'bad') jointColor = '#FF5252';
    }
    
    ctx.fillStyle = jointColor;
    ctx.beginPath();
    ctx.arc(point.x * width, point.y * height, 5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Glow effect
    ctx.fillStyle = jointColor + '40';
    ctx.beginPath();
    ctx.arc(point.x * width, point.y * height, 10, 0, 2 * Math.PI);
    ctx.fill();
  }
}

/**
 * Start camera stream
 */
export async function startCamera(videoElement, facingMode = 'user') {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
    videoElement.srcObject = stream;
    await videoElement.play();
    return stream;
  } catch (error) {
    console.error('Camera error:', error);
    throw error;
  }
}

/**
 * Stop camera stream
 */
export function stopCamera(stream) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

export { poseLandmarker };
