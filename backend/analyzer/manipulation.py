"""
============================================================
TRUSTVERIFY - MANIPULATION ANALYSIS
============================================================

Purpose:
    Detect statistical inconsistencies that may support
    an image-manipulation hypothesis.

IMPORTANT:
    This module provides forensic indicators only.

    It does NOT prove that an image was manipulated.

Design:
    1. Detect screenshot-like context first.
    2. Divide image into blocks.
    3. Extract multiple local features.
    4. Compare each block with neighboring blocks.
    5. Look for isolated inconsistencies rather than
       naturally varied image regions.
    6. Suppress screenshot false positives.
    7. Return conservative manipulation evidence.

This module is intentionally heuristic and should be
validated against a representative benchmark dataset.

============================================================
"""

import os
from typing import Any, Dict, List, Tuple

import numpy as np
from PIL import Image


# ============================================================
# CONFIGURATION
# ============================================================

BLOCK_SIZE = 64
MIN_BLOCK_SIZE = 20

MAX_REGIONS = 20

# Minimum number of valid blocks required for meaningful
# spatial comparison.
MIN_BLOCK_COUNT = 9

# Robust outlier thresholds.
ROBUST_Z_THRESHOLD = 3.5

# Local disagreement threshold.
LOCAL_DISAGREEMENT_THRESHOLD = 0.45

# Maximum manipulation score.
MAX_MANIPULATION_SCORE = 70

# Screenshot thresholds.
SCREENSHOT_EDGE_RATIO = 0.075
SCREENSHOT_FLAT_RATIO = 0.18

# Avoid treating extremely small images as reliable.
MIN_IMAGE_WIDTH = 96
MIN_IMAGE_HEIGHT = 96


# ============================================================
# SAFE FLOAT
# ============================================================

def _safe_float(
    value: Any,
    default: float = 0.0
) -> float:

    try:

        number = float(value)

        if not np.isfinite(number):
            return default

        return number

    except (
        TypeError,
        ValueError
    ):

        return default


# ============================================================
# IMAGE FORMAT
# ============================================================

def _get_image_format(
    file_path: str
) -> str:

    try:

        with Image.open(file_path) as image:

            return str(
                image.format or ""
            ).upper()

    except Exception:

        return ""


# ============================================================
# EDGE RATIO
# ============================================================

def _calculate_edge_ratio(
    gray: np.ndarray
) -> float:

    if gray.size == 0:
        return 0.0

    if gray.shape[0] < 2:
        return 0.0

    if gray.shape[1] < 2:
        return 0.0

    horizontal = np.abs(
        np.diff(
            gray,
            axis=1
        )
    )

    vertical = np.abs(
        np.diff(
            gray,
            axis=0
        )
    )

    edge_pixels = 0

    if horizontal.size:

        edge_pixels += int(
            np.sum(
                horizontal > 35
            )
        )

    if vertical.size:

        edge_pixels += int(
            np.sum(
                vertical > 35
            )
        )

    total = gray.size * 2

    if total <= 0:
        return 0.0

    return float(
        min(
            1.0,
            edge_pixels / total
        )
    )


# ============================================================
# FLAT RATIO
# ============================================================

def _calculate_flat_ratio(
    gray: np.ndarray
) -> float:

    if gray.size == 0:
        return 0.0

    if (
        gray.shape[0] < 2 or
        gray.shape[1] < 2
    ):
        return 0.0

    horizontal = np.abs(
        np.diff(
            gray,
            axis=1
        )
    )

    vertical = np.abs(
        np.diff(
            gray,
            axis=0
        )
    )

    flat_horizontal = (
        horizontal < 4
    )

    flat_vertical = (
        vertical < 4
    )

    horizontal_ratio = (
        float(
            np.mean(
                flat_horizontal
            )
        )
        if flat_horizontal.size
        else 0.0
    )

    vertical_ratio = (
        float(
            np.mean(
                flat_vertical
            )
        )
        if flat_vertical.size
        else 0.0
    )

    return (
        horizontal_ratio +
        vertical_ratio
    ) / 2


# ============================================================
# SCREENSHOT DETECTION
# ============================================================

