import os

from PIL import Image


ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
}

ALLOWED_TYPES = {
    "JPEG",
    "PNG",
    "WEBP"
}


def validate_image(file_path):

    result = {
        "valid": False,
        "format": None,
        "width": None,
        "height": None,
        "size": None,
        "error": None
    }


    try:

        if not os.path.exists(
            file_path
        ):

            result["error"] = (
                "File does not exist"
            )

            return result


        result["size"] = os.path.getsize(
            file_path
        )


        extension = os.path.splitext(
            file_path
        )[1].lower()


        if extension not in ALLOWED_EXTENSIONS:

            result["error"] = (
                "Unsupported file extension"
            )

            return result


        image = Image.open(
            file_path
        )


        result["format"] = image.format

        result["width"] = image.width

        result["height"] = image.height


        if image.format not in ALLOWED_TYPES:

            result["error"] = (
                "Unsupported image format"
            )

            return result


        result["valid"] = True


    except Exception as error:

        result["error"] = str(error)


    return result