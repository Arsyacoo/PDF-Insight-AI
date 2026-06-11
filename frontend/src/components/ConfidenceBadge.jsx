const styles = {
  "High Relevance": "bg-green-100 text-success",
  "Medium Relevance": "bg-amber-100 text-amber",
  "Low Relevance": "bg-red-100 text-danger",
  High: "bg-green-100 text-success",
  Medium: "bg-amber-100 text-amber",
  Low: "bg-red-100 text-danger",
};

export default function ConfidenceBadge({ label = "Low Relevance" }) {
  const normalized = label === "High" ? "High Relevance" : label === "Medium" ? "Medium Relevance" : label === "Low" ? "Low Relevance" : label;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${styles[normalized] || styles["Low Relevance"]}`}>
      {normalized}
    </span>
  );
}
