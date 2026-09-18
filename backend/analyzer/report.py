"""
TRUSTVERIFY - Evidence Report Generator
"""

from datetime import datetime


def create_report(
    filename,
    metadata,
    forensics,
    ela,
    risk,
    ai_result,
    fingerprint=None,
    manipulation=None,
    recapture=None,
    web_trace=None
):

    fingerprint = fingerprint or {}
    manipulation = manipulation or {}
    recapture = recapture or {}
    web_trace = web_trace or {}

    return {

        "trustverify": {

            "product": "TRUSTVERIFY",

            "version": "2.0",

            "report_type": (
                "Image Authenticity "
                "and Forensic Evidence Report"
            ),

            "generated_at":
                datetime.now().isoformat(),

            "methodology": (
                "Multi-signal evidence fusion"
            ),

            "important_notice": (
                "TrustVerify findings are forensic "
                "indicators and should not be treated "
                "as absolute proof without appropriate "
                "human or investigative review."
            )
        },

        "report": {

            "title": (
                "TRUSTVERIFY "
                "Image Authenticity Report"
            ),

            "generated_at":
                datetime.now().isoformat(),

            "filename": filename
        },

        "summary": {

            "verdict": risk.get(
                "verdict",
                "Unknown"
            ),

            "status": risk.get(
                "status",
                "review"
            ),

            "trust_score": round(
                100 -
                float(
                    risk.get(
                        "risk_score",
                        50
                    )
                ),
                2
            ),

            "risk_score": risk.get(
                "risk_score",
                0
            ),

            "confidence": risk.get(
                "confidence",
                0
            ),

            "risk_level": risk.get(
                "risk_level",
                "unknown"
            )
        },

        "metadata": metadata,

        "forensics": forensics,

        "ela": ela,

        "ai_analysis": ai_result,

        "fingerprint": fingerprint,

        "manipulation_analysis":
            manipulation,

        "recapture_analysis":
            recapture,

        "web_trace":
            web_trace,

        "risk": risk,

        "evidence": {

            "metadata_flags":
                metadata.get(
                    "metadata_flags",
                    []
                ),

            "forensic_flags":
                forensics.get(
                    "forensic_flags",
                    []
                ),

            "forensic_suspicion_indicators":
                forensics.get(
                    "suspicion_indicators",
                    []
                ),

            "ela_flags":
                ela.get(
                    "flags",
                    []
                ),

            "ai_flags":
                ai_result.get(
                    "flags",
                    []
                ),

            "fusion_evidence":
                risk.get(
                    "evidence",
                    []
                ),

            "risk_reasons":
                risk.get(
                    "reasons",
                    []
                )
        }
    }