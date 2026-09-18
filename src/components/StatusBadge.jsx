export default function StatusBadge({ status }) {
  const styles = {
    verified: "bg-green-100 text-green-700",
    suspicious: "bg-orange-100 text-orange-700",
    failed: "bg-red-100 text-red-700",
    processing: "bg-blue-100 text-blue-700",
    inconclusive: "bg-yellow-100 text-yellow-700",
  };

  const key = status?.toLowerCase() || "processing";

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
        styles[key] || styles.processing
      }`}
    >
      {status || "Processing"}
    </span>
  );
}