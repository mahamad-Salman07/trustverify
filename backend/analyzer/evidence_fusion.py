"""
============================================================
TRUSTVERIFY - Evidence Fusion Engine
============================================================

Combines independent evidence categories into a single
forensic evidence assessment.

IMPORTANT:
    This is an evidence/risk score.
    It is NOT a calibrated probability that an image is fake.

Design goals:
    - AI-generated images
    - Real photographs
    - Edited/manipulated photographs
    - Screenshots
    - Recaptured images
    - Inconclusive evidence

Screenshot handling:
    Screenshots are NOT automatically treated as fake.
    AI detector scores on screenshots are treated cautiously
    because many AI-image detectors are primarily trained
    on photographic images.

============================================================
"""


# ============================================================
# SAFE NUMBER
# ============================================================

def _number(value, default=0.0):

    try:

        number = float(value)

        if number != number:
            return default

        return number

    except Exception:

        return default


# ============================================================
# AVAILABILITY
# ============================================================

def _available(component):

    if not isinstance(
        component,
        dict
    ):
        return False

    return bool(
        component.get(
            "available",
            False
        )
    )


# ============================================================
# BOOLEAN HELPER
# ============================================================

def _is_true(
    component,
    key
):

    if not isinstance(
        component,
        dict
    ):
        return False

    return bool(
        component.get(
            key,
            False
        )
    )


# ============================================================
# SCREENSHOT DETECTION
# ============================================================

def _detect_screenshot(
    ai_result,
    manipulation,
    recapture,
    metadata,
    forensics
):

    signals = []
    reasons = []

    confidence_values = []

    # --------------------------------------------------------
    # AI detector screenshot analysis
    # --------------------------------------------------------

    screenshot_analysis = (
        ai_result.get(
            "screenshot_analysis",
            {}
        )
        if isinstance(
            ai_result,
            dict
        )
        else {}
    )

    if isinstance(
        screenshot_analysis,
        dict
    ):

        if screenshot_analysis.get(
            "possible",
            False
        ):

            signals.append(
                "AI detector reported "
                "screenshot-like characteristics"
            )

            score = _number(
                screenshot_analysis.get(
                    "score",
                    0
                )
            )

            if score > 0:

                confidence_values.append(
                    score * 100
                    if score <= 1
                    else score
                )

            for reason in screenshot_analysis.get(
                "signals",
                []
            ):

                reasons.append(
                    str(reason)
                )

    # --------------------------------------------------------
    # Manipulation analyzer
    # --------------------------------------------------------

    if isinstance(
        manipulation,
        dict
    ):

        if manipulation.get(
            "is_screenshot",
            False
        ):

            signals.append(
                "Manipulation analyzer "
                "identified screenshot characteristics"
            )

            screenshot_confidence = _number(
                manipulation.get(
                    "screenshot_confidence",
                    0
                )
            )

            if screenshot_confidence > 0:

                confidence_values.append(
                    screenshot_confidence
                )

            for reason in manipulation.get(
                "screenshot_reasons",
                []
            ):

                reasons.append(
                    str(reason)
                )

    # --------------------------------------------------------
    # Recapture analyzer
    # --------------------------------------------------------

    if isinstance(
        recapture,
        dict
    ):

        if recapture.get(
            "likely_screenshot",
            False
        ):

            signals.append(
                "Recapture analyzer "
                "identified screenshot characteristics"
            )

            confidence = _number(
                recapture.get(
                    "confidence",
                    0
                )
            )

            if confidence > 0:

                confidence_values.append(
                    confidence
                )

    # --------------------------------------------------------
    # Metadata
    # --------------------------------------------------------

    if isinstance(
        metadata,
        dict
    ):

        image_format = str(
            metadata.get(
                "format",
                ""
            )
        ).upper()

        width = _number(
            metadata.get(
                "width",
                0
            )
        )

        height = _number(
            metadata.get(
                "height",
                0
            )
        )

        if image_format == "PNG":

            signals.append(
                "PNG format is compatible "
                "with screenshots"
            )

        # Common desktop screenshot resolutions
        common_resolutions = {
            (1920, 1080),
            (1366, 768),
            (1536, 864),
            (1600, 900),
            (1280, 720),
            (2560, 1440),
            (3840, 2160),
        }

        if (
            int(width),
            int(height)
        ) in common_resolutions:

            signals.append(
                "Image dimensions match "
                "a common display resolution"
            )

    # --------------------------------------------------------
    # Forensic characteristics
    # --------------------------------------------------------

    if isinstance(
        forensics,
        dict
    ):

        aspect_ratio = _number(
            forensics.get(
                "aspect_ratio",
                0
            )
        )

        if (
            aspect_ratio >= 1.70
            and
            aspect_ratio <= 1.80
        ):

            signals.append(
                "Wide display-style aspect ratio"
            )

    # --------------------------------------------------------
    # Determine result
    # --------------------------------------------------------

    unique_signals = list(
        dict.fromkeys(
            signals
        )
    )

    unique_reasons = list(
        dict.fromkeys(
            reasons
        )
    )

    signal_count = len(
        unique_signals
    )

    if confidence_values:

        confidence = sum(
            confidence_values
        ) / len(
            confidence_values
        )

    else:

        confidence = 0

    # Stronger confidence when several independent
    # screenshot signals agree.
    if signal_count >= 4:

        confidence = max(
            confidence,
            80
        )

    elif signal_count >= 3:

        confidence = max(
            confidence,
            65
        )

    elif signal_count >= 2:

        confidence = max(
            confidence,
            50
        )

    confidence = min(
        100,
        confidence
    )

    possible = (
        signal_count >= 2
    )

    return {

        "possible": possible,

        "confidence": round(
            confidence,
            2
        ),

        "signals": unique_signals,

        "reasons": unique_reasons
    }