def _detect_screenshot(
    image: Image.Image,
    gray: np.ndarray
) -> Dict[str, Any]:

    result = {

        "is_screenshot": False,

        "confidence": 0.0,

        "reasons": []
    }

    try:

        image_format = str(
            image.format or ""
        ).upper()

        edge_ratio = (
            _calculate_edge_ratio(
                gray
            )
        )

        flat_ratio = (
            _calculate_flat_ratio(
                gray
            )
        )

        score = 0.0

        # ----------------------------------------------------
        # PNG
        # ----------------------------------------------------

        if image_format == "PNG":

            score += 20

            result["reasons"].append(
                "PNG image format"
            )

        # ----------------------------------------------------
        # UI / TEXT EDGES
        # ----------------------------------------------------

        if (
            edge_ratio >=
            SCREENSHOT_EDGE_RATIO
        ):

            score += 40

            result["reasons"].append(
                "High concentration of sharp text/UI edges"
            )

        # ----------------------------------------------------
        # FLAT AREAS
        # ----------------------------------------------------

        if (
            flat_ratio >=
            SCREENSHOT_FLAT_RATIO
        ):

            score += 25

            result["reasons"].append(
                "Large areas with near-uniform pixels"
            )

        # ----------------------------------------------------
        # SCREEN-LIKE ASPECT RATIO
        # ----------------------------------------------------

        width, height = image.size

        if width > 0 and height > 0:

            ratio = (
                max(width, height)
                /
                min(width, height)
            )

            common_ratio = (
                abs(
                    ratio - (16 / 9)
                ) < 0.08

                or

                abs(
                    ratio - (16 / 10)
                ) < 0.08

                or

                abs(
                    ratio - (4 / 3)
                ) < 0.08

                or

                abs(
                    ratio - (3 / 2)
                ) < 0.08
            )

            if common_ratio:

                score += 15

                result["reasons"].append(
                    "Screen-like aspect ratio"
                )

        score = min(
            100.0,
            score
        )

        # Need multiple signals.
        if score >= 55:

            result["is_screenshot"] = True

        result["confidence"] = round(
            score,
            2
        )

    except Exception:
        pass

    return result


# ============================================================
# LOCAL FEATURE EXTRACTION
# ============================================================

def _calculate_features(
    block: np.ndarray
) -> Dict[str, float]:

    if block.size == 0:

        return {
            "mean": 0.0,
            "variance": 0.0,
            "std": 0.0,
            "edge_ratio": 0.0,
            "hf_energy": 0.0,
        }

    mean = float(
        np.mean(block)
    )

    variance = float(
        np.var(block)
    )

    std = float(
        np.std(block)
    )

    edge_ratio = (
        _calculate_edge_ratio(
            block
        )
    )

    # --------------------------------------------------------
    # High-frequency energy.
    #
    # Large local second differences indicate strong
    # high-frequency content.
    # --------------------------------------------------------

    if (
        block.shape[0] >= 3 and
        block.shape[1] >= 3
    ):

        center = block[1:-1, 1:-1]

        laplacian = (
            block[:-2, 1:-1]
            +
            block[2:, 1:-1]
            +
            block[1:-1, :-2]
            +
            block[1:-1, 2:]
            -
            4 * center
        )

        hf_energy = float(
            np.mean(
                np.abs(
                    laplacian
                )
            )
        )

    else:

        hf_energy = 0.0

    return {

        "mean": mean,

        "variance": variance,

        "std": std,

        "edge_ratio":
            edge_ratio,

        "hf_energy":
            hf_energy,
    }


# ============================================================
# BUILD BLOCKS
# ============================================================

def _build_blocks(
    gray: np.ndarray
) -> List[Dict[str, Any]]:

    height, width = gray.shape[:2]

    blocks = []

    for y in range(
        0,
        height,
        BLOCK_SIZE
    ):

        for x in range(
            0,
            width,
            BLOCK_SIZE
        ):

            block = gray[
                y:min(
                    y + BLOCK_SIZE,
                    height
                ),
                x:min(
                    x + BLOCK_SIZE,
                    width
                )
            ]

            if (
                block.shape[0]
                < MIN_BLOCK_SIZE
            ):
                continue

            if (
                block.shape[1]
                < MIN_BLOCK_SIZE
            ):
                continue

            features = _calculate_features(
                block
            )

            blocks.append({

                "x": x,

                "y": y,

                "width": block.shape[1],

                "height": block.shape[0],

                "row":
                    y // BLOCK_SIZE,

                "col":
                    x // BLOCK_SIZE,

                **features
            })

    return blocks


