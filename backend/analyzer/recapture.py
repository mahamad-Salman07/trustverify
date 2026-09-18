"""
============================================================
TRUSTVERIFY - Screenshot / Recapture Intelligence
============================================================

Purpose:
    Detect whether an image is likely to be:

        1. A screenshot / screen capture
        2. A normal camera photograph
        3. A possible display recapture

Important:
    These are forensic indicators, NOT absolute proof.

The detector combines:

    - Metadata/software signals
    - Screen-resolution signals
    - PNG/RGBA signals
    - Alpha/transparency information
    - Flat-region analysis
    - Edge density
    - Color quantization
    - Image dimensions
    - Camera metadata absence/presence

The detector intentionally avoids declaring a normal
photograph a screenshot from resolution alone.
============================================================
"""

from PIL import Image

import numpy as np


# ============================================================
# COMMON DISPLAY RESOLUTIONS
# ============================================================

COMMON_SCREEN_SIZES = {

    (1920, 1080),
    (1366, 768),
    (1536, 864),
    (1280, 720),
    (1600, 900),
    (2560, 1440),
    (3840, 2160),
    (2560, 1600),
    (2880, 1800),
    (3024, 1964),
    (3456, 2234),
    (1920, 1200),
    (1280, 800),
    (1440, 900),
}


# ============================================================
# SCREENSHOT SOFTWARE
# ============================================================

SCREENSHOT_SOFTWARE = [

    "screenshot",
    "screen shot",
    "snipping tool",
    "snip & sketch",
    "screen capture",
    "screenclip",
    "greenshot",
    "lightshot",
    "sharex",
    "flameshot",
    "gyazo",
    "monosnap",
    "picpick",
    "screenpresso",
    "screencapture",
    "grab"
]


# ============================================================
# SAFE FLOAT
# ============================================================

def _safe_float(value, default=0.0):

    try:

        number = float(value)

        if not np.isfinite(number):
            return default

        return number

    except Exception:

        return default


# ============================================================
# IMAGE STATISTICS
# ============================================================

def _image_statistics(image):

    """
    Calculate simple visual statistics.

    These are not AI features.
    They are used only as supporting evidence.
    """

    rgb = image.convert("RGB")

    # Resize for inexpensive analysis.
    small = rgb.copy()

    small.thumbnail(
        (512, 512)
    )

    arr = np.asarray(
        small,
        dtype=np.float32
    )

    if arr.size == 0:

        return {

            "flat_ratio": 0.0,
            "edge_density": 0.0,
            "color_diversity": 0.0,
            "gradient_strength": 0.0
        }

    # --------------------------------------------------------
    # GRAYSCALE
    # --------------------------------------------------------

    gray = (
        0.299 * arr[:, :, 0]
        +
        0.587 * arr[:, :, 1]
        +
        0.114 * arr[:, :, 2]
    )

    # --------------------------------------------------------
    # GRADIENT
    # --------------------------------------------------------

    gx = np.diff(
        gray,
        axis=1
    )

    gy = np.diff(
        gray,
        axis=0
    )

    if gx.size and gy.size:

        gradient = np.sqrt(
            gx[:, :-1] ** 2
            +
            gy[:-1, :] ** 2
        )

    else:

        gradient = np.array(
            [0],
            dtype=np.float32
        )

    gradient_strength = float(
        np.mean(gradient)
    )

    # --------------------------------------------------------
    # EDGE DENSITY
    # --------------------------------------------------------

    edges = (
        gradient > 25
    )

    edge_density = float(
        np.mean(edges)
    )

    # --------------------------------------------------------
    # FLAT REGIONS
    # --------------------------------------------------------

    # Screenshots often contain:
    #
    # - UI backgrounds
    # - panels
    # - text areas
    # - solid colors
    #
    # Camera photographs generally have
    # more continuous natural variation.

    local_variation = np.abs(
        np.diff(
            gray,
            axis=0
        )
    )

    if local_variation.size:

        flat_ratio = float(
            np.mean(
                local_variation < 2.0
            )
        )

    else:

        flat_ratio = 0.0

    # --------------------------------------------------------
    # COLOR DIVERSITY
    # --------------------------------------------------------

    # Quantize RGB into 16 levels/channel.
    quantized = (
        arr.astype(np.uint8)
        // 16
    )

    unique_colors = np.unique(
        quantized.reshape(
            -1,
            3
        ),
        axis=0
    )

    total_pixels = (
        arr.shape[0]
        *
        arr.shape[1]
    )

    if total_pixels > 0:

        color_diversity = min(
            1.0,
            len(unique_colors)
            /
            max(
                1,
                total_pixels * 0.08
            )
        )

    else:

        color_diversity = 0.0

    return {

        "flat_ratio": round(
            flat_ratio,
            4
        ),

        "edge_density": round(
            edge_density,
            4
        ),

        "color_diversity": round(
            color_diversity,
            4
        ),

        "gradient_strength": round(
            gradient_strength,
            4
        )
    }


