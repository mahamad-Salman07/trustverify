"""
TRUSTVERIFY - Web Trace

Provides a structured web-trace layer.

Important:
A local application cannot truthfully claim that it searched
the entire internet.

This module:
- prepares fingerprints
- accepts an optional source URL
- records trace status
- provides search-engine query URLs
"""

from urllib.parse import quote


def create_web_trace(
    filename,
    fingerprint,
    source_url=None
):

    sha256 = fingerprint.get(
        "sha256"
    )

    phash = fingerprint.get(
        "perceptual_hash"
    )

    result = {

        "available": True,

        "search_scope": (
            "discoverable_web_sources"
        ),

        "internet_coverage": (
            "not_exhaustive"
        ),

        "source_url": source_url,

        "sha256": sha256,

        "perceptual_hash": phash,

        "matches": [],

        "search_links": [],

        "message": (
            "Web trace identifies discoverable "
            "sources only. It cannot guarantee "
            "complete internet coverage."
        )
    }

    # --------------------------------------------------------
    # Search-engine helper links
    # --------------------------------------------------------

    if sha256:

        encoded_hash = quote(
            sha256
        )

        result["search_links"].append({
            "engine": "Google",
            "type": "hash",
            "url": (
                "https://www.google.com/search?q="
                + encoded_hash
            )
        })

        result["search_links"].append({
            "engine": "Bing",
            "type": "hash",
            "url": (
                "https://www.bing.com/search?q="
                + encoded_hash
            )
        })

    if filename:

        encoded_filename = quote(
            filename
        )

        result["search_links"].append({
            "engine": "Google",
            "type": "filename",
            "url": (
                "https://www.google.com/search?q="
                + encoded_filename
            )
        })

    if source_url:

        encoded_url = quote(
            source_url
        )

        result["search_links"].append({
            "engine": "Google",
            "type": "source-url",
            "url": (
                "https://www.google.com/search?q="
                + encoded_url
            )
        })

    return result