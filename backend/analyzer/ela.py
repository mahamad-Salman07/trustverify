import os

from PIL import Image, ImageChops, ImageEnhance, ImageStat


def perform_ela(
    file_path,
    quality=90
):

    result = {
        "available": False,
        "quality": quality,
        "mean_error": None,
        "max_error": None,
        "ela_score": None,
        "suspicion_level": "unknown",
        "flags": []
    }

    temporary_path = (
        file_path +
        ".ela_temp.jpg"
    )


    try:

        original = Image.open(
            file_path
        ).convert("RGB")


        # ----------------------------------------------------
        # RE-ENCODE
        # ----------------------------------------------------

        original.save(
            temporary_path,
            "JPEG",
            quality=quality
        )


        recompressed = Image.open(
            temporary_path
        ).convert("RGB")


        # ----------------------------------------------------
        # DIFFERENCE
        # ----------------------------------------------------

        difference = ImageChops.difference(
            original,
            recompressed
        )


        statistics = ImageStat.Stat(
            difference
        )


        mean_error = (
            sum(statistics.mean) /
            len(statistics.mean)
        )


        max_error = max(
            max(channel)
            for channel in statistics.extrema
        )


        # ----------------------------------------------------
        # NORMALIZED SCORE
        # ----------------------------------------------------

        ela_score = min(
            100,
            (mean_error / 20) * 100
        )


        result["available"] = True

        result["mean_error"] = round(
            mean_error,
            4
        )

        result["max_error"] = round(
            max_error,
            4
        )

        result["ela_score"] = round(
            ela_score,
            2
        )


        # ----------------------------------------------------
        # INTERPRETATION
        # ----------------------------------------------------

        if mean_error < 2:

            result[
                "suspicion_level"
            ] = "low"

        elif mean_error < 7:

            result[
                "suspicion_level"
            ] = "medium"

            result["flags"].append(
                "Moderate JPEG error variation"
            )

        else:

            result[
                "suspicion_level"
            ] = "high"

            result["flags"].append(
                "High JPEG error variation"
            )


    except Exception as error:

        result["error"] = str(error)


    finally:

        if os.path.exists(
            temporary_path
        ):

            try:
                os.remove(
                    temporary_path
                )
            except Exception:
                pass


    return result