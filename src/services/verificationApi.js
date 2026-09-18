const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function analyzeImage(file) {
  if (!file) {
    throw new Error("Please select an image.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Backend returned an invalid response.");
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `Analysis failed with status ${response.status}`;

    throw new Error(
      Array.isArray(message)
        ? message.map((x) => x.msg || JSON.stringify(x)).join(", ")
        : message
    );
  }

  return data;
}

export function getRiskColor(level) {
  switch ((level || "").toLowerCase()) {
    case "low":
      return "green";

    case "medium":
      return "yellow";

    case "high":
      return "orange";

    case "critical":
      return "red";

    default:
      return "gray";
  }
}