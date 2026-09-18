"""
============================================================
TRUSTVERIFY - AI IMAGE DETECTOR
============================================================

Purpose:
    Detect AI-generated / synthetic images.

Model:
    delpot/steganograph-ia-detector

Expected classes:
    real
    ai_generated

Important:
    This detector is one signal in TrustVerify.
    It should NOT be treated as absolute proof.

The result is deliberately conservative for:
    - screenshots
    - edited photographs
    - recompressed images
    - unknown image sources
============================================================
"""

import os
from typing import Any, Dict, List, Optional

from PIL import Image


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_NAME = os.getenv(
    "TRUSTVERIFY_AI_MODEL",
    "delpot/steganograph-ia-detector"
).strip()


AI_THRESHOLD = float(
    os.getenv(
        "TRUSTVERIFY_AI_THRESHOLD",
        "0.80"
    )
)


REAL_THRESHOLD = float(
    os.getenv(
        "TRUSTVERIFY_REAL_THRESHOLD",
        "0.80"
    )
)


# ============================================================
# GLOBAL MODEL
# ============================================================

_classifier = None
_model_load_attempted = False
_model_error: Optional[str] = None


# ============================================================
# LABEL NORMALIZATION
# ============================================================

def _normalize_label(label: Any) -> str:

    if label is None:
        return ""

    value = str(label).strip().lower()

    value = value.replace("-", "_")
    value = value.replace(" ", "_")

    return value


def _label_type(label: Any) -> str:

    normalized = _normalize_label(label)

    # Actual labels from this model
    if normalized in {
        "ai_generated",
        "ai",
        "synthetic",
        "generated",
        "fake",
    }:
        return "ai"

    if normalized in {
        "real",
        "real_image",
        "real_photo",
        "real_photograph",
        "authentic",
    }:
        return "real"

    return "unknown"


# ============================================================
# SAFE FLOAT
# ============================================================

def _safe_float(
    value: Any,
    default: float = 0.0
) -> float:

    try:

        number = float(value)

        if number != number:
            return default

        if number < 0:
            return default

        if number > 1:
            number /= 100.0

        return min(
            max(number, 0.0),
            1.0
        )

    except (
        TypeError,
        ValueError
    ):

        return default


# ============================================================
# LOAD MODEL
# ============================================================

def _load_model():

    global _classifier
    global _model_load_attempted
    global _model_error

    if _model_load_attempted:
        return _classifier

    _model_load_attempted = True

    if not MODEL_NAME:

        _model_error = (
            "TRUSTVERIFY_AI_MODEL is not configured."
        )

        return None

    try:

        from transformers import pipeline

        print("=" * 60)
        print("TRUSTVERIFY AI DETECTOR")
        print("=" * 60)
        print(
            f"Loading AI detector model: {MODEL_NAME}"
        )

        _classifier = pipeline(
            "image-classification",
            model=MODEL_NAME
        )

        print(
            "TRUSTVERIFY: AI detector loaded successfully."
        )

        print("=" * 60)

    except Exception as error:

        _model_error = str(error)

        _classifier = None

        print(
            "TRUSTVERIFY: AI detector failed to load."
        )

        print(
            f"Reason: {error}"
        )

    return _classifier


# ============================================================
# IMAGE INFORMATION
# ============================================================

def _get_image_info(
    file_path: str
) -> Dict[str, Any]:

    info = {
        "width": None,
        "height": None,
        "format": None,
        "mode": None,
        "megapixels": None
    }

    try:

        with Image.open(file_path) as image:

            width, height = image.size

            info["width"] = width
            info["height"] = height
            info["format"] = image.format
            info["mode"] = image.mode

            info["megapixels"] = round(
                (
                    width * height
                ) / 1_000_000,
                3
            )

    except Exception:
        pass

    return info


# ============================================================
# SCREENSHOT HEURISTICS
# ============================================================

def _detect_screenshot_characteristics(
    file_path: str,
    image_info: Dict[str, Any]
) -> Dict[str, Any]:

    """
    This does NOT claim that an image is a screenshot.

    It only identifies characteristics commonly associated
    with screenshots.

    These characteristics are used to reduce overconfidence,
    not to declare an image real.
    """

    signals = []
    score = 0.0

    width = image_info.get("width")
    height = image_info.get("height")
    image_format = image_info.get("format")

    if width and height:

        # Common desktop/browser screenshot dimensions
        common_sizes = {
            (1920, 1080),
            (1366, 768),
            (1536, 864),
            (1440, 900),
            (1280, 720),
            (1600, 900),
            (2560, 1440),
            (3840, 2160),
            (1170, 2532),
            (1080, 1920),
            (1290, 2796),
        }

        if (width, height) in common_sizes:

            signals.append(
                "Common screen-capture resolution."
            )

            score += 0.35

        aspect_ratio = width / height

        if (
            1.6 <= aspect_ratio <= 1.9
        ):

            signals.append(
                "Wide display-style aspect ratio."
            )

            score += 0.10

        if (
            0.45 <= aspect_ratio <= 0.60
            or
            1.65 <= aspect_ratio <= 2.30
        ):

            score += 0.05

    if image_format == "PNG":

        signals.append(
            "PNG format is compatible with screenshots."
        )

        score += 0.10

    return {
        "possible": score >= 0.35,
        "score": min(score, 1.0),
        "signals": signals
    }


