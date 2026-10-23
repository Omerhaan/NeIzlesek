/**
 * Mobile Haptic Feedback Utility
 * Provides tactile vibration feedback on supported mobile devices (Android / Chrome / WebKit).
 * Safely falls back on unsupported devices (e.g. iOS Safari) without throwing errors.
 */

function vibrateSafe(pattern: number | number[]): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return
  if (!('vibrate' in navigator)) return

  try {
    navigator.vibrate(pattern)
  } catch {
    // Silent fail on platforms where vibration is blocked or restricted
  }
}

/**
 * Very subtle 10ms vibration tick for navigation, small buttons, or drag start
 */
export function hapticLight(): void {
  vibrateSafe(10)
}

/**
 * Satisfying 20ms vibration for Like / Positive actions
 */
export function hapticLike(): void {
  vibrateSafe(20)
}

/**
 * Soft 12ms vibration for Pass / Skip actions
 */
export function hapticPass(): void {
  vibrateSafe(12)
}

/**
 * Double pulse for 'Watched' action
 */
export function hapticWatched(): void {
  vibrateSafe([15, 30, 15])
}

/**
 * Heavy double vibration for Veto
 */
export function hapticVeto(): void {
  vibrateSafe([35, 40, 35])
}

/**
 * Celebration rhythm for Match celebration
 */
export function hapticMatch(): void {
  vibrateSafe([50, 50, 50, 50, 120])
}
