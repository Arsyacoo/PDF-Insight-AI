const styles = {
  High: "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-red-50 text-red-700 border-red-200",
};

export default function ConfidenceBadge({ label = "Low" }) {
  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-bold ${styles[label] || styles.Low}`}>
      {label} Confidence
    </span>
  );
}