# ============================================================
# NORMALIZE PREDICTIONS
# ============================================================

def _normalize_predictions(
    predictions: Any
) -> List[Dict[str, Any]]:

    if predictions is None:
        return []

    # Handle nested Transformers output
    if (
        isinstance(predictions, list)
        and predictions
        and isinstance(predictions[0], list)
    ):
        predictions = predictions[0]

    if not isinstance(
        predictions,
        list
    ):
        return []

    normalized = []

    for item in predictions:

        if not isinstance(
            item,
            dict
        ):
            continue

        label = item.get(
            "label",
            ""
        )

        score = _safe_float(
            item.get(
                "score",
                0.0
            )
        )

        normalized.append(
            {
                "label": str(label),
                "score": round(
                    score,
                    6
                ),
                "percentage": round(
                    score * 100,
                    2
                ),
                "type": _label_type(label)
            }
        )

    normalized.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    return normalized


# ============================================================
# EXTRACT MODEL SCORES
# ============================================================

def _extract_scores(
    predictions: List[Dict[str, Any]]
):

    ai_score = 0.0
    real_score = 0.0

    ai_labels = []
    real_labels = []

    for prediction in predictions:

        label_type = prediction.get(
            "type",
            "unknown"
        )

        score = _safe_float(
            prediction.get(
                "score",
                0.0
            )
        )

        if label_type == "ai":

            ai_score = max(
                ai_score,
                score
            )

            ai_labels.append(
                prediction
            )

        elif label_type == "real":

            real_score = max(
                real_score,
                score
            )

            real_labels.append(
                prediction
            )

    return (
        ai_score,
        real_score,
        ai_labels,
        real_labels
    )


# ============================================================
# DETERMINE VERDICT
# ============================================================

def _determine_verdict(
    ai_score: float,
    real_score: float,
    screenshot_possible: bool
):

    # --------------------------------------------------------
    # Both classes
    # --------------------------------------------------------

    if ai_score > 0 and real_score > 0:

        total = (
            ai_score +
            real_score
        )

        normalized_ai = (
            ai_score / total
        )

        normalized_real = (
            real_score / total
        )

        # ----------------------------------------------------
        # Strong AI
        # ----------------------------------------------------

        if (
            normalized_ai >= AI_THRESHOLD
        ):

            # Screenshot safeguard:
            #
            # We do NOT automatically call it real.
            # Instead we reduce certainty because the
            # detector was not trained specifically for
            # screenshots.

            if screenshot_possible:

                return (
                    "uncertain",
                    (
                        "The AI detector produced a strong "
                        "synthetic signal, but the image also "
                        "has screenshot-like characteristics. "
                        "Additional forensic evidence is "
                        "recommended before calling it "
                        "AI-generated."
                    ),
                    normalized_ai * 0.65
                )

            return (
                "ai-generated",
                (
                    "The AI detector found a strong "
                    "synthetic-image signal."
                ),
                normalized_ai
            )

        # ----------------------------------------------------
        # Strong REAL
        # ----------------------------------------------------

        if (
            normalized_real >= REAL_THRESHOLD
        ):

            return (
                "likely-real",
                (
                    "The AI detector found a strong "
                    "real-image signal."
                ),
                normalized_real
            )

        return (
            "uncertain",
            (
                "The AI detector produced mixed or "
                "inconclusive evidence."
            ),
            max(
                normalized_ai,
                normalized_real
            )
        )

    # --------------------------------------------------------
    # AI only
    # --------------------------------------------------------

    if ai_score > 0:

        if ai_score >= AI_THRESHOLD:

            if screenshot_possible:

                return (
                    "uncertain",
                    (
                        "A strong AI-generation signal was "
                        "detected, but screenshot-like "
                        "characteristics reduce confidence."
                    ),
                    ai_score * 0.65
                )

            return (
                "ai-generated",
                (
                    "The model produced a strong "
                    "AI-generation signal."
                ),
                ai_score
            )

        return (
            "uncertain",
            (
                "An AI-generation signal was detected, "
                "but it is not strong enough for a reliable "
                "classification."
            ),
            ai_score
        )

    # --------------------------------------------------------
    # REAL only
    # --------------------------------------------------------

    if real_score > 0:

        if real_score >= REAL_THRESHOLD:

            return (
                "likely-real",
                (
                    "The model produced a strong "
                    "real-image signal."
                ),
                real_score
            )

        return (
            "uncertain",
            (
                "A real-image signal was detected, "
                "but it is not strong enough for a "
                "reliable classification."
            ),
            real_score
        )

    # --------------------------------------------------------
    # Unknown
    # --------------------------------------------------------

    return (
        "unknown",
        (
            "The model returned labels that TrustVerify "
            "could not interpret."
        ),
        0.0
    )


# ============================================================
# MAIN PUBLIC FUNCTION
# ============================================================

