/**
 * Display-name fixes for PlayerData athletes, keyed by Person ID.
 *
 * PlayerData's Person ID is stable even when a name is misspelled in the
 * portal, so fixes go here rather than in the raw data. Applies to sessions
 * parsed after the change — already-uploaded JSONs keep the old name until
 * that date is deleted and re-processed.
 */

export const NAME_OVERRIDES: Record<string, string> = {
  "671e32e3-dd55-459c-9ebb-faddd42a6a34": "Julian Banks", // portal spelling: "Julain Banks"
};
