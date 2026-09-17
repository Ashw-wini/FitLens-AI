import { useState, useRef, useEffect, useCallback } from 'react';
import { initPoseDetection, detectPose, drawSkeleton, startCamera, stopCamera } from '../engine/poseEngine';
import { analyzeForm, getExerciseList, resetAngleBuffers } from '../engine/formAnalyzer';
import { RepCounter } from '../engine/repCounter';

export default function Workout() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const repCounterRef = useRef(new RepCounter());

  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [poseReady, setPoseReady] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('squat');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [formFeedback, setFormFeedback] = useState(null);
  const [repStats, setRepStats] = useState({ reps: 0, sets: 0, state: 'READY', progress: 0, averageFormScore: 0, isHold: false });
  const [currentAngles, setCurrentAngles] = useState({});
  const [error, setError] = useState(null);

  const exercises = getExerciseList();

  const speak = useCallback((text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech error:', e);
    }
  }, [voiceEnabled]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  useEffect(() => {
    resetAngleBuffers();
    repCounterRef.current.setExercise(selectedExercise);
    setRepStats(repCounterRef.current.getStats());
  }, [selectedExercise]);

  async function startSession() {
    setIsLoading(true);
    setError(null);
    
    try {
      // Initialize MediaPipe
      if (!poseReady) {
        const success = await initPoseDetection();
        if (!success) {
          setError('Failed to initialize AI pose detection. Please refresh and try again.');
          setIsLoading(false);
          return;
        }
        setPoseReady(true);
      }

      // Start camera
      const stream = await startCamera(videoRef.current);
      streamRef.current = stream;
      setIsActive(true);
      setIsLoading(false);

      // Start detection loop
      requestAnimationFrame(detectionLoop);
    } catch (err) {
      setError('Camera access denied. Please allow camera access and try again.');
      setIsLoading(false);
    }
  }

  function stopSession() {
    setIsActive(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    stopCamera(streamRef.current);
    streamRef.current = null;
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }

  const detectionLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    const results = detectPose(video);

    if (results?.landmarks && results.landmarks.length > 0) {
      // Analyze form
      const feedback = analyzeForm(results.landmarks, selectedExercise);
      setFormFeedback(feedback);
      setCurrentAngles(feedback.angles);

      // Count reps with state machine & strict form validation
      const repResult = repCounterRef.current.update(feedback.angles, feedback);
      if (repResult.repCompleted) {
        const stats = repCounterRef.current.getStats();
        setRepStats(stats);
        if (stats.isHold) {
          if (stats.holdSeconds % 5 === 0) {
            speak(`${stats.holdSeconds} seconds`);
          }
        } else {
          speak(`${stats.reps}`);
        }
      } else if (repResult.repRejected) {
        const stats = repCounterRef.current.getStats();
        setRepStats(stats);
        speak(`No rep! ${repResult.reason || 'Poor form'}`);
      } else {
        setRepStats(prev => {
          if (
            prev.state !== repCounterRef.current.state ||
            Math.abs((prev.progress || 0) - (repCounterRef.current.progress || 0)) >= 5
          ) {
            return {
              ...prev,
              state: repCounterRef.current.state,
              progress: repCounterRef.current.progress || 0,
              activeJoint: repCounterRef.current.activeJoint,
              holdSeconds: repCounterRef.current.holdSeconds,
              noReps: repCounterRef.current.noReps,
              lastRejectionReason: repCounterRef.current.lastRejectionReason
            };
          }
          return prev;
        });
      }

      // Draw skeleton
      drawSkeleton(ctx, results.landmarks, canvas.width, canvas.height, feedback);
    }

    animFrameRef.current = requestAnimationFrame(detectionLoop);
  }, [selectedExercise, speak]);

  // Restart loop when exercise changes
  useEffect(() => {
    if (isActive) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(detectionLoop);
    }
  }, [detectionLoop, isActive]);

  function resetReps() {
    repCounterRef.current.reset();
    setRepStats(repCounterRef.current.getStats());
  }

  function nextSet() {
    repCounterRef.current.nextSet();
    setRepStats(repCounterRef.current.getStats());
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1 className="page-title">AI Workout Trainer 🤖</h1>
        <p className="page-subtitle">Real-time pose detection with form correction & rep counting</p>
      </div>

      {/* Exercise Selector */}
      <div className="section">
        <h2 className="section-title">Select Exercise</h2>
        <div className="exercise-selector">
          {exercises.map(ex => (
            <button
              key={ex.key}
              className={`exercise-chip ${selectedExercise === ex.key ? 'active' : ''}`}
              onClick={() => setSelectedExercise(ex.key)}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* Camera View */}
      <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 600px' }}>
          <div className="camera-container">
            <video ref={videoRef} playsInline muted style={{ display: isActive ? 'block' : 'none' }} />
            <canvas ref={canvasRef} />
            
            {!isActive && (
              <div className="camera-placeholder">
                <div className="camera-placeholder-icon">📷</div>
                <h3>Camera Preview</h3>
                <p style={{ fontSize: 'var(--font-sm)', maxWidth: '300px', textAlign: 'center' }}>
                  Click "Start Workout" to activate the camera and AI pose detection
                </p>
              </div>
            )}

            {isActive && formFeedback && formFeedback.quality !== 'none' && (
              <>
                {/* Form Feedback Overlay */}
                <div className={`form-feedback ${formFeedback.quality === 'good' ? 'good' : formFeedback.quality === 'warning' ? 'warning' : 'bad'}`}>
                  {formFeedback.messages.length > 0 
                    ? formFeedback.messages[formFeedback.messages.length - 1].message 
                    : '✅ Looking good!'}
                </div>

                {/* Rep Counter Overlay */}
                <div className="rep-counter">
                  <div className="rep-count">{repStats.reps}</div>
                  <div className="rep-label">{repStats.isHold ? 'Seconds Held' : 'Reps'}</div>

                  {!repStats.isHold && (
                    <div className="rep-progress-wrap">
                      <div className="rep-progress-bar">
                        <div 
                          className="rep-progress-fill" 
                          style={{ width: `${repStats.progress || 0}%` }} 
                        />
                      </div>
                    </div>
                  )}

                  <div className="motion-phase-badge">
                    {repStats.state === 'READY' && '🎯 Ready'}
                    {repStats.state === 'IN_PROGRESS' && '⚡ In Motion'}
                    {repStats.state === 'PEAK_REACHED' && '🔥 Good Depth!'}
                    {repStats.state === 'RETURNING' && '⬆️ Return Up'}
                    {repStats.state === 'NO_REP' && '❌ NO REP (Bad Form)'}
                    {repStats.state === 'HOLDING' && '⏱️ Holding'}
                    {repStats.state === 'FORM_WARNING' && '⚠️ Adjust Form'}
                  </div>
                </div>

                {/* Form Score */}
                <div className="camera-stats">
                  <div className="camera-stat">
                    Score: {formFeedback.score}%
                  </div>
                  <div className="camera-stat">
                    Phase: {repStats.state}
                  </div>
                  {repStats.activeJoint && (
                    <div className="camera-stat">
                      Tracking: {repStats.activeJoint}
                    </div>
                  )}
                  {Object.entries(currentAngles).slice(0, 2).map(([key, val]) => (
                    <div key={key} className="camera-stat">
                      {key}: {Math.round(val)}°
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isActive ? (
              <button className="btn btn-primary btn-lg" onClick={startSession} disabled={isLoading}>
                {isLoading ? '⏳ Loading AI Model...' : '🎯 Start Workout'}
              </button>
            ) : (
              <>
                <button className="btn btn-danger" onClick={stopSession}>⏹ Stop</button>
                <button className="btn btn-outline" onClick={resetReps}>🔄 Reset</button>
                <button className="btn btn-accent" onClick={nextSet}>➡️ Next Set</button>
                <button 
                  className={`btn ${voiceEnabled ? 'btn-accent' : 'btn-outline'}`}
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  title="Toggle voice counting"
                >
                  {voiceEnabled ? '🔊 Voice: ON' : '🔇 Voice: OFF'}
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="toast toast-error" style={{ position: 'relative', marginTop: 'var(--space-md)' }}>
              {error}
            </div>
          )}
        </div>

        {/* Stats Panel */}
        <div style={{ flex: '0 0 280px', minWidth: '250px' }}>
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>📊 Session Stats</h3>
            
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
              <div style={{ fontSize: 'var(--font-5xl)', fontWeight: 900, lineHeight: 1, background: 'linear-gradient(135deg, var(--accent), var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {repStats.reps}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: 'var(--space-xs)' }}>
                Valid Reps (Set {repStats.sets + 1})
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-sm)' }}>
              <div style={{ textAlign: 'center', padding: 'var(--space-sm)', background: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 800, fontSize: 'var(--font-lg)', color: 'var(--success)' }}>
                  {repStats.averageFormScore || '--'}%
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>Avg Form</div>
              </div>
              <div style={{ textAlign: 'center', padding: 'var(--space-sm)', background: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 800, fontSize: 'var(--font-lg)', color: 'var(--accent)' }}>
                  {repStats.sets}
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>Sets</div>
              </div>
              <div style={{ textAlign: 'center', padding: 'var(--space-sm)', background: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 800, fontSize: 'var(--font-lg)', color: 'var(--danger)' }}>
                  {repStats.noReps || 0}
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>No Reps</div>
              </div>
            </div>
          </div>

          {/* Form Score Gauge */}
          {isActive && formFeedback && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>🎯 Form Quality</h3>
              <div className="form-score">
                <div className="form-score-circle" style={{
                  '--score-angle': `${(formFeedback.score / 100) * 360}deg`,
                  background: formFeedback.score >= 80 ? 'rgba(0,230,118,0.1)' : formFeedback.score >= 50 ? 'rgba(255,214,0,0.1)' : 'rgba(255,82,82,0.1)'
                }}>
                  <span style={{ color: formFeedback.score >= 80 ? 'var(--success)' : formFeedback.score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                    {formFeedback.score}
                  </span>
                </div>
                <div className="form-score-label">
                  {formFeedback.score >= 80 ? 'Excellent' : formFeedback.score >= 50 ? 'Needs Work' : 'Poor Form'}
                </div>
              </div>
              
              {/* Angle readings */}
              <div style={{ marginTop: 'var(--space-lg)' }}>
                {Object.entries(currentAngles).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-xs) 0', borderBottom: '1px solid var(--border)', fontSize: 'var(--font-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{key}</span>
                    <span style={{ fontWeight: 700 }}>{Math.round(val)}°</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Tips */}
          <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
            <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>💡 Form Tips</h3>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {selectedExercise === 'squat' && (
                <ul style={{ paddingLeft: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  <li>Keep chest up and back straight</li>
                  <li>Knees track over toes</li>
                  <li>Lower until thighs parallel</li>
                  <li>Drive through heels</li>
                </ul>
              )}
              {selectedExercise === 'bicep_curl' && (
                <ul style={{ paddingLeft: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  <li>Pin elbows to sides</li>
                  <li>No swinging or momentum</li>
                  <li>Full range of motion</li>
                  <li>Squeeze at the top</li>
                </ul>
              )}
              {selectedExercise === 'pushup' && (
                <ul style={{ paddingLeft: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  <li>Straight line head to heels</li>
                  <li>Elbows at 45° angle</li>
                  <li>Chest to floor</li>
                  <li>Core stays tight</li>
                </ul>
              )}
              {selectedExercise === 'plank' && (
                <ul style={{ paddingLeft: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  <li>Straight body line</li>
                  <li>Don't let hips sag</li>
                  <li>Don't pike hips up</li>
                  <li>Breathe steadily</li>
                </ul>
              )}
              {(selectedExercise === 'lunge' || selectedExercise === 'shoulder_press' || selectedExercise === 'deadlift') && (
                <ul style={{ paddingLeft: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  <li>Controlled movement</li>
                  <li>Maintain proper alignment</li>
                  <li>Brace your core</li>
                  <li>Full range of motion</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
