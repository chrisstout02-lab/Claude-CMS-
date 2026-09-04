export default function Disclaimer() {
  return (
    <div
      className="rounded-lg border p-3 text-xs leading-relaxed"
      style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-secondary)" }}
    >
      <strong style={{ color: "var(--text-primary)" }}>For entertainment and informational purposes only.</strong>{" "}
      Rankings, records, and lines can change or be wrong, and nothing here is a guaranteed outcome or professional
      betting advice. Sports betting is illegal in some jurisdictions and restricted to 21+ (18+ in some states) where
      it is legal — check your local laws before wagering. If gambling stops being fun, free confidential help is
      available 24/7 from the National Problem Gambling Helpline: 1-800-GAMBLER.
    </div>
  );
}
