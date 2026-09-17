/**
 * Industrial-Grade AI Rep Counter with Locked-Joint State Machine & Form Validation
 * 
 * Features:
 * - Locked-Joint Execution: Locks to the active moving joint for the entire rep to prevent bilateral flapping
 * - Full Range-of-Motion Validation: Enforces full start -> peak -> return cycle
 * - Responsive timing: 500ms min rep duration, 400ms cooldown (responsive yet anti-jitter)
 * - Strict Form Verification: Validates good posture during movement, classifies bad attempts as "No Rep"
 * - Tracks Valid Reps vs Rejected (No Reps)
 * - Hold timer for isometric exercises (e.g. Plank)
 */

import { EXERCISE_RULES } from './formAnalyzer';

export class RepCounter {
  constructor() {
    this.exerciseKey = null;
    this.rule = null;
    this.reps = 0;
    this.noReps = 0;
    this.sets = 0;
    this.state = 'READY'; // 'READY' | 'IN_PROGRESS' | 'PEAK_REACHED' | 'RETURNING' | 'NO_REP' | 'HOLDING'
    this.progress = 0;    // 0 to 100%
    this.lockedJoint = null;
    this.activeJoint = null;
    this.reachedPeak = false;
    this.hadBadForm = false;
    this.badFormReason = null;
    this.badFormFrames = 0;
    this.lastRejectionReason = null;
    this.lastRepTime = 0;
    this.repStartTime = 0;
    this.holdSeconds = 0;
    this.lastHoldTick = 0;
    this.history = [];
    this.minRepDuration = 500; // ms: Responsive minimum rep duration
    this.repCooldown = 400;    // ms: Minimum cooldown between reps
  }

  setExercise(exerciseKey) {
    this.exerciseKey = exerciseKey;
    this.rule = EXERCISE_RULES[exerciseKey] || null;
    this.reset();
  }

  reset() {
    this.state = 'READY';
    this.reps = 0;
    this.noReps = 0;
    this.progress = 0;
    this.lockedJoint = null;
    this.activeJoint = null;
    this.reachedPeak = false;
    this.hadBadForm = false;
    this.badFormReason = null;
    this.badFormFrames = 0;
    this.lastRejectionReason = null;
    this.lastRepTime = 0;
    this.repStartTime = 0;
    this.holdSeconds = 0;
    this.lastHoldTick = 0;
    this.history = [];
  }

  nextSet() {
    this.sets++;
    this.reps = 0;
    this.noReps = 0;
    this.progress = 0;
    this.state = 'READY';
    this.lockedJoint = null;
    this.reachedPeak = false;
    this.hadBadForm = false;
    this.badFormReason = null;
    this.badFormFrames = 0;
    this.history = [];
  }

