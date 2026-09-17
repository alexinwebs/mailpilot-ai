const automatedSenderPattern =
  /(?:^|[<@._+-])(?:no-?reply|do-?not-?reply|mailer-daemon)(?:@|[>._+-]|$)/i;

const explicitRequestPatterns = [
  /\?/,
  /\b(?:can|could|would|will)\s+you\b/i,
  /\bplease\s+(?:reply|respond|confirm|send|share|provide|review|approve|advise)\b/i,
  /\bplease\s+let\s+me\s+know\b/i,
  /\b(?:await|expect)\s+(?:your|a)\s+(?:reply|response|confirmation)\b/i,
  /\blook\s+forward\s+to\s+(?:your\s+response|hearing\s+from\s+you)\b/i,
];

export function hasExplicitReplyRequest(
  sender: string,
  subjectAndBody: string,
): boolean {
  if (automatedSenderPattern.test(sender)) return false;
  return explicitRequestPatterns.some(pattern => pattern.test(subjectAndBody));
}