"""
============================================================
TRUSTVERIFY - IMAGE FINGERPRINTING ENGINE
============================================================

Purpose
-------
Creates multiple fingerprints for an image so TRUSTVERIFY
can identify:

    1. Exact file matches
    2. Visually similar copies
    3. Re-encoded / resized versions
    4. Evidence useful for future web tracing

Fingerprints
------------
SHA-256
    Exact binary-file identity.

MD5
    Compatibility fingerprint only.
    NOT used as a security decision.

Perceptual Hash
    Visual similarity after resizing/compression.

Average Hash
    Additional lightweight visual fingerprint.

Difference Hash
    Captures horizontal image structure.

Image Identity
    Width, height, format and file size.

IMPORTANT
---------
A fingerprint does NOT automatically tell us where an image
was published on the Internet.

To locate online copies, TRUSTVERIFY needs a separate
web-search / reverse-image-search integration.

============================================================
"""

import hashlib
import os
from typing import Any, Dict, Optional

import numpy as np
from PIL import Image


# ============================================================
# SAFE IMAGE OPEN
# ============================================================

def _open_image(file_path: str) -> Image.Image:

    image = Image.open(file_path)

    # Force decoding now so corrupted/truncated images fail
    # inside this function instead of later.
    image.load()

    return image


# ============================================================
# SHA-256
# ============================================================

def calculate_sha256(file_path: str) -> str:

    """
    Calculate SHA-256 of the exact uploaded file.

    Same bytes -> same SHA-256.

    Any modification to the file normally produces a
    different hash.
    """

    sha256 = hashlib.sha256()

    with open(
        file_path,
        "rb"
    ) as file:

        for chunk in iter(
            lambda: file.read(1024 * 1024),
            b""
        ):

            sha256.update(chunk)

    return sha256.hexdigest()


# ============================================================
# MD5
# ============================================================

def calculate_md5(file_path: str) -> str:

    """
    Compatibility fingerprint.

    MD5 is intentionally NOT used for security decisions.
    """

    md5 = hashlib.md5(
        usedforsecurity=False
    )

    with open(
        file_path,
        "rb"
    ) as file:

        for chunk in iter(
            lambda: file.read(1024 * 1024),
            b""
        ):

            md5.update(chunk)

    return md5.hexdigest()


# ============================================================
# DCT MATRIX
# ============================================================

def _create_dct_matrix(
    size: int
) -> np.ndarray:

    x = np.arange(size)

    matrix = np.cos(
        np.pi / size *
        (
            x[:, None] + 0.5
        ) *
        x[None, :]
    )

    matrix[0, :] *= (
        1 / np.sqrt(2)
    )

    matrix *= np.sqrt(
        2 / size
    )

    return matrix


# ============================================================
# PERCEPTUAL HASH
# ============================================================

def calculate_phash(
    file_path: str
) -> str:

    """
    DCT-based perceptual hash.

    The image is reduced to 32x32 grayscale and the low
    frequency DCT coefficients are converted into bits.

    This is useful for detecting visually similar versions
    of the same image.
    """

    image = _open_image(
        file_path
    ).convert("L")

    image = image.resize(
        (32, 32),
        Image.Resampling.LANCZOS
    )

    pixels = np.asarray(
        image,
        dtype=np.float32
    )

    dct_matrix = _create_dct_matrix(
        32
    )

    dct = (
        dct_matrix
        @ pixels
        @ dct_matrix.T
    )

    # 8x8 low-frequency block
    low_frequency = dct[
        :8,
        :8
    ]

    # Exclude DC coefficient from threshold
    # calculation because it mainly represents
    # average brightness.
    coefficients = low_frequency.flatten()

    median = np.median(
        coefficients[1:]
    )

    bits = (
        coefficients >
        median
    )

    return "".join(
        "1" if bit else "0"
        for bit in bits
    )


# ============================================================
# AVERAGE HASH
# ============================================================

def calculate_ahash(
    file_path: str
) -> str:

    """
    Average hash.

    Very lightweight visual fingerprint.
    """

    image = _open_image(
        file_path
    ).convert("L")

    image = image.resize(
        (8, 8),
        Image.Resampling.LANCZOS
    )

    pixels = np.asarray(
        image,
        dtype=np.float32
    )

    average = np.mean(
        pixels
    )

    bits = (
        pixels >
        average
    )

    return "".join(
        "1" if bit else "0"
        for bit in bits.flatten()
    )


