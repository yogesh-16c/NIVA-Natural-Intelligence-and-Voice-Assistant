/**
 * Action Safety Service
 * Reframed to provide genuine client-side safety guardrails:
 * - Domain allowlist verification
 * - User confirmation for external actions (e.g. browser navigation)
 * - Safe regex credential sanitization
 * - No fabricated security scores, hashes, or claims.
 */

export * from './actionSafetyService';
export { actionSafetyService as securityService } from './actionSafetyService';