  /**
   * Process angle data and count reps with form verification
   * @param {Object} angles Computed angles
   * @param {Object|number} feedbackOrScore Form feedback object or score number
   * @returns {Object} rep status
   */
  update(angles, feedbackOrScore = 0) {
    if (!this.rule || !angles) {
      return { repCompleted: false, repRejected: false, progress: 0, state: this.state };
    }

    const formScore = typeof feedbackOrScore === 'object' ? (feedbackOrScore.score || 0) : (feedbackOrScore || 0);
    const formQuality = typeof feedbackOrScore === 'object' ? (feedbackOrScore.quality || 'good') : 'good';
    const formMessages = typeof feedbackOrScore === 'object' ? (feedbackOrScore.messages || []) : [];

    // 1. Isometric Hold exercises (e.g., Plank)
    if (this.rule.type === 'hold' || !this.rule.repThresholds) {
      return this._updateHold(formScore);
    }

    const { type, repThresholds, jointCandidates } = this.rule;
    if (!repThresholds || !jointCandidates || jointCandidates.length === 0) {
      return { repCompleted: false, repRejected: false, progress: 0, state: this.state };
    }

    const { start, inflection, triggerHalf } = repThresholds;

    // 2. Select / Lock Active Joint
    let trackingJoint = this.lockedJoint;

    if (!trackingJoint || angles[trackingJoint] === undefined) {
      let bestJoint = null;
      let bestProg = -1;

      for (const jName of jointCandidates) {
        const a = angles[jName];
        if (typeof a === 'number' && !isNaN(a)) {
          const p = this._calcProgress(a, type, repThresholds);
          if (bestJoint === null || p > bestProg) {
            bestJoint = jName;
            bestProg = p;
          }
        }
      }
      trackingJoint = bestJoint;
    }

    if (!trackingJoint || angles[trackingJoint] === undefined) {
      return { repCompleted: false, repRejected: false, progress: this.progress, state: this.state };
    }

    this.activeJoint = trackingJoint;
    const currentAngle = angles[trackingJoint];
    this.progress = this._calcProgress(currentAngle, type, repThresholds);

    const now = Date.now();
    let repCompleted = false;
    let repRejected = false;

    // Monitor form continuously during active movement
    if (this.state === 'IN_PROGRESS' || this.state === 'PEAK_REACHED' || this.state === 'RETURNING') {
      if (formQuality === 'bad') {
        this.hadBadForm = true;
        this.badFormFrames = (this.badFormFrames || 0) + 1;
        const badMsg = formMessages.find(m => m.status === 'bad')?.message;
        if (badMsg) this.badFormReason = badMsg;
      }
    }

    if (type === 'flex') {
      switch (this.state) {
        case 'READY':
        case 'NO_REP':
          if (currentAngle <= triggerHalf) {
            this.state = 'IN_PROGRESS';
            this.lockedJoint = trackingJoint;
            this.repStartTime = now;
            this.reachedPeak = false;
            this.hadBadForm = (formQuality === 'bad');
            this.badFormFrames = formQuality === 'bad' ? 1 : 0;
            this.badFormReason = formQuality === 'bad' ? formMessages.find(m => m.status === 'bad')?.message : null;
          }
          break;

        case 'IN_PROGRESS':
          if (currentAngle <= inflection) {
            this.state = 'PEAK_REACHED';
            this.reachedPeak = true;
          } else if (currentAngle >= start) {
            this.state = 'READY';
            this.lockedJoint = null;
            this.reachedPeak = false;
          }
          break;

        case 'PEAK_REACHED':
          if (currentAngle >= triggerHalf) {
            this.state = 'RETURNING';
          }
          break;

        case 'RETURNING':
          if (currentAngle >= start) {
            const duration = now - this.repStartTime;
            const cooldown = now - this.lastRepTime;

            // Strict Form Check: If user performed rep with bad form, reject it!
            if (this.hadBadForm && this.badFormFrames >= 3) {
              this.noReps++;
              this.lastRejectionReason = this.badFormReason || 'Improper form - keep elbows pinned!';
              this.state = 'NO_REP';
              this.lockedJoint = null;
              this.reachedPeak = false;
              this.hadBadForm = false;
              this.badFormFrames = 0;
              this.progress = 0;
              repRejected = true;

              return {
                repCompleted: false,
                repRejected: true,
                reason: this.lastRejectionReason,
                progress: 0,
                state: this.state,
                activeJoint: trackingJoint
              };
            }

            // Valid Rep: Reached peak and clean form
            if (this.reachedPeak && duration >= this.minRepDuration && cooldown >= this.repCooldown) {
              this.reps++;
              this.lastRepTime = now;
              this.history.push({
                rep: this.reps,
                formScore,
                duration,
                joint: trackingJoint,
                timestamp: now
              });
              repCompleted = true;
            }

            this.state = 'READY';
            this.lockedJoint = null;
            this.reachedPeak = false;
            this.hadBadForm = false;
            this.badFormFrames = 0;
            this.progress = 0;
          }
          break;

        default:
          this.state = 'READY';
          this.lockedJoint = null;
      }
    } else if (type === 'extend') {
      switch (this.state) {
        case 'READY':
        case 'NO_REP':
          if (currentAngle >= triggerHalf) {
            this.state = 'IN_PROGRESS';
            this.lockedJoint = trackingJoint;
            this.repStartTime = now;
            this.reachedPeak = false;
            this.hadBadForm = (formQuality === 'bad');
            this.badFormFrames = formQuality === 'bad' ? 1 : 0;
            this.badFormReason = formQuality === 'bad' ? formMessages.find(m => m.status === 'bad')?.message : null;
          }
          break;

        case 'IN_PROGRESS':
          if (currentAngle >= inflection) {
            this.state = 'PEAK_REACHED';
            this.reachedPeak = true;
          } else if (currentAngle <= start) {
            this.state = 'READY';
            this.lockedJoint = null;
            this.reachedPeak = false;
          }
          break;

        case 'PEAK_REACHED':
          if (currentAngle <= triggerHalf) {
            this.state = 'RETURNING';
          }
          break;

        case 'RETURNING':
          if (currentAngle <= start) {
            const duration = now - this.repStartTime;
            const cooldown = now - this.lastRepTime;

            if (this.hadBadForm && this.badFormFrames >= 3) {
              this.noReps++;
              this.lastRejectionReason = this.badFormReason || 'Improper form - not counted!';
              this.state = 'NO_REP';
              this.lockedJoint = null;
              this.reachedPeak = false;
              this.hadBadForm = false;
              this.badFormFrames = 0;
              this.progress = 0;
              repRejected = true;

              return {
                repCompleted: false,
                repRejected: true,
                reason: this.lastRejectionReason,
                progress: 0,
                state: this.state,
                activeJoint: trackingJoint
              };
            }

            if (this.reachedPeak && duration >= this.minRepDuration && cooldown >= this.repCooldown) {
              this.reps++;
              this.lastRepTime = now;
              this.history.push({
                rep: this.reps,
                formScore,
                duration,
                joint: trackingJoint,
                timestamp: now
              });
              repCompleted = true;
            }

            this.state = 'READY';
            this.lockedJoint = null;
            this.reachedPeak = false;
            this.hadBadForm = false;
            this.badFormFrames = 0;
            this.progress = 0;
          }
          break;

        default:
          this.state = 'READY';
          this.lockedJoint = null;
      }
    }

    return {
      repCompleted,
      repRejected,
      progress: this.progress,
      state: this.state,
      activeJoint: this.activeJoint
    };
  }