# ============================================================
# ASPECT RATIO
# ============================================================

def _screen_aspect_ratio(width, height):

    if height <= 0:
        return False

    ratio = width / height

    common_ratios = [

        16 / 9,
        16 / 10,
        3 / 2,
        4 / 3,
        21 / 9
    ]

    for target in common_ratios:

        if abs(
            ratio - target
        ) < 0.015:

            return True

    return False


# ============================================================
# MAIN ANALYSIS
# ============================================================

def analyze_recapture(
    file_path,
    metadata=None
):

    result = {

        "available": False,

        "likely_screenshot": False,

        "likely_recapture": False,

        "confidence": 0,

        "indicators": [],

        "screenshot_confidence": 0,

        "recapture_confidence": 0,

        "screenshot_score": 0,

        "recapture_score": 0,

        "signals": {},

        "method": (
            "Multi-signal screenshot and "
            "recapture analysis"
        )
    }

    try:

        # ====================================================
        # OPEN IMAGE
        # ====================================================

        image = Image.open(
            file_path
        )

        width = int(
            image.width
        )

        height = int(
            image.height
        )

        image_format = (
            image.format or ""
        ).upper()

        mode = (
            image.mode or ""
        ).upper()

        metadata = (
            metadata
            if isinstance(
                metadata,
                dict
            )
            else {}
        )

        # ====================================================
        # METADATA
        # ====================================================

        exif = metadata.get(
            "exif",
            {}
        )

        if not isinstance(
            exif,
            dict
        ):

            exif = {}

        software = str(
            exif.get(
                "Software",
                ""
            )
        ).lower()

        camera_make = str(
            metadata.get(
                "camera",
                {}
            ).get(
                "make",
                ""
            )
        ).strip()

        camera_model = str(
            metadata.get(
                "camera",
                {}
            ).get(
                "model",
                ""
            )
        ).strip()

        has_exif = bool(
            metadata.get(
                "has_exif",
                False
            )
        )

        # ====================================================
        # SCORES
        # ====================================================

        screenshot_score = 0.0

        recapture_score = 0.0

        screenshot_reasons = []

        recapture_reasons = []

        # ====================================================
        # 1. SCREENSHOT SOFTWARE
        # ====================================================

        if any(
            item in software
            for item in SCREENSHOT_SOFTWARE
        ):

            screenshot_score += 45

            screenshot_reasons.append(
                "Screenshot-related software appears in metadata."
            )

        # ====================================================
        # 2. COMMON DISPLAY RESOLUTION
        # ====================================================

        if (
            width,
            height
        ) in COMMON_SCREEN_SIZES:

            screenshot_score += 18

            screenshot_reasons.append(
                "Image dimensions match a common display resolution."
            )

        # ====================================================
        # 3. DISPLAY ASPECT RATIO
        # ====================================================

        if _screen_aspect_ratio(
            width,
            height
        ):

            screenshot_score += 5

            screenshot_reasons.append(
                "Image has a common display-style aspect ratio."
            )

        # ====================================================
        # 4. PNG
        # ====================================================

        if image_format == "PNG":

            screenshot_score += 8

            screenshot_reasons.append(
                "PNG format is commonly used for screenshots."
            )

        # ====================================================
        # 5. ALPHA / RGBA
        # ====================================================

        if mode in {
            "RGBA",
            "LA",
            "PA"
        }:

            screenshot_score += 5

            screenshot_reasons.append(
                "Image contains an alpha-capable channel."
            )

        # ====================================================
        # 6. VISUAL STATISTICS
        # ====================================================

        statistics = _image_statistics(
            image
        )

        flat_ratio = _safe_float(
            statistics.get(
                "flat_ratio"
            )
        )

        edge_density = _safe_float(
            statistics.get(
                "edge_density"
            )
        )

        color_diversity = _safe_float(
            statistics.get(
                "color_diversity"
            )
        )

        gradient_strength = _safe_float(
            statistics.get(
                "gradient_strength"
            )
        )

        # ----------------------------------------------------
        # FLAT AREAS
        # ----------------------------------------------------

        if flat_ratio >= 0.72:

            screenshot_score += 12

            screenshot_reasons.append(
                "Large areas contain near-uniform pixels."
            )

        elif flat_ratio >= 0.58:

            screenshot_score += 6

            screenshot_reasons.append(
                "Image contains substantial flat-color regions."
            )

        # ----------------------------------------------------
        # EDGE STRUCTURE
        # ----------------------------------------------------

        if (
            edge_density >= 0.03
            and
            edge_density <= 0.35
        ):

            screenshot_score += 5

            screenshot_reasons.append(
                "Image contains structured screen-like edges."
            )

        # ----------------------------------------------------
        # LOW COLOR DIVERSITY
        # ----------------------------------------------------

        if color_diversity < 0.35:

            screenshot_score += 4

            screenshot_reasons.append(
                "Color distribution is compatible with UI/screen content."
            )

        # ====================================================
        # 7. CAMERA EVIDENCE
        # ====================================================

        if camera_make or camera_model:

            # Strong counter-signal against screenshot.
            screenshot_score -= 35

        elif has_exif:

            # EXIF exists but camera identity is unavailable.
            screenshot_score -= 5

        # ====================================================
        # 8. PHOTOGRAPH-LIKE SIGNAL
        # ====================================================

        # High natural gradient complexity tends to be
        # more compatible with photographs.

        if gradient_strength > 18:

            screenshot_score -= 8

        # ====================================================
        # 9. RECAPTURE SIGNALS
        # ====================================================

        # A display photographed by a camera is different
        # from a native screenshot.
        #
        # We only produce a recapture hypothesis when
        # there are supporting signals.

        if camera_make or camera_model:

            recapture_score += 20

            recapture_reasons.append(
                "Camera metadata is present."
            )

        if image_format == "JPEG":

            recapture_score += 10

            recapture_reasons.append(
                "JPEG compression is compatible with camera capture."
            )

        if (
            not has_exif
            and
            image_format == "JPEG"
        ):

            recapture_score += 5

            recapture_reasons.append(
                "JPEG image has no camera EXIF metadata."
            )

        # A possible recapture usually has photographic
        # texture rather than native-screen characteristics.

        if gradient_strength > 20:

            recapture_score += 10

            recapture_reasons.append(
                "Image contains continuous photographic-style gradients."
            )

        # ====================================================
        # CLAMP SCORES
        # ====================================================

        screenshot_score = max(
            0,
            min(
                100,
                screenshot_score
            )
        )

        recapture_score = max(
            0,
            min(
                100,
                recapture_score
            )
        )

        # ====================================================
        # SCREENSHOT VERDICT
        # ====================================================

        if screenshot_score >= 65:

            likely_screenshot = True

        else:

            likely_screenshot = False

        # ====================================================
        # RECAPTURE VERDICT
        # ====================================================

        # Recapture requires stronger evidence and cannot
        # simply be triggered by screen dimensions.

        likely_recapture = (
            recapture_score >= 65
            and
            not likely_screenshot
        )

        # ====================================================
        # CONFIDENCE
        # ====================================================

        if likely_screenshot:

            confidence = screenshot_score

        elif likely_recapture:

            confidence = recapture_score

        else:

            # Neutral / uncertain state.
            confidence = max(
                15,
                min(
                    55,
                    max(
                        screenshot_score,
                        recapture_score
                    )
                )
            )

        # ====================================================
        # INDICATORS
        # ====================================================

        indicators = []

        if likely_screenshot:

            indicators.extend(
                screenshot_reasons
            )

        elif likely_recapture:

            indicators.extend(
                recapture_reasons
            )

        else:

            if screenshot_score >= 40:

                indicators.append(
                    "Some screenshot-like characteristics were detected, "
                    "but evidence is insufficient for a screenshot classification."
                )

            if recapture_score >= 40:

                indicators.append(
                    "Some photographic/recapture characteristics were detected, "
                    "but evidence is insufficient for a recapture classification."
                )

        # Remove duplicates while preserving order.

        indicators = list(
            dict.fromkeys(
                indicators
            )
        )

        # ====================================================
        # RESULT
        # ====================================================

        result["available"] = True

        result["likely_screenshot"] = (
            likely_screenshot
        )

        result["likely_recapture"] = (
            likely_recapture
        )

        result["confidence"] = round(
            confidence,
            2
        )

        result["screenshot_confidence"] = round(
            screenshot_score,
            2
        )

        result["recapture_confidence"] = round(
            recapture_score,
            2
        )

        result["screenshot_score"] = round(
            screenshot_score,
            2
        )

        result["recapture_score"] = round(
            recapture_score,
            2
        )

        result["indicators"] = indicators

        result["signals"] = {

            "width": width,

            "height": height,

            "format": image_format,

            "mode": mode,

            "common_screen_resolution": (
                width,
                height
            ) in COMMON_SCREEN_SIZES,

            "screen_aspect_ratio": (
                _screen_aspect_ratio(
                    width,
                    height
                )
            ),

            "flat_ratio": round(
                flat_ratio,
                4
            ),

            "edge_density": round(
                edge_density,
                4
            ),

            "color_diversity": round(
                color_diversity,
                4
            ),

            "gradient_strength": round(
                gradient_strength,
                4
            ),

            "has_exif": has_exif,

            "camera_make": (
                camera_make or None
            ),

            "camera_model": (
                camera_model or None
            ),

            "software": (
                software or None
            )
        }

        return result

    except Exception as error:

        result["error"] = str(
            error
        )

        return result