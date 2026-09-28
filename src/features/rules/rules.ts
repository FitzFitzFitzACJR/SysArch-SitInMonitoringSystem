/** A student must (re-)accept the rules when there are rules and they haven't accepted this version. */
export function needsRulesAcceptance(
  settings: { rulesText: string; rulesVersion: number },
  user: { rulesAcceptedVer: number | null },
) {
  return settings.rulesText.trim().length > 0 && user.rulesAcceptedVer !== settings.rulesVersion;
}