  _calcProgress(angle, type, thresholds) {
    const { start, inflection } = thresholds;
    if (type === 'flex') {
      const range = start - inflection;
      if (range <= 0) return 0;
      const prog = ((start - angle) / range) * 100;
      return Math.min(100, Math.max(0, Math.round(prog)));
    } else {
      const range = inflection - start;
      if (range <= 0) return 0;
      const prog = ((angle - start) / range) * 100;
      return Math.min(100, Math.max(0, Math.round(prog)));
    }
  }

  _updateHold(formScore) {
    const now = Date.now();
    let holdTick = false;

    if (formScore >= 60) {
      if (!this.lastHoldTick) this.lastHoldTick = now;
      if (now - this.lastHoldTick >= 1000) {
        this.holdSeconds++;
        this.reps = this.holdSeconds;
        this.lastHoldTick = now;
        holdTick = true;
      }
      this.state = 'HOLDING';
      this.progress = 100;
    } else {
      this.state = 'FORM_WARNING';
      this.progress = 50;
      this.lastHoldTick = now;
    }

    return {
      repCompleted: holdTick,
      repRejected: false,
      progress: this.progress,
      state: this.state,
      holdSeconds: this.holdSeconds
    };
  }

  getAverageFormScore() {
    if (this.history.length === 0) return 0;
    return Math.round(
      this.history.reduce((sum, h) => sum + h.formScore, 0) / this.history.length
    );
  }

  getStats() {
    return {
      reps: this.reps,
      noReps: this.noReps,
      sets: this.sets,
      state: this.state,
      progress: this.progress,
      activeJoint: this.activeJoint,
      holdSeconds: this.holdSeconds,
      averageFormScore: this.getAverageFormScore(),
      lastRejectionReason: this.lastRejectionReason,
      history: this.history,
      isHold: this.rule?.type === 'hold'
    };
  }
}