# ============================================================
# DIFFERENCE HASH
# ============================================================

def calculate_dhash(
    file_path: str
) -> str:

    """
    Difference hash.

    Compares neighboring pixels horizontally.
    """

    image = _open_image(
        file_path
    ).convert("L")

    image = image.resize(
        (9, 8),
        Image.Resampling.LANCZOS
    )

    pixels = np.asarray(
        image,
        dtype=np.float32
    )

    difference = (
        pixels[:, 1:]
        >
        pixels[:, :-1]
    )

    return "".join(
        "1" if bit else "0"
        for bit in difference.flatten()
    )


# ============================================================
# HASH HAMMING DISTANCE
# ============================================================

def hamming_distance(
    hash_a: str,
    hash_b: str
) -> Optional[int]:

    """
    Number of different bits between two perceptual hashes.
    """

    if not hash_a or not hash_b:
        return None

    if len(hash_a) != len(hash_b):
        return None

    return sum(
        bit_a != bit_b
        for bit_a, bit_b in zip(
            hash_a,
            hash_b
        )
    )


# ============================================================
# PHASH SIMILARITY
# ============================================================

def phash_similarity(
    hash_a: str,
    hash_b: str
) -> Optional[float]:

    """
    Converts pHash Hamming distance into a 0-100 similarity
    score.

    100 = identical perceptual hash
    0   = completely different hash
    """

    distance = hamming_distance(
        hash_a,
        hash_b
    )

    if distance is None:
        return None

    total_bits = len(
        hash_a
    )

    if total_bits == 0:
        return None

    similarity = (
        1 -
        (
            distance /
            total_bits
        )
    ) * 100

    return round(
        max(
            0,
            min(
                100,
                similarity
            )
        ),
        2
    )


# ============================================================
# IMAGE IDENTITY
# ============================================================

def extract_image_identity(
    file_path: str
) -> Dict[str, Any]:

    """
    Extract basic information required for fingerprint
    comparison.
    """

    result = {
        "file_size": None,
        "width": None,
        "height": None,
        "format": None,
        "mode": None,
        "aspect_ratio": None,
    }

    try:

        result["file_size"] = os.path.getsize(
            file_path
        )

        image = _open_image(
            file_path
        )

        result["width"] = image.width

        result["height"] = image.height

        result["format"] = image.format

        result["mode"] = image.mode

        if image.height:

            result["aspect_ratio"] = round(
                image.width /
                image.height,
                4
            )

    except Exception as error:

        result["error"] = str(
            error
        )

    return result


# ============================================================
# MAIN FINGERPRINT
# ============================================================

