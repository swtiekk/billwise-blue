/**
 * Maps each rule from Chapter III (Section 3.1.2.2) to its reason text.
 * The backend returns `rule_applied` (e.g., "Rule 2"), and the frontend
 * displays the matching explanation.
 */

export function getReasonFromRule(
    ruleApplied: string | null | undefined,
    gracePeriodDays: number | null | undefined,
): string {
    if (!ruleApplied) {
        return 'Not yet classified. Run prioritization to see the reason.';
    }

    const grace = gracePeriodDays ?? 0;

    switch (ruleApplied) {
        case 'Rule 1':
            return 'Essential bill with a late penalty and no grace period. Must be settled within the current pay period.';

        case 'Rule 2':
            return `Essential bill with a ${grace}-day grace period. The grace period only delays the penalty — it does not remove it, so this bill must still be paid this period.`;

        case 'Rule 3':
            return `Non-essential but penalized. Has a ${grace}-day grace period — safe to defer when budget is tight.`;

        case 'Rule 4a':
            return 'Discretionary expense with no penalty — freely deferrable to any future period.';

        case 'Rule 4b':
            return `Discretionary but penalized. Has a ${grace}-day grace period — settle soon to avoid charges.`;

        case 'Fallback':
            return 'No specific rule matched — conservative default applied.';

        default:
            return 'Reason unavailable for this classification.';
    }
}