# ============================================================
# MEDIAN ABSOLUTE DEVIATION
# ============================================================

def _robust_z_scores(
    values: np.ndarray
) -> np.ndarray:

    if values.size == 0:

        return np.array(
            [],
            dtype=np.float32
        )

    median = float(
        np.median(values)
    )

    deviations = np.abs(
        values - median
    )

    mad = float(
        np.median(
            deviations
        )
    )

    # Avoid division by zero.
    if mad < 1e-8:

        std = float(
            np.std(values)
        )

        if std < 1e-8:

            return np.zeros_like(
                values,
                dtype=np.float32
            )

        return (
            (values - median)
            / std
        )

    return (
        0.6745 *
        (values - median)
        / mad
    )


# ============================================================
# BLOCK INDEX
# ============================================================

def _build_block_index(
    blocks: List[Dict[str, Any]]
) -> Dict[Tuple[int, int], Dict[str, Any]]:

    index = {}

    for block in blocks:

        index[
            (
                block["row"],
                block["col"]
            )
        ] = block

    return index


# ============================================================
# NEIGHBOR FEATURES
# ============================================================

def _neighbor_blocks(
    block: Dict[str, Any],
    index: Dict[
        Tuple[int, int],
        Dict[str, Any]
    ]
) -> List[Dict[str, Any]]:

    row = block["row"]
    col = block["col"]

    neighbors = []

    positions = [
        (row - 1, col),
        (row + 1, col),
        (row, col - 1),
        (row, col + 1),
    ]

    for position in positions:

        neighbor = index.get(
            position
        )

        if neighbor is not None:

            neighbors.append(
                neighbor
            )

    return neighbors


# ============================================================
# LOCAL DISAGREEMENT
# ============================================================

def _local_disagreement(
    block: Dict[str, Any],
    neighbors: List[
        Dict[str, Any]
    ]
) -> float:

    if not neighbors:

        return 0.0

    feature_names = [
        "mean",
        "std",
        "edge_ratio",
        "hf_energy",
    ]

    disagreements = []

    for feature in feature_names:

        current = _safe_float(
            block.get(
                feature
            )
        )

        values = np.array(
            [
                _safe_float(
                    neighbor.get(
                        feature
                    )
                )
                for neighbor in neighbors
            ],
            dtype=np.float32
        )

        if values.size == 0:
            continue

        median = float(
            np.median(values)
        )

        spread = float(
            np.median(
                np.abs(
                    values - median
                )
            )
        )

        denominator = max(
            abs(median) * 0.20,
            spread,
            1.0
        )

        difference = abs(
            current - median
        ) / denominator

        # Convert to roughly 0..1.
        normalized = min(
            1.0,
            difference / 5.0
        )

        disagreements.append(
            normalized
        )

    if not disagreements:

        return 0.0

    return float(
        np.mean(
            disagreements
        )
    )


# ============================================================
# FIND SUSPICIOUS REGIONS
# ============================================================

