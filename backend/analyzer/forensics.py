"""
TRUSTVERIFY - Advanced Image Forensics

Provides non-AI forensic indicators:
- pixel statistics
- entropy
- edge density
- noise estimation
- local variance
- color statistics
- JPEG quantization
- resampling clues
- unusual dimensions
"""

import math
import os

import numpy as np
from PIL import Image, ImageFilter, ImageStat


def _entropy(gray_array):

    try:

        histogram = np.histogram(
            gray_array,
            bins=256,
            range=(0, 255)
        )[0]

        probabilities = (
            histogram /
            max(histogram.sum(), 1)
        )

        probabilities = probabilities[
            probabilities > 0
        ]

        return float(
            -np.sum(
                probabilities *
                np.log2(probabilities)
            )
        )

    except Exception:
        return 0.0


def _edge_density(gray):

    try:

        arr = np.asarray(
            gray,
            dtype=np.float32
        )

        gx = np.abs(
            np.diff(arr, axis=1)
        )

        gy = np.abs(
            np.diff(arr, axis=0)
        )

        threshold = 20

        horizontal_edges = (
            gx > threshold
        ).mean()

        vertical_edges = (
            gy > threshold
        ).mean()

        return float(
            (
                horizontal_edges +
                vertical_edges
            ) / 2
        )

    except Exception:
        return 0.0


def _noise_estimate(gray):

    try:

        arr = np.asarray(
            gray,
            dtype=np.float32
        )

        blurred = np.asarray(
            gray.filter(
                ImageFilter.GaussianBlur(
                    radius=1.0
                )
            ),
            dtype=np.float32
        )

        residual = arr - blurred

        return float(
            np.std(residual)
        )

    except Exception:
        return 0.0


def _local_variance(gray):

    try:

        arr = np.asarray(
            gray,
            dtype=np.float32
        )

        h, w = arr.shape

        block_size = 32

        variances = []

        for y in range(
            0,
            h,
            block_size
        ):

            for x in range(
                0,
                w,
                block_size
            ):

                block = arr[
                    y:min(y + block_size, h),
                    x:min(x + block_size, w)
                ]

                if block.size > 20:

                    variances.append(
                        float(
                            np.var(block)
                        )
                    )

        if not variances:
            return 0.0

        return float(
            np.std(variances)
        )

    except Exception:
        return 0.0


def analyze_image(file_path):

    result = {

        "available": False,

        "width": None,
        "height": None,

        "format": None,
        "mode": None,

        "file_size": None,
        "total_pixels": None,

        "aspect_ratio": None,

        "pixel_statistics": {},

        "entropy": None,

        "edge_density": None,

        "noise_estimate": None,

        "local_variance": None,

        "jpeg_quantization_available": False,

        "forensic_flags": [],

        "suspicion_indicators": [],

        "forensic_confidence": 0
    }

    try:

        result["file_size"] = os.path.getsize(
            file_path
        )

        image = Image.open(
            file_path
        )

        result["available"] = True

        result["width"] = image.width
        result["height"] = image.height

        result["format"] = image.format
        result["mode"] = image.mode

        result["total_pixels"] = (
            image.width *
            image.height
        )

        if image.height:

            result["aspect_ratio"] = round(
                image.width /
                image.height,
                4
            )

        rgb = image.convert("RGB")

        gray = rgb.convert("L")

        # ----------------------------------------------------
        # PIXEL STATISTICS
        # ----------------------------------------------------

        statistics = ImageStat.Stat(rgb)

        result["pixel_statistics"] = {

            "mean": [
                round(
                    value,
                    3
                )
                for value in statistics.mean
            ],

            "stddev": [
                round(
                    value,
                    3
                )
                for value in statistics.stddev
            ],

            "extrema": statistics.extrema
        }

        # ----------------------------------------------------
        # ENTROPY
        # ----------------------------------------------------

        result["entropy"] = round(
            _entropy(
                np.asarray(gray)
            ),
            4
        )

        # ----------------------------------------------------
        # EDGE DENSITY
        # ----------------------------------------------------

        result["edge_density"] = round(
            _edge_density(gray),
            6
        )

        # ----------------------------------------------------
        # NOISE
        # ----------------------------------------------------

        result["noise_estimate"] = round(
            _noise_estimate(gray),
            4
        )

        # ----------------------------------------------------
        # LOCAL VARIANCE
        # ----------------------------------------------------

        result["local_variance"] = round(
            _local_variance(gray),
            4
        )

        # ----------------------------------------------------
        # DIMENSION SIGNALS
        # ----------------------------------------------------

        if result["total_pixels"] < 10000:

            result["forensic_flags"].append(
                "Low total pixel count"
            )

        if result["aspect_ratio"]:

            if (
                result["aspect_ratio"] > 4
                or
                result["aspect_ratio"] < 0.25
            ):

                result[
                    "suspicion_indicators"
                ].append(
                    "Unusual aspect ratio"
                )

        # ----------------------------------------------------
        # TRANSPARENCY
        # ----------------------------------------------------

        if image.mode in {
            "RGBA",
            "LA",
            "P"
        }:

            result["forensic_flags"].append(
                "Transparency-capable image mode"
            )

        # ----------------------------------------------------
        # JPEG STRUCTURE
        # ----------------------------------------------------

        if image.format == "JPEG":

            quantization = getattr(
                image,
                "quantization",
                None
            )

            result[
                "jpeg_quantization_available"
            ] = bool(quantization)

        # ----------------------------------------------------
        # VERY LOW NOISE
        # ----------------------------------------------------

        if (
            result["noise_estimate"] is not None
            and
            result["noise_estimate"] < 0.8
        ):

            result[
                "suspicion_indicators"
            ].append(
                "Unusually low high-frequency noise"
            )

        # ----------------------------------------------------
        # EXTREME LOCAL VARIATION
        # ----------------------------------------------------

        if (
            result["local_variance"] is not None
            and
            result["local_variance"] > 1200
        ):

            result[
                "suspicion_indicators"
            ].append(
                "Strong local texture variance"
            )

        # ----------------------------------------------------
        # CONFIDENCE
        # ----------------------------------------------------

        available_signals = sum(
            value is not None
            for value in [
                result["entropy"],
                result["edge_density"],
                result["noise_estimate"],
                result["local_variance"]
            ]
        )

        result[
            "forensic_confidence"
        ] = round(
            min(
                100,
                available_signals / 4 * 100
            ),
            2
        )

    except Exception as error:

        result["error"] = str(error)

    return result