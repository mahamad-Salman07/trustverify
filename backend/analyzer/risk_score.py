"""
TRUSTVERIFY compatibility risk scoring.

The main scoring engine now lives in evidence_fusion.py.
"""

from .evidence_fusion import calculate_evidence_fusion


def calculate_risk(
    metadata,
    forensics,
    ela,
    ai_result,
    fingerprint=None,
    manipulation=None,
    recapture=None,
    web_trace=None
):

    return calculate_evidence_fusion(

        metadata=metadata,

        forensics=forensics,

        ela=ela,

        ai_result=ai_result,

        fingerprint=fingerprint or {},

        manipulation=manipulation or {},

        recapture=recapture or {},

        web_trace=web_trace or {}
    )