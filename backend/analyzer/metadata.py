"""
TRUSTVERIFY - Metadata Intelligence Engine

Extracts:
- EXIF
- camera information
- software/editor information
- timestamps
- GPS
- dimensions
- metadata consistency indicators
"""

from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS


def _safe_value(value):
    """Convert EXIF values into JSON-safe strings."""

    try:
        if isinstance(value, bytes):
            return value.decode("utf-8", errors="replace")

        return str(value)

    except Exception:
        return "<unreadable>"


def _convert_gps(gps_info):
    """Convert EXIF GPS information into decimal coordinates."""

    if not gps_info:
        return None

    try:
        def dms_to_decimal(value, ref):
            degrees = float(value[0][0]) / float(value[0][1])
            minutes = float(value[1][0]) / float(value[1][1])
            seconds = float(value[2][0]) / float(value[2][1])

            decimal = degrees + minutes / 60 + seconds / 3600

            if ref in ("S", "W"):
                decimal *= -1

            return decimal

        latitude = gps_info.get("GPSLatitude")
        latitude_ref = gps_info.get("GPSLatitudeRef")

        longitude = gps_info.get("GPSLongitude")
        longitude_ref = gps_info.get("GPSLongitudeRef")

        if not latitude or not longitude:
            return None

        lat = dms_to_decimal(latitude, latitude_ref)
        lon = dms_to_decimal(longitude, longitude_ref)

        return {
            "latitude": round(lat, 7),
            "longitude": round(lon, 7),
            "source": "EXIF GPS",
            "confidence": "high"
        }

    except Exception:
        return None


def extract_metadata(file_path):

    result = {
        "available": False,
        "format": None,
        "mode": None,
        "width": None,
        "height": None,

        "has_exif": False,

        "exif": {},

        "camera": {
            "make": None,
            "model": None,
            "lens": None
        },

        "software": None,

        "timestamps": {
            "datetime": None,
            "datetime_original": None,
            "datetime_digitized": None
        },

        "gps": None,

        "metadata_quality": "unknown",

        "metadata_flags": []
    }

    try:

        image = Image.open(file_path)

        result["available"] = True
        result["format"] = image.format
        result["mode"] = image.mode
        result["width"] = image.width
        result["height"] = image.height

        exif_data = image.getexif()

        if not exif_data:

            result["metadata_flags"].append(
                "No EXIF metadata found"
            )

            result["metadata_quality"] = "missing"

            return result

        result["has_exif"] = True

        gps_raw = None

        for tag_id, value in exif_data.items():

            tag_name = TAGS.get(
                tag_id,
                str(tag_id)
            )

            result["exif"][tag_name] = _safe_value(value)

            if tag_name == "Make":
                result["camera"]["make"] = _safe_value(value)

            elif tag_name == "Model":
                result["camera"]["model"] = _safe_value(value)

            elif tag_name in ("LensModel", "LensMake"):
                result["camera"]["lens"] = _safe_value(value)

            elif tag_name == "Software":
                result["software"] = _safe_value(value)

            elif tag_name == "DateTime":
                result["timestamps"]["datetime"] = _safe_value(value)

            elif tag_name == "DateTimeOriginal":
                result["timestamps"]["datetime_original"] = _safe_value(value)

            elif tag_name == "DateTimeDigitized":
                result["timestamps"]["datetime_digitized"] = _safe_value(value)

            elif tag_name == "GPSInfo":
                gps_raw = value

        # ----------------------------------------------------
        # GPS
        # ----------------------------------------------------

        if gps_raw:

            try:

                decoded_gps = {}

                for key, value in gps_raw.items():

                    decoded_name = GPSTAGS.get(
                        key,
                        str(key)
                    )

                    decoded_gps[decoded_name] = value

                result["gps"] = _convert_gps(
                    decoded_gps
                )

            except Exception:
                result["gps"] = None

        # ----------------------------------------------------
        # METADATA QUALITY
        # ----------------------------------------------------

        camera_present = (
            result["camera"]["make"]
            or result["camera"]["model"]
        )

        software_present = bool(
            result["software"]
        )

        timestamp_present = any(
            result["timestamps"].values()
        )

        if camera_present and timestamp_present:

            result["metadata_quality"] = "strong"

        elif camera_present or timestamp_present:

            result["metadata_quality"] = "moderate"

        else:

            result["metadata_quality"] = "weak"

        # ----------------------------------------------------
        # FLAGS
        # ----------------------------------------------------

        if not camera_present:

            result["metadata_flags"].append(
                "Camera information unavailable"
            )

        if software_present:

            software_lower = (
                result["software"]
                .lower()
            )

            editing_keywords = [
                "photoshop",
                "adobe",
                "gimp",
                "lightroom",
                "canva",
                "paint",
                "affinity"
            ]

            if any(
                keyword in software_lower
                for keyword in editing_keywords
            ):

                result["metadata_flags"].append(
                    "Image editing software appears in metadata"
                )

        if result["gps"]:

            result["metadata_flags"].append(
                "EXIF GPS location available"
            )

        # ----------------------------------------------------
        # FORMAT CONSISTENCY
        # ----------------------------------------------------

        if image.format not in {
            "JPEG",
            "PNG",
            "WEBP"
        }:

            result["metadata_flags"].append(
                "Unusual image format"
            )

    except Exception as error:

        result["error"] = str(error)

    return result