# ============================================================
# ADD EVIDENCE
# ============================================================

def _add_evidence(
    evidence,
    category,
    severity,
    score,
    finding
):

    evidence.append({

        "category": category,

        "severity": severity,

        "score": round(
            _number(score),
            2
        ),

        "finding": finding
    })


# ============================================================
# MAIN FUSION ENGINE
# ============================================================

def calculate_evidence_fusion(
    metadata,
    forensics,
    ela,
    ai_result,
    fingerprint,
    manipulation,
    recapture,
    web_trace
):

    # ========================================================
    # SAFE DEFAULTS
    # ========================================================

    metadata = (
        metadata
        if isinstance(metadata, dict)
        else {}
    )

    forensics = (
        forensics
        if isinstance(forensics, dict)
        else {}
    )

    ela = (
        ela
        if isinstance(ela, dict)
        else {}
    )

    ai_result = (
        ai_result
        if isinstance(ai_result, dict)
        else {}
    )

    fingerprint = (
        fingerprint
        if isinstance(fingerprint, dict)
        else {}
    )

    manipulation = (
        manipulation
        if isinstance(manipulation, dict)
        else {}
    )

    recapture = (
        recapture
        if isinstance(recapture, dict)
        else {}
    )

    web_trace = (
        web_trace
        if isinstance(web_trace, dict)
        else {}
    )

    evidence = []

    category_scores = {}

    # ========================================================
    # SCREENSHOT ANALYSIS FIRST
    # ========================================================

    screenshot = _detect_screenshot(
        ai_result=ai_result,
        manipulation=manipulation,
        recapture=recapture,
        metadata=metadata,
        forensics=forensics
    )

    is_screenshot = screenshot[
        "possible"
    ]

    screenshot_confidence = screenshot[
        "confidence"
    ]

    # ========================================================
    # AI DETECTION
    # ========================================================

    ai_probability = _number(
        ai_result.get(
            "ai_probability",
            0
        )
    )

    ai_available = _available(
        ai_result
    )

    ai_prediction = str(
        ai_result.get(
            "prediction",
            "unknown"
        )
    ).lower()

    if ai_available:

        category_scores[
            "ai"
        ] = ai_probability

        # ----------------------------------------------------
        # Screenshot-aware AI interpretation
        # ----------------------------------------------------

        if is_screenshot:

            if ai_probability >= 80:

                _add_evidence(
                    evidence,
                    "AI Detection",
                    "medium",
                    ai_probability,
                    (
                        "Strong AI-generation signal detected, "
                        "but the image also shows strong "
                        "screenshot characteristics."
                    )
                )

            elif ai_probability >= 60:

                _add_evidence(
                    evidence,
                    "AI Detection",
                    "info",
                    ai_probability,
                    (
                        "AI detector produced a moderate "
                        "synthetic-image signal on a "
                        "screenshot-like image; this signal "
                        "requires cautious interpretation."
                    )
                )

            elif ai_probability >= 40:

                _add_evidence(
                    evidence,
                    "AI Detection",
                    "info",
                    ai_probability,
                    (
                        "Ambiguous AI signal detected on a "
                        "screenshot-like image."
                    )
                )

        else:

            if ai_probability >= 80:

                _add_evidence(
                    evidence,
                    "AI Detection",
                    "high",
                    ai_probability,
                    "Strong AI-generation signal detected"
                )

            elif ai_probability >= 60:

                _add_evidence(
                    evidence,
                    "AI Detection",
                    "medium",
                    ai_probability,
                    "Moderate AI-generation signal detected"
                )

            elif ai_probability >= 40:

                _add_evidence(
                    evidence,
                    "AI Detection",
                    "low",
                    ai_probability,
                    "Weak or ambiguous AI-generation signal"
                )

    # ========================================================
    # MANIPULATION
    # ========================================================

    manipulation_score = _number(
        manipulation.get(
            "score",
            0
        )
    )

    manipulation_available = _available(
        manipulation
    )

    if manipulation_available:

        category_scores[
            "manipulation"
        ] = manipulation_score

        if is_screenshot:

            # Screenshot texture naturally creates
            # strong local statistical differences.
            #
            # Do NOT classify those differences as
            # manipulation by themselves.

            if manipulation_score > 0:

                _add_evidence(
                    evidence,
                    "Manipulation",
                    "info",
                    manipulation_score,
                    (
                        "Local statistical differences were "
                        "detected, but screenshot characteristics "
                        "reduce their evidentiary value."
                    )
                )

        else:

            if manipulation_score >= 60:

                _add_evidence(
                    evidence,
                    "Manipulation",
                    "high",
                    manipulation_score,
                    (
                        "Strong local statistical "
                        "inconsistencies detected"
                    )
                )

            elif manipulation_score >= 25:

                _add_evidence(
                    evidence,
                    "Manipulation",
                    "medium",
                    manipulation_score,
                    (
                        "Potential local manipulation "
                        "indicators detected"
                    )
                )

    # ========================================================
    # ELA
    # ========================================================

    ela_score = _number(
        ela.get(
            "ela_score",
            0
        )
    )

    ela_available = _available(
        ela
    )

    if ela_available:

        category_scores[
            "ela"
        ] = ela_score

        if is_screenshot:

            # ELA is particularly unreliable for PNG
            # screenshots because PNG does not have
            # JPEG compression history.

            if ela_score >= 35:

                _add_evidence(
                    evidence,
                    "ELA",
                    "info",
                    ela_score,
                    (
                        "ELA variation detected, but ELA "
                        "has limited evidentiary value for "
                        "PNG screenshot content."
                    )
                )

        else:

            if ela_score >= 70:

                _add_evidence(
                    evidence,
                    "ELA",
                    "medium",
                    ela_score,
                    "High JPEG error variation"
                )

            elif ela_score >= 35:

                _add_evidence(
                    evidence,
                    "ELA",
                    "low",
                    ela_score,
                    "Moderate JPEG error variation"
                )

    # ========================================================
    # FORENSICS
    # ========================================================

    forensic_score = 0

    if _available(
        forensics
    ):

        indicators = forensics.get(
            "suspicion_indicators",
            []
        )

        if not isinstance(
            indicators,
            list
        ):

            indicators = []

        forensic_score = min(
            100,
            len(indicators) * 20
        )

        category_scores[
            "forensics"
        ] = forensic_score

        if is_screenshot:

            # Screenshot images frequently contain:
            # text, flat backgrounds, sharp edges and
            # large local variance differences.
            #
            # Therefore these indicators should not
            # automatically increase manipulation risk.

            if indicators:

                _add_evidence(
                    evidence,
                    "Forensics",
                    "info",
                    forensic_score,
                    (
                        "Forensic texture differences detected; "
                        "their significance is reduced because "
                        "the image appears to be a screenshot."
                    )
                )

        else:

            for indicator in indicators:

                _add_evidence(
                    evidence,
                    "Forensics",
                    "low",
                    20,
                    str(indicator)
                )

    # ========================================================
    # METADATA
    # ========================================================

    metadata_score = 0

    if _available(
        metadata
    ):

        metadata_flags = metadata.get(
            "metadata_flags",
            []
        )

        if not isinstance(
            metadata_flags,
            list
        ):

            metadata_flags = []

        if (
            "No EXIF metadata found"
            in metadata_flags
        ):

            # Missing EXIF is weak evidence only.
            metadata_score += 3

            _add_evidence(
                evidence,
                "Metadata",
                "info",
                3,
                (
                    "No EXIF metadata found; "
                    "this alone does not indicate "
                    "fake content"
                )
            )

        for flag in metadata_flags:

            if (
                flag !=
                "No EXIF metadata found"
            ):

                metadata_score += 5

                _add_evidence(
                    evidence,
                    "Metadata",
                    "low",
                    5,
                    str(flag)
                )

        category_scores[
            "metadata"
        ] = min(
            100,
            metadata_score
        )

    # ========================================================
    # RECAPTURE
    # ========================================================

    recapture_confidence = _number(
        recapture.get(
            "confidence",
            0
        )
    )

    recapture_available = _available(
        recapture
    )

    if recapture_available:

        category_scores[
            "recapture"
        ] = recapture_confidence

        likely_screenshot = _is_true(
            recapture,
            "likely_screenshot"
        )

        likely_recapture = _is_true(
            recapture,
            "likely_recapture"
        )

        if likely_recapture:

            _add_evidence(
                evidence,
                "Recapture",
                "medium",
                recapture_confidence,
                (
                    "Possible camera/display "
                    "recapture indicators detected"
                )
            )

        elif (
            likely_screenshot
            and not is_screenshot
        ):

            _add_evidence(
                evidence,
                "Recapture",
                "info",
                recapture_confidence,
                (
                    "Screenshot-like characteristics "
                    "were detected"
                )
            )

    # ========================================================
    # SCREENSHOT EVIDENCE
    # ========================================================

    if is_screenshot:

        _add_evidence(
            evidence,
            "Image Type",
            "info",
            screenshot_confidence,
            (
                "Image appears to be a screenshot "
                "or screen-capture rather than a "
                "camera photograph."
            )
        )

        category_scores[
            "screenshot"
        ] = screenshot_confidence

    # ========================================================
    # RISK SCORE
    # ========================================================
    #
    # IMPORTANT:
    #
    # Screenshot is NOT itself a fake/manipulation signal.
    #
    # For screenshots:
    #
    #     AI signal is retained
    #     manipulation is heavily discounted
    #     ELA is discounted
    #     texture forensics are discounted
    #
    # This prevents a normal screenshot from being
    # incorrectly classified as manipulated.
    #
    # ========================================================

    if is_screenshot:

        # ----------------------------------------------------
        # Screenshot-specific risk
        # ----------------------------------------------------

        # AI detector is still useful as a signal, but
        # not enough by itself to declare the screenshot
        # AI-generated unless it is very strong.
        ai_component = (
            ai_probability * 0.55
        )

        manipulation_component = (
            manipulation_score * 0.05
        )

        ela_component = (
            ela_score * 0.03
        )

        forensic_component = (
            forensic_score * 0.02
        )

        recapture_component = (
            recapture_confidence * 0.05
        )

        # Screenshot itself is neutral.
        screenshot_component = 0

        base_score = (
            ai_component
            +
            manipulation_component
            +
            ela_component
            +
            forensic_component
            +
            recapture_component
            +
            screenshot_component
        )

    else:

        # ----------------------------------------------------
        # Normal photograph / other image
        # ----------------------------------------------------

        weighted_values = []
        weights = []

        if "ai" in category_scores:

            weighted_values.append(
                category_scores["ai"]
            )

            weights.append(
                0.40
            )

        if "manipulation" in category_scores:

            weighted_values.append(
                category_scores["manipulation"]
            )

            weights.append(
                0.22
            )

        if "forensics" in category_scores:

            weighted_values.append(
                category_scores["forensics"]
            )

            weights.append(
                0.13
            )

        if "ela" in category_scores:

            weighted_values.append(
                category_scores["ela"]
            )

            weights.append(
                0.10
            )

        if "recapture" in category_scores:

            weighted_values.append(
                category_scores["recapture"]
            )

            weights.append(
                0.10
            )

        if weighted_values:

            total_weight = sum(
                weights
            )

            base_score = sum(
                value * weight
                for value, weight
                in zip(
                    weighted_values,
                    weights
                )
            ) / total_weight

        else:

            base_score = 50

    # ========================================================
    # CROSS-EVIDENCE BOOST
    # ========================================================

    strong_ai = (
        ai_probability >= 80
        and
        not (
            is_screenshot
            and
            ai_probability < 90
        )
    )

    very_strong_ai = (
        ai_probability >= 90
    )

    manipulation_present = (
        manipulation_score >= 40
        and
        not is_screenshot
    )

    ela_present = (
        ela_score >= 60
        and
        not is_screenshot
    )

    # --------------------------------------------------------
    # AI + Manipulation
    # --------------------------------------------------------

    if (
        strong_ai
        and
        manipulation_present
    ):

        base_score += 8

        _add_evidence(
            evidence,
            "Evidence Fusion",
            "high",
            8,
            (
                "AI-generation and manipulation "
                "signals reinforce each other"
            )
        )

    # --------------------------------------------------------
    # Manipulation + ELA
    # --------------------------------------------------------

    if (
        manipulation_present
        and
        ela_present
    ):

        base_score += 5

        _add_evidence(
            evidence,
            "Evidence Fusion",
            "medium",
            5,
            (
                "Manipulation and ELA signals "
                "reinforce each other"
            )
        )

    # --------------------------------------------------------
    # Screenshot + moderate AI
    # --------------------------------------------------------

    if (
        is_screenshot
        and
        ai_probability >= 60
        and
        ai_probability < 90
    ):

        _add_evidence(
            evidence,
            "Evidence Fusion",
            "info",
            0,
            (
                "The image is screenshot-like and "
                "contains a moderate AI signal. "
                "The AI result should not be interpreted "
                "as definitive because screenshot content "
                "can produce false synthetic signals."
            )
        )

    # --------------------------------------------------------
    # Screenshot + very strong AI
    # --------------------------------------------------------

    if (
        is_screenshot
        and
        very_strong_ai
    ):

        _add_evidence(
            evidence,
            "Evidence Fusion",
            "high",
            ai_probability,
            (
                "Very strong AI-generation evidence "
                "remains present despite screenshot "
                "characteristics."
            )
        )

    # ========================================================
    # FINAL SCORE
    # ========================================================

    risk_score = round(
        min(
            100,
            max(
                0,
                base_score
            )
        ),
        2
    )

    # ========================================================
    # VERDICT
    # ========================================================

    # --------------------------------------------------------
    # SCREENSHOT VERDICTS
    # --------------------------------------------------------

    if is_screenshot:

        if very_strong_ai:

            verdict = (
                "Screenshot with Strong AI Signal"
            )

            status = "review"

            risk_level = "high"

        elif ai_probability >= 80:

            verdict = (
                "Screenshot with Possible AI Content"
            )

            status = "review"

            risk_level = "medium"

        else:

            verdict = (
                "Screenshot Detected"
            )

            status = "review"

            risk_level = "low"

    # --------------------------------------------------------
    # NON-SCREENSHOT VERDICTS
    # --------------------------------------------------------

    elif (
        strong_ai
        and
        manipulation_present
    ):

        verdict = (
            "Likely AI / Manipulated"
        )

        status = "failed"

        risk_level = "high"

    elif ai_probability >= 80:

        verdict = (
            "Likely AI-Generated"
        )

        status = "failed"

        risk_level = "high"

    elif risk_score >= 70:

        verdict = (
            "Suspicious"
        )

        status = "failed"

        risk_level = "high"

    elif risk_score >= 40:

        verdict = (
            "Needs Review"
        )

        status = "review"

        risk_level = "medium"

    else:

        verdict = (
            "No Strong Manipulation Evidence"
        )

        status = "verified"

        risk_level = "low"

    # ========================================================
    # CONFIDENCE
    # ========================================================

    available_count = sum([
        _available(metadata),
        _available(forensics),
        _available(ela),
        _available(ai_result),
        _available(fingerprint),
        _available(manipulation),
        _available(recapture),
        _available(web_trace)
    ])

    confidence = min(
        95,
        40 +
        available_count * 7
    )

    # Screenshot confidence should reflect
    # screenshot-specific evidence.
    if is_screenshot:

        confidence = max(
            confidence,
            min(
                95,
                55 +
                screenshot_confidence * 0.35
            )
        )

    # If evidence is explicitly uncertain,
    # don't pretend to have extreme confidence.
    if (
        ai_prediction == "uncertain"
        and
        not manipulation_present
        and
        not very_strong_ai
    ):

        confidence = min(
            confidence,
            90
        )

    # ========================================================
    # UNIQUE EVIDENCE
    # ========================================================

    unique_evidence = []

    seen = set()

    for item in evidence:

        key = (
            item.get(
                "category",
                ""
            ),
            item.get(
                "finding",
                ""
            )
        )

        if key in seen:
            continue

        seen.add(
            key
        )

        unique_evidence.append(
            item
        )

    evidence = unique_evidence

    # ========================================================
    # RISK REASONS
    # ========================================================

    risk_reasons = []

    if is_screenshot:

        risk_reasons.append(
            "Screenshot characteristics detected."
        )

        if ai_probability >= 80:

            risk_reasons.append(
                "AI detector produced a strong "
                "synthetic-image signal."
            )

        elif ai_probability >= 60:

            risk_reasons.append(
                "AI detector produced a moderate "
                "synthetic-image signal, but the "
                "result is inconclusive for screenshot content."
            )

    else:

        if ai_probability >= 80:

            risk_reasons.append(
                "Strong AI-generation signal."
            )

        if manipulation_score >= 40:

            risk_reasons.append(
                "Manipulation indicators detected."
            )

        if ela_score >= 60:

            risk_reasons.append(
                "Elevated ELA variation detected."
            )

    # ========================================================
    # RETURN
    # ========================================================

    return {

        "score": risk_score,

        "risk_score": risk_score,

        "verdict": verdict,

        "status": status,

        "risk_level": risk_level,

        "confidence": round(
            confidence,
            2
        ),

        "category_scores": {

            key: round(
                value,
                2
            )

            for key, value
            in category_scores.items()
        },

        "evidence": evidence,

        "evidence_count": len(
            evidence
        ),

        "reasons": risk_reasons,

        "screenshot_analysis": {

            "is_screenshot": is_screenshot,

            "confidence": round(
                screenshot_confidence,
                2
            ),

            "signals": screenshot[
                "signals"
            ],

            "reasons": screenshot[
                "reasons"
            ]
        },

        "analysis_components": {

            "metadata": _available(
                metadata
            ),

            "forensics": _available(
                forensics
            ),

            "ela": _available(
                ela
            ),

            "ai_detection": _available(
                ai_result
            ),

            "fingerprint": _available(
                fingerprint
            ),

            "manipulation": _available(
                manipulation
            ),

            "recapture": _available(
                recapture
            ),

            "web_trace": _available(
                web_trace
            )
        }
    }