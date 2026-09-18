from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException
)

from fastapi.middleware.cors import CORSMiddleware

from analyzer.metadata import extract_metadata
from analyzer.forensics import analyze_image
from analyzer.ela import perform_ela
from analyzer.ai_detector import ai_analyze_image

from analyzer.fingerprint import fingerprint_image
from analyzer.manipulation import analyze_manipulation
from analyzer.recapture import analyze_recapture
from analyzer.web_trace import create_web_trace

from analyzer.evidence_fusion import (
    calculate_evidence_fusion
)

from analyzer.report import create_report

import os
import uuid
import json
from datetime import datetime


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(

    title="TRUSTVERIFY AI Forensics API",

    description=(
        "Multi-signal image authenticity, "
        "forensics and evidence analysis API"
    ),

    version="2.0.0"
)


# ============================================================
# CORS
# ============================================================
app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        "http://localhost:5174",
        "http://127.0.0.1:5174",

        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ============================================================
# DIRECTORIES
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

UPLOAD_DIR = os.path.join(
    BASE_DIR,
    "uploads"
)

REPORT_DIR = os.path.join(
    BASE_DIR,
    "reports"
)

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)

os.makedirs(
    REPORT_DIR,
    exist_ok=True
)


# ============================================================
# CONSTANTS
# ============================================================

MAX_FILE_SIZE = (
    100 * 1024 * 1024
)

ALLOWED_CONTENT_TYPES = {

    "image/jpeg",

    "image/png",

    "image/webp",

    "image/bmp",

    "image/tiff"
}

ALLOWED_EXTENSIONS = {

    ".jpg",

    ".jpeg",

    ".png",

    ".webp",

    ".bmp",

    ".tiff"
}


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {

        "status": "online",

        "message": (
            "TRUSTVERIFY "
            "Forensic Intelligence API"
        ),

        "version": "2.0.0"
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {

        "status": "online",

        "service":
            "TRUSTVERIFY",

        "version":
            "2.0.0",

        "engines": {

            "metadata": True,

            "forensics": True,

            "ela": True,

            "ai_detection": True,

            "fingerprinting": True,

            "manipulation": True,

            "recapture": True,

            "web_trace": True,

            "evidence_fusion": True
        }
    }


# ============================================================
# API INFO
# ============================================================

@app.get("/api/info")
def api_info():

    return {

        "name": "TRUSTVERIFY",

        "service": (
            "AI Image Authenticity "
            "& Forensic Intelligence"
        ),

        "version": "2.0.0",

        "features": [

            "AI image detection",

            "metadata intelligence",

            "EXIF GPS extraction",

            "advanced image forensics",

            "ELA analysis",

            "manipulation analysis",

            "screenshot/recapture indicators",

            "SHA-256 fingerprint",

            "perceptual fingerprint",

            "web trace",

            "evidence fusion",

            "explainable trust score",

            "JSON evidence report"
        ]
    }


# ============================================================
# ANALYSIS
# ============================================================

@app.post("/analyze")
async def analyze_image_file(

    file: UploadFile = File(...)
):

    # --------------------------------------------------------
    # 1. CONTENT TYPE
    # --------------------------------------------------------

    if file.content_type not in (
        ALLOWED_CONTENT_TYPES
    ):

        raise HTTPException(

            status_code=400,

            detail=(
                "Only JPG, PNG, WEBP, "
                "BMP and TIFF images are allowed."
            )
        )

    # --------------------------------------------------------
    # 2. READ
    # --------------------------------------------------------

    file_data = await file.read()

    # --------------------------------------------------------
    # 3. SIZE
    # --------------------------------------------------------

    if not file_data:

        raise HTTPException(

            status_code=400,

            detail="The uploaded file is empty."
        )

    if len(file_data) > MAX_FILE_SIZE:

        raise HTTPException(

            status_code=413,

            detail=(
                "File size must be "
                "100 MB or less."
            )
        )

    # --------------------------------------------------------
    # 4. NAME
    # --------------------------------------------------------

    original_filename = (
        file.filename
        or
        "unknown_image"
    )

    extension = os.path.splitext(
        original_filename
    )[1].lower()

    if extension not in (
        ALLOWED_EXTENSIONS
    ):

        raise HTTPException(

            status_code=400,

            detail="Invalid image extension."
        )

    # --------------------------------------------------------
    # 5. SAFE FILE
    # --------------------------------------------------------

    file_id = str(
        uuid.uuid4()
    )

    safe_filename = (
        f"{file_id}{extension}"
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        safe_filename
    )

    try:

        with open(
            file_path,
            "wb"
        ) as buffer:

            buffer.write(
                file_data
            )

    except Exception as error:

        raise HTTPException(

            status_code=500,

            detail=(
                "Unable to save image: "
                f"{error}"
            )
        )

    # --------------------------------------------------------
    # 6. ANALYSIS
    # --------------------------------------------------------

    try:

        metadata = extract_metadata(
            file_path
        )

        forensics = analyze_image(
            file_path
        )

        ela = perform_ela(
            file_path
        )

        ai_result = ai_analyze_image(
            file_path
        )

        fingerprint = fingerprint_image(
            file_path
        )

        manipulation = analyze_manipulation(
            file_path
        )

        recapture = analyze_recapture(

            file_path,

            metadata
        )

        web_trace = create_web_trace(

            original_filename,

            fingerprint
        )

        risk = calculate_evidence_fusion(

            metadata=metadata,

            forensics=forensics,

            ela=ela,

            ai_result=ai_result,

            fingerprint=fingerprint,

            manipulation=manipulation,

            recapture=recapture,

            web_trace=web_trace
        )

        report = create_report(

            filename=original_filename,

            metadata=metadata,

            forensics=forensics,

            ela=ela,

            risk=risk,

            ai_result=ai_result,

            fingerprint=fingerprint,

            manipulation=manipulation,

            recapture=recapture,

            web_trace=web_trace
        )

    except Exception as error:

        try:

            if os.path.exists(
                file_path
            ):

                os.remove(
                    file_path
                )

        except Exception:
            pass

        raise HTTPException(

            status_code=500,

            detail=(
                "Image analysis failed: "
                f"{error}"
            )
        )

    # --------------------------------------------------------
    # 7. REPORT INFO
    # --------------------------------------------------------

    timestamp = datetime.now().strftime(
        "%Y-%m-%d_%H-%M-%S"
    )

    report_filename = (

        "TRUSTVERIFY_report_"

        f"{timestamp}_"

        f"{file_id[:8]}.json"
    )

    report_path = os.path.join(

        REPORT_DIR,

        report_filename
    )

    report["report_name"] = (
        report_filename
    )

    report["report_file"] = (
        report_path
    )

    report["file_id"] = (
        file_id
    )

    report["original_filename"] = (
        original_filename
    )

    report["file_size"] = (
        len(file_data)
    )

    report["file_type"] = (
        file.content_type
    )

    report["analysis_timestamp"] = (
        datetime.now().isoformat()
    )

    # --------------------------------------------------------
    # 8. SAVE
    # --------------------------------------------------------

    try:

        with open(

            report_path,

            "w",

            encoding="utf-8"

        ) as report_file:

            json.dump(

                report,

                report_file,

                indent=4,

                ensure_ascii=False,

                default=str
            )

    except Exception as error:

        raise HTTPException(

            status_code=500,

            detail=(
                "Unable to save report: "
                f"{error}"
            )
        )

    # --------------------------------------------------------
    # 9. RETURN
    # --------------------------------------------------------

    return report


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(

        "main:app",

        host="127.0.0.1",

        port=8000,

        reload=True
    )