import { pipeline } from "@huggingface/transformers";

const MODEL_ID =
  "onnx-community/ai-image-detect-distilled-ONNX";

let classifierPromise = null;

function normalizeLabel(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function getLabelType(label) {
  const normalized = normalizeLabel(label);

  if (
    normalized === "fake" ||
    normalized === "ai" ||
    normalized.includes("fake") ||
    normalized.includes("synthetic")
  ) {
    return "ai";
  }

  if (
    normalized === "real" ||
    normalized.includes("real")
  ) {
    return "real";
  }

  return "unknown";
}

function clamp(value, min = 0, max = 1) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.min(
    max,
    Math.max(min, number)
  );
}

async function createClassifier() {
  try {
    console.log(
      "TRUSTVERIFY: Loading browser AI detector with WebGPU..."
    );

    return await pipeline(
      "image-classification",
      MODEL_ID,
      {
        device: "webgpu",
        dtype: "q4",
      }
    );
  } catch (webgpuError) {
    console.warn(
      "TRUSTVERIFY: WebGPU unavailable, using WASM CPU.",
      webgpuError
    );

    return await pipeline(
      "image-classification",
      MODEL_ID,
      {
        dtype: "q4",
      }
    );
  }
}

async function getClassifier() {
  if (!classifierPromise) {
    classifierPromise = createClassifier();
  }

  try {
    return await classifierPromise;
  } catch (error) {
    classifierPromise = null;
    throw error;
  }
}

function normalizePredictions(predictions) {
  if (!Array.isArray(predictions)) {
    return [];
  }

  return predictions
    .map((item) => {
      const score = clamp(item?.score);

      const label = String(
        item?.label || "unknown"
      );

      const type = getLabelType(label);

      return {
        label,
        score: Number(score.toFixed(6)),
        percentage: Number(
          (score * 100).toFixed(2)
        ),
        type,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score
    );
}

export async function analyzeImageWithBrowserAI(file) {
  if (!(file instanceof File)) {
    throw new Error(
      "A valid image file is required."
    );
  }

  let objectUrl = null;

  try {
    objectUrl =
      URL.createObjectURL(file);

    const classifier =
      await getClassifier();

    console.log(
      "TRUSTVERIFY: Running browser AI inference..."
    );

    const rawPredictions =
      await classifier(
        objectUrl,
        {
          top_k: 2,
        }
      );

    const predictions =
      normalizePredictions(
        rawPredictions
      );

    if (!predictions.length) {
      return {
        available: false,
        model: MODEL_ID,
        prediction: "unknown",
        ai_probability: null,
        real_probability: null,
        confidence: null,
        labels: [],
        ai_labels: [],
        real_labels: [],
        flags: [
          "Browser AI detector returned no usable predictions."
        ],
        message:
          "No usable AI prediction was returned.",
        error: null,
        source: "browser",
      };
    }

    let aiScore = 0;
    let realScore = 0;

    const aiLabels = [];
    const realLabels = [];

    for (const prediction of predictions) {
      if (prediction.type === "ai") {
        aiScore = Math.max(
          aiScore,
          prediction.score
        );

        aiLabels.push(
          prediction
        );
      }

      if (prediction.type === "real") {
        realScore = Math.max(
          realScore,
          prediction.score
        );

        realLabels.push(
          prediction
        );
      }
    }

    const total =
      aiScore + realScore;

    let aiProbability = 0;
    let realProbability = 0;

    if (total > 0) {
      aiProbability =
        aiScore / total;

      realProbability =
        realScore / total;
    }

    let prediction = "unknown";

    if (
      aiProbability >=
      realProbability
      &&
      total > 0
    ) {
      prediction =
        aiProbability >= 0.80
          ? "ai-generated"
          : "uncertain";
    } else if (total > 0) {
      prediction =
        realProbability >= 0.80
          ? "likely-real"
          : "uncertain";
    }

    const confidence =
      Math.max(
        aiProbability,
        realProbability
      );

    const flags = [];

    if (prediction === "ai-generated") {
      flags.push(
        "Strong AI-generation signal."
      );
    } else if (
      prediction === "likely-real"
    ) {
      flags.push(
        "Strong real-image signal."
      );
    } else {
      flags.push(
        "AI detector evidence is inconclusive."
      );
    }

    return {
      available: true,

      model: MODEL_ID,

      prediction,

      ai_probability: Number(
        (aiProbability * 100).toFixed(2)
      ),

      real_probability: Number(
        (realProbability * 100).toFixed(2)
      ),

      confidence: Number(
        (confidence * 100).toFixed(2)
      ),

      labels: predictions,

      ai_labels: aiLabels,

      real_labels: realLabels,

      flags,

      message:
        "Browser-side AI image classification completed.",

      error: null,

      source: "browser",
    };

  } catch (error) {

    console.error(
      "TRUSTVERIFY browser AI error:",
      error
    );

    return {
      available: false,

      model: MODEL_ID,

      prediction: "unknown",

      ai_probability: null,

      real_probability: null,

      confidence: null,

      labels: [],

      ai_labels: [],

      real_labels: [],

      flags: [
        "Browser AI analysis failed."
      ],

      message:
        "Browser-side AI analysis could not be completed.",

      error:
        error?.message ||
        String(error),

      source: "browser",
    };

  } finally {

    if (objectUrl) {
      URL.revokeObjectURL(
        objectUrl
      );
    }
  }
}

export function getBrowserAiModel() {
  return MODEL_ID;
}