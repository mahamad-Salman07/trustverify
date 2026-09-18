const API_URL = "http://127.0.0.1:8000";

export async function analyzeImage(file) {
  if (!file) {
    throw new Error("No image selected");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Analysis failed (${response.status}): ${errorText}`
    );
  }

  return await response.json();
}