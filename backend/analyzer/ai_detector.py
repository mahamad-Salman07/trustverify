"""
============================================================
TRUSTVERIFY - AI IMAGE DETECTOR
============================================================

FREE / LOW-MEMORY BACKEND VERSION

The FastAPI backend does NOT load PyTorch or Transformers.

AI inference is performed in the browser using:

    onnx-community/ai-image-detect-distilled-ONNX

The browser sends the AI result to the backend.

Backend responsibilities remain:

    - Metadata
    - Forensics
    - ELA
    - Manipulation
    - Recapture
    - Fingerprinting
    - Web trace
    - Evidence fusion
    - Report generation

IMPORTANT:

This module does not claim an image is AI-generated unless
an actual browser-side AI result is supplied.

============================================================
"""

import os
from typing import Any, Dict, Optional

from PIL import Image


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_NAME = os.getenv(
    "TRUSTVERIFY_AI_MODEL",
    "onnx-community/ai-image-detect-distilled-ONNX"
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
# IMAGE INFORMATION
# ============================================================

def _get_image_info(
    file_path: str
) -> Dict[str, Any]:

    result = {
        "width": None,
        "height": None,
        "format": None,
        "mode": None,
        "megapixels": None
    }

    try:

        with Image.open(
            file_path
        ) as image:

            width, height = image.size

            result["width"] = width
            result["height"] = height
            result["format"] = image.format
            result["mode"] = image.mode

            result["megapixels"] = round(
                (
                    width * height
                ) / 1_000_000,
                3
            )

    except Exception:

        pass

    return result


# ============================================================
# SCREENSHOT HEURISTICS
# ============================================================

def _detect_screenshot_characteristics(
    image_info: Dict[str, Any]
) -> Dict[str, Any]:

    """
    Detects characteristics commonly associated with
    screenshots.

    This is contextual evidence only.
    It does not prove an image is a screenshot.
    """

    signals = []

    score = 0.0

    width = image_info.get(
        "width"
    )

    height = image_info.get(
        "height"
    )

    image_format = image_info.get(
        "format"
    )

    # --------------------------------------------------------
    # Common screen resolutions
    # --------------------------------------------------------

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

    if (
        width,
        height
    ) in common_sizes:

        signals.append(
            "Common screen-capture resolution."
        )

        score += 0.35

    # --------------------------------------------------------
    # Aspect ratio
    # --------------------------------------------------------

    if (
        width
        and
        height
        and
        height > 0
    ):

        ratio = (
            width /
            height
        )

        if (
            1.60 <= ratio <= 1.90
        ):

            signals.append(
                "Wide display-style aspect ratio."
            )

            score += 0.10

        elif (
            0.45 <= ratio <= 0.60
        ):

            signals.append(
                "Tall display-style aspect ratio."
            )

            score += 0.05

    # --------------------------------------------------------
    # PNG
    # --------------------------------------------------------

    if image_format == "PNG":

        signals.append(
            "PNG format is compatible with screenshots."
        )

        score += 0.10

    score = min(
        1.0,
        score
    )

    return {

        "possible":
            score >= 0.35,

        "score":
            round(
                score,
                3
            ),

        "signals":
            signals
    }


# ============================================================
# NORMALIZE EXTERNAL AI RESULT
# ============================================================

def normalize_external_ai_result(
    ai_result: Any
) -> Dict[str, Any]:

    """
    Normalize browser-side AI output into the structure
    expected by the TrustVerify evidence-fusion engine.
    """

    if not isinstance(
        ai_result,
        dict
    ):

        return {

            "available": False,

            "model": MODEL_NAME,

            "prediction": "unknown",

            "ai_probability": None,

            "real_probability": None,

            "confidence": None,

            "labels": [],

            "ai_labels": [],

            "real_labels": [],

            "flags": [
                "Browser AI result was not supplied."
            ],

            "message":
                "AI analysis is unavailable.",

            "error": None,

            "source": "browser"
        }

    labels = ai_result.get(
        "labels",
        []
    )

    if not isinstance(
        labels,
        list
    ):

        labels = []

    ai_labels = ai_result.get(
        "ai_labels",
        []
    )

    if not isinstance(
        ai_labels,
        list
    ):

        ai_labels = []

    real_labels = ai_result.get(
        "real_labels",
        []
    )

    if not isinstance(
        real_labels,
        list
    ):

        real_labels = []

    flags = ai_result.get(
        "flags",
        []
    )

    if not isinstance(
        flags,
        list
    ):

        flags = []

    model = ai_result.get(
        "model"
    )

    if not model:

        model = MODEL_NAME

    return {

        "available":
            bool(
                ai_result.get(
                    "available",
                    False
                )
            ),

        "model":
            str(model),

        "prediction":
            str(
                ai_result.get(
                    "prediction",
                    "unknown"
                )
            ),

        "ai_probability":
            ai_result.get(
                "ai_probability"
            ),

        "real_probability":
            ai_result.get(
                "real_probability"
            ),

        "confidence":
            ai_result.get(
                "confidence"
            ),

        "labels":
            labels,

        "ai_labels":
            ai_labels,

        "real_labels":
            real_labels,

        "flags":
            flags,

        "message":
            ai_result.get(
                "message"
            ),

        "error":
            ai_result.get(
                "error"
            ),

        "source":
            "browser"
    }


# ============================================================
# MAIN AI FUNCTION
# ============================================================

def ai_analyze_image(
    file_path: str,
    external_result: Optional[
        Dict[str, Any]
    ] = None
) -> Dict[str, Any]:

    """
    Backend compatibility function.

    No Torch.
    No Transformers.
    No model download.

    If browser AI output exists, it is normalized and returned.

    If not, TrustVerify safely reports that AI inference is
    unavailable on the backend.
    """

    image_info = _get_image_info(
        file_path
    )

    screenshot_analysis = (
        _detect_screenshot_characteristics(
            image_info
        )
    )

    # ========================================================
    # BROWSER RESULT AVAILABLE
    # ========================================================

    if external_result is not None:

        result = normalize_external_ai_result(
            external_result
        )

        result["image_info"] = (
            image_info
        )

        result["screenshot_analysis"] = (
            screenshot_analysis
        )

        if screenshot_analysis[
            "possible"
        ]:

            if (
                "Image has screenshot-like characteristics."
                not in result["flags"]
            ):

                result["flags"].append(
                    "Image has screenshot-like characteristics."
                )

            result["flags"].append(
                "Screenshot context should be interpreted "
                "with additional forensic evidence."
            )

        return result

    # ========================================================
    # NO BROWSER RESULT
    # ========================================================

    return {

        "available":
            False,

        "model":
            "browser-side AI detector",

        "prediction":
            "unknown",

        "ai_probability":
            None,

        "real_probability":
            None,

        "confidence":
            None,

        "labels":
            [],

        "ai_labels":
            [],

        "real_labels":
            [],

        "flags": [

            "AI analysis was not supplied "
            "by the browser."
        ],

        "message":
            (
                "Browser-side AI inference is required "
                "for AI-generation analysis."
            ),

        "error":
            None,

        "image_info":
            image_info,

        "screenshot_analysis":
            screenshot_analysis,

        "source":
            "browser-pending"
    }


# ============================================================
# COMPATIBILITY ALIAS
# ============================================================

analyze_ai_image = ai_analyze_image


# ============================================================
# MODULE TEST
# ============================================================

if __name__ == "__main__":

    print(
        "=" * 60
    )

    print(
        "TRUSTVERIFY AI DETECTOR"
    )

    print(
        "=" * 60
    )

    print(
        "Backend AI model loading: DISABLED"
    )

    print(
        "Backend inference engine: BROWSER"
    )

    print(
        f"Browser model: {MODEL_NAME}"
    )

    print(
        f"AI threshold: {AI_THRESHOLD}"
    )

    print(
        f"Real threshold: {REAL_THRESHOLD}"
    )

    print(
        "=" * 60
    )