def ai_analyze_image(
    file_path: str
) -> Dict[str, Any]:

    result = {

        "available": False,

        "model": (
            MODEL_NAME
            if MODEL_NAME
            else "not_configured"
        ),

        "prediction": "unknown",

        "ai_probability": None,

        "real_probability": None,

        "confidence": None,

        "labels": [],

        "ai_labels": [],

        "real_labels": [],

        "flags": [],

        "message": None,

        "error": None,

        "image_info": {},

        "screenshot_analysis": {
            "possible": False,
            "score": 0.0,
            "signals": []
        }
    }

    # ========================================================
    # FILE VALIDATION
    # ========================================================

    if not file_path:

        result["error"] = (
            "No image path was provided."
        )

        result["message"] = (
            "AI analysis could not start because "
            "no image path was provided."
        )

        result["flags"].append(
            "No image file was provided."
        )

        return result

    if not os.path.isfile(
        file_path
    ):

        result["error"] = (
            "Image file does not exist."
        )

        result["message"] = (
            "AI analysis could not start because "
            "the image file does not exist."
        )

        result["flags"].append(
            "Image file does not exist."
        )

        return result

    # ========================================================
    # IMAGE INFORMATION
    # ========================================================

    image_info = _get_image_info(
        file_path
    )

    result["image_info"] = image_info

    screenshot_analysis = (
        _detect_screenshot_characteristics(
            file_path,
            image_info
        )
    )

    result["screenshot_analysis"] = (
        screenshot_analysis
    )

    if screenshot_analysis["possible"]:

        result["flags"].append(
            "Image has screenshot-like characteristics."
        )

    # ========================================================
    # LOAD MODEL
    # ========================================================

    classifier = _load_model()

    if classifier is None:

        result["message"] = (
            "AI detection is currently unavailable."
        )

        result["flags"].append(
            "AI detector unavailable."
        )

        if _model_error:

            result["error"] = (
                _model_error
            )

        return result

    # ========================================================
    # RUN MODEL
    # ========================================================

    try:

        predictions = classifier(
            file_path,
            top_k=2
        )

    except Exception as error:

        result["error"] = str(
            error
        )

        result["message"] = (
            "The AI detector could not analyze "
            "this image."
        )

        result["flags"].append(
            "AI analysis failed."
        )

        return result

    # ========================================================
    # NORMALIZE
    # ========================================================

    predictions = _normalize_predictions(
        predictions
    )

    if not predictions:

        result["message"] = (
            "The AI detector returned no usable predictions."
        )

        result["flags"].append(
            "No AI predictions returned."
        )

        return result

    result["labels"] = predictions
    result["available"] = True

    # ========================================================
    # EXTRACT SCORES
    # ========================================================

    (
        ai_score,
        real_score,
        ai_labels,
        real_labels
    ) = _extract_scores(
        predictions
    )

    result["ai_labels"] = ai_labels
    result["real_labels"] = real_labels

    # ========================================================
    # VERDICT
    # ========================================================

    (
        verdict,
        message,
        confidence
    ) = _determine_verdict(
        ai_score,
        real_score,
        screenshot_analysis["possible"]
    )

    result["prediction"] = verdict
    result["message"] = message

    # ========================================================
    # PROBABILITIES
    # ========================================================

    total = (
        ai_score +
        real_score
    )

    if total > 0:

        result["ai_probability"] = round(
            (
                ai_score /
                total
            ) * 100,
            2
        )

        result["real_probability"] = round(
            (
                real_score /
                total
            ) * 100,
            2
        )

    # ========================================================
    # CONFIDENCE
    # ========================================================

    result["confidence"] = round(
        confidence * 100,
        2
    )

    # ========================================================
    # FLAGS
    # ========================================================

    if verdict == "ai-generated":

        result["flags"].append(
            "Strong AI-generation signal."
        )

    elif verdict == "likely-real":

        result["flags"].append(
            "Strong real-image signal."
        )

    elif verdict == "uncertain":

        result["flags"].append(
            "AI detector evidence is inconclusive."
        )

    else:

        result["flags"].append(
            "AI detector could not establish "
            "a reliable classification."
        )

    if not ai_labels:

        result["flags"].append(
            "No recognizable AI class label was returned."
        )

    if not real_labels:

        result["flags"].append(
            "No recognizable real class label was returned."
        )

    # ========================================================
    # FINAL MESSAGE FOR SCREENSHOTS
    # ========================================================

    if screenshot_analysis["possible"]:

        result["flags"].append(
            "Screenshot-like images require additional "
            "forensic evidence because this AI detector "
            "was trained primarily on photographs."
        )

    return result


# ============================================================
# COMPATIBILITY ALIAS
# ============================================================

analyze_ai_image = ai_analyze_image


# ============================================================
# MODULE TEST
# ============================================================

if __name__ == "__main__":

    print(
        "TRUSTVERIFY AI detector module loaded."
    )

    print(
        f"Configured model: {MODEL_NAME}"
    )

    print(
        f"AI threshold: {AI_THRESHOLD}"
    )

    print(
        f"Real threshold: {REAL_THRESHOLD}"
    )

    print(
        "Public function: ai_analyze_image"
    )