def fingerprint_image(
    file_path: str
) -> Dict[str, Any]:

    """
    Generate the complete TRUSTVERIFY fingerprint.
    """

    result = {

        "available": False,

        "algorithm_version":
            "TRUSTVERIFY-FP-2.0",

        "sha256": None,

        "md5": None,

        "perceptual_hash": None,

        "average_hash": None,

        "difference_hash": None,

        "hash_lengths": {},

        "identity": {},

        "web_trace_ready": False,

        "similarity_search_ready": False,

        "error": None,
    }

    # ========================================================
    # VALIDATE FILE
    # ========================================================

    if not file_path:

        result["error"] = (
            "No image path provided."
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
    # SHA-256
    # ========================================================

    try:

        result["sha256"] = calculate_sha256(
            file_path
        )

    except Exception as error:

        result["error"] = (
            f"SHA-256 calculation failed: {error}"
        )

        return result

    # ========================================================
    # MD5
    # ========================================================

    try:

        result["md5"] = calculate_md5(
            file_path
        )

    except Exception:

        # MD5 is optional.
        result["md5"] = None

    # ========================================================
    # PERCEPTUAL HASHES
    # ========================================================

    try:

        result["perceptual_hash"] = calculate_phash(
            file_path
        )

    except Exception as error:

        result["error"] = (
            f"pHash calculation failed: {error}"
        )

    try:

        result["average_hash"] = calculate_ahash(
            file_path
        )

    except Exception:

        result["average_hash"] = None

    try:

        result["difference_hash"] = calculate_dhash(
            file_path
        )

    except Exception:

        result["difference_hash"] = None

    # ========================================================
    # HASH LENGTHS
    # ========================================================

    for name in [
        "perceptual_hash",
        "average_hash",
        "difference_hash",
    ]:

        value = result.get(
            name
        )

        if value:

            result[
                "hash_lengths"
            ][name] = len(
                value
            )

    # ========================================================
    # IMAGE IDENTITY
    # ========================================================

    result["identity"] = extract_image_identity(
        file_path
    )

    # ========================================================
    # AVAILABILITY
    # ========================================================

    has_visual_hash = any(
        result.get(name)
        for name in [
            "perceptual_hash",
            "average_hash",
            "difference_hash",
        ]
    )

    result["available"] = bool(
        result["sha256"] and
        has_visual_hash
    )

    # ========================================================
    # FUTURE WEB TRACE
    # ========================================================

    result["web_trace_ready"] = bool(
        result["sha256"]
    )

    result[
        "similarity_search_ready"
    ] = bool(
        result["perceptual_hash"]
    )

    return result


# ============================================================
# COMPARE TWO FINGERPRINTS
# ============================================================

def compare_fingerprints(
    fingerprint_a: Dict[str, Any],
    fingerprint_b: Dict[str, Any]
) -> Dict[str, Any]:

    """
    Compare two TRUSTVERIFY fingerprints.

    This function does NOT claim that two images are the same
    person/object/source. It only measures file/visual
    fingerprint similarity.
    """

    result = {

        "exact_match": False,

        "perceptual_match": False,

        "phash_similarity": None,

        "phash_distance": None,

        "average_hash_distance": None,

        "difference_hash_distance": None,

        "confidence": 0,

        "verdict": "different",

    }

    # ========================================================
    # SHA-256
    # ========================================================

    sha_a = fingerprint_a.get(
        "sha256"
    )

    sha_b = fingerprint_b.get(
        "sha256"
    )

    if (
        sha_a
        and
        sha_b
        and
        sha_a == sha_b
    ):

        result["exact_match"] = True

        result["perceptual_match"] = True

        result["phash_similarity"] = 100

        result["confidence"] = 100

        result["verdict"] = (
            "exact-file-match"
        )

        return result

    # ========================================================
    # pHASH
    # ========================================================

    phash_a = fingerprint_a.get(
        "perceptual_hash"
    )

    phash_b = fingerprint_b.get(
        "perceptual_hash"
    )

    if phash_a and phash_b:

        distance = hamming_distance(
            phash_a,
            phash_b
        )

        similarity = phash_similarity(
            phash_a,
            phash_b
        )

        result[
            "phash_distance"
        ] = distance

        result[
            "phash_similarity"
        ] = similarity

        # Conservative threshold.
        #
        # This is a similarity indicator, NOT proof.
        if (
            similarity is not None
            and
            similarity >= 90
        ):

            result[
                "perceptual_match"
            ] = True

    # ========================================================
    # AVERAGE HASH
    # ========================================================

    ahash_a = fingerprint_a.get(
        "average_hash"
    )

    ahash_b = fingerprint_b.get(
        "average_hash"
    )

    if ahash_a and ahash_b:

        result[
            "average_hash_distance"
        ] = hamming_distance(
            ahash_a,
            ahash_b
        )

    # ========================================================
    # DIFFERENCE HASH
    # ========================================================

    dhash_a = fingerprint_a.get(
        "difference_hash"
    )

    dhash_b = fingerprint_b.get(
        "difference_hash"
    )

    if dhash_a and dhash_b:

        result[
            "difference_hash_distance"
        ] = hamming_distance(
            dhash_a,
            dhash_b
        )

    # ========================================================
    # FINAL INTERPRETATION
    # ========================================================

    if result[
        "perceptual_match"
    ]:

        similarity = (
            result[
                "phash_similarity"
            ]
            or 0
        )

        result[
            "confidence"
        ] = round(
            similarity,
            2
        )

        result[
            "verdict"
        ] = (
            "high-visual-similarity"
        )

    elif (
        result[
            "phash_similarity"
        ] is not None
        and
        result[
            "phash_similarity"
        ] >= 75
    ):

        result[
            "confidence"
        ] = round(
            result[
                "phash_similarity"
            ],
            2
        )

        result[
            "verdict"
        ] = (
            "possible-visual-similarity"
        )

    return result


# ============================================================
# ALIASES
# ============================================================

generate_fingerprint = fingerprint_image