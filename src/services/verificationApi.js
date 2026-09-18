const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

export async function analyzeImage(file) {
  if (!file) {
    throw new Error(
      "Please select an image."
    );
  }

  const formData = new FormData();
  formData.append("file", file);

  let response;

  try {
    response = await fetch(
      `${API_URL}/analyze`,
      {
        method: "POST",
        body: formData,
      }
    );
  } catch (error) {
    console.error(
      "TRUSTVERIFY verification API error:",
      error
    );

    throw new Error(
      "Unable to connect to the TrustVerify backend."
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Backend returned an invalid response."
    );
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `Analysis failed with status ${response.status}.`;

    const formattedMessage =
      Array.isArray(message)
        ? message
            .map(
              (item) =>
                item?.msg ||
                JSON.stringify(item)
            )
            .join(", ")
        : String(message);

    throw new Error(
      formattedMessage
    );
  }

  return data;
}

export function getRiskColor(level) {
  switch (
    String(level || "").toLowerCase()
  ) {
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