def _find_suspicious_regions(
    blocks: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:

    if len(blocks) < MIN_BLOCK_COUNT:

        return []

    index = _build_block_index(
        blocks
    )

    # --------------------------------------------------------
    # Global robust scores.
    # --------------------------------------------------------

    variance_z = _robust_z_scores(
        np.array(
            [
                block["variance"]
                for block in blocks
            ],
            dtype=np.float32
        )
    )

    std_z = _robust_z_scores(
        np.array(
            [
                block["std"]
                for block in blocks
            ],
            dtype=np.float32
        )
    )

    edge_z = _robust_z_scores(
        np.array(
            [
                block["edge_ratio"]
                for block in blocks
            ],
            dtype=np.float32
        )
    )

    hf_z = _robust_z_scores(
        np.array(
            [
                block["hf_energy"]
                for block in blocks
            ],
            dtype=np.float32
        )
    )

    suspicious = []

    for index_position, block in enumerate(
        blocks
    ):

        global_outlier_strength = max(
            abs(
                float(
                    variance_z[
                        index_position
                    ]
                )
            ),

            abs(
                float(
                    std_z[
                        index_position
                    ]
                )
            ),

            abs(
                float(
                    edge_z[
                        index_position
                    ]
                )
            ),

            abs(
                float(
                    hf_z[
                        index_position
                    ]
                )
            )
        )

        neighbors = _neighbor_blocks(
            block,
            index
        )

        local_disagreement = (
            _local_disagreement(
                block,
                neighbors
            )
        )

        # ----------------------------------------------------
        # We want BOTH:
        #
        # 1. unusual local feature
        # 2. disagreement with neighboring region
        #
        # This is more conservative than looking only at
        # global variance.
        # ----------------------------------------------------

        if (
            global_outlier_strength
            < ROBUST_Z_THRESHOLD
        ):
            continue

        if (
            local_disagreement
            < LOCAL_DISAGREEMENT_THRESHOLD
        ):
            continue

        strength = min(
            100.0,
            (
                global_outlier_strength
                /
                6.0
            ) * 60.0
            +
            local_disagreement * 40.0
        )

        suspicious.append({

            "x": block["x"],

            "y": block["y"],

            "width": block["width"],

            "height": block["height"],

            "reason": (
                "Isolated local feature "
                "inconsistency"
            ),

            "outlier_strength":
                round(
                    global_outlier_strength,
                    2
                ),

            "neighbor_disagreement":
                round(
                    local_disagreement,
                    2
                ),

            "variance":
                round(
                    block["variance"],
                    2
                ),

            "edge_ratio":
                round(
                    block["edge_ratio"],
                    4
                ),

            "high_frequency":
                round(
                    block["hf_energy"],
                    2
                ),

            "strength":
                round(
                    strength,
                    2
                )
        })

    suspicious.sort(
        key=lambda item:
            item["strength"],
        reverse=True
    )

    return suspicious[
        :MAX_REGIONS
    ]


# ============================================================
# SCORE SUSPICIOUS REGIONS
# ============================================================

def _calculate_score(
    suspicious: List[
        Dict[str, Any]
    ]
) -> float:

    if not suspicious:

        return 0.0

    # --------------------------------------------------------
    # Do not increase the score linearly too aggressively.
    # Several related suspicious blocks may belong to the
    # same normal region.
    # --------------------------------------------------------

    strong = sum(
        1
        for item in suspicious
        if item["strength"] >= 70
    )

    moderate = sum(
        1
        for item in suspicious
        if item["strength"] >= 45
    )

    score = (
        strong * 8
        +
        max(
            0,
            moderate - strong
        ) * 4
    )

    return min(
        MAX_MANIPULATION_SCORE,
        float(score)
    )


# ============================================================
# MAIN ANALYSIS
# ============================================================

def analyze_manipulation(
    file_path: str
) -> Dict[str, Any]:

    result = {

        "available": False,

        "score": 0,

        "risk_level": "unknown",

        "indicators": [],

        "regions": [],

        "confidence": 0,

        "is_screenshot": False,

        "screenshot_confidence": 0,

        "screenshot_reasons": [],

        "method": (
            "Conservative multi-feature local "
            "consistency analysis"
        ),

        "feature_model": [
            "local mean",
            "local variance",
            "local standard deviation",
            "edge density",
            "high-frequency energy",
            "neighbor consistency",
        ]
    }

    # ========================================================
    # FILE VALIDATION
    # ========================================================

    if not file_path:

        result["error"] = (
            "No image path was provided."
        )

        return result

    if not os.path.exists(
        file_path
    ):

        result["error"] = (
            "Image file does not exist."
        )

        return result

    # ========================================================
    # OPEN IMAGE
    # ========================================================

    try:

        image = Image.open(
            file_path
        )

        image.load()

    except Exception as error:

        result["error"] = str(
            error
        )

        return result

    # ========================================================
    # IMAGE SIZE VALIDATION
    # ========================================================

    width, height = image.size

    if (
        width < MIN_IMAGE_WIDTH
        or
        height < MIN_IMAGE_HEIGHT
    ):

        result["available"] = True

        result["indicators"].append(
            "Image is too small for reliable local manipulation analysis."
        )

        result["confidence"] = 20

        return result

    # ========================================================
    # GRAYSCALE
    # ========================================================

    try:

        rgb = image.convert(
            "RGB"
        )

        gray = np.asarray(
            rgb.convert("L"),
            dtype=np.float32
        )

    except Exception as error:

        result["error"] = str(
            error
        )

        return result

    # ========================================================
    # SCREENSHOT ANALYSIS
    # ========================================================

    screenshot = _detect_screenshot(
        image,
        gray
    )

    result[
        "is_screenshot"
    ] = screenshot[
        "is_screenshot"
    ]

    result[
        "screenshot_confidence"
    ] = screenshot[
        "confidence"
    ]

    result[
        "screenshot_reasons"
    ] = screenshot[
        "reasons"
    ]

    # ========================================================
    # BLOCKS
    # ========================================================

    blocks = _build_blocks(
        gray
    )

    if len(blocks) < MIN_BLOCK_COUNT:

        result["available"] = True

        result["indicators"].append(
            "Not enough image regions for robust local comparison."
        )

        result["confidence"] = 25

        return result

    # ========================================================
    # SCREENSHOT SAFETY
    # ========================================================

    if result[
        "is_screenshot"
    ]:

        result["available"] = True

        result["score"] = 0

        result["risk_level"] = "low"

        result["regions"] = []

        result["confidence"] = round(
            result[
                "screenshot_confidence"
            ],
            2
        )

        result["indicators"].append(
            "Image appears consistent with screenshot-like content."
        )

        result["indicators"].append(
            "Local anomalies were suppressed because screenshots "
            "naturally contain text, borders, cards, icons, "
            "gradients and flat UI regions."
        )

        return result

    # ========================================================
    # FIND LOCAL INCONSISTENCIES
    # ========================================================

    suspicious = (
        _find_suspicious_regions(
            blocks
        )
    )

    # ========================================================
    # SCORE
    # ========================================================

    manipulation_score = (
        _calculate_score(
            suspicious
        )
    )

    # ========================================================
    # RISK LEVEL
    # ========================================================

    if manipulation_score >= 50:

        risk_level = "high"

    elif manipulation_score >= 20:

        risk_level = "medium"

    else:

        risk_level = "low"

    # ========================================================
    # INDICATORS
    # ========================================================

    if suspicious:

        result["indicators"].append(
            "Localized statistical inconsistencies "
            "were detected."
        )

        result["indicators"].append(
            "Suspicious regions differ from their "
            "immediate neighboring regions."
        )

    else:

        result["indicators"].append(
            "No strong localized manipulation "
            "inconsistencies were detected."
        )

    # ========================================================
    # CONFIDENCE
    # ========================================================

    # Confidence measures the amount of usable evidence,
    # NOT certainty that manipulation occurred.

    analyzed_blocks = len(
        blocks
    )

    base_confidence = min(
        65,
        25 +
        analyzed_blocks * 0.5
    )

    evidence_bonus = min(
        20,
        len(suspicious) * 3
    )

    confidence = min(
        90,
        base_confidence +
        evidence_bonus
    )

    # ========================================================
    # FINAL RESULT
    # ========================================================

    result["available"] = True

    result["score"] = round(
        manipulation_score,
        2
    )

    result["risk_level"] = (
        risk_level
    )

    result["regions"] = (
        suspicious
    )

    result["confidence"] = round(
        confidence,
        2
    )

    result["blocks_analyzed"] = (
        analyzed_blocks
    )

    result["image_format"] = (
        _get_image_format(
            file_path
        )
    )

    result["image_size"] = {
        "width": width,
        "height": height,
    }

    return result


# ============================================================
# ALIAS
# ============================================================

analyze_image_manipulation = (
    analyze_manipulation
)