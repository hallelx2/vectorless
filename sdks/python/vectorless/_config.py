from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class VectorlessConfig:
    api_key: str
    base_url: str = "https://api.vectorless.store"
    timeout: float = 30.0
    max_retries: int = 3
    retry_delay: float = 0.5


def resolve_config(
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    timeout: float = 30.0,
    max_retries: int = 3,
) -> VectorlessConfig:
    resolved_key = api_key or os.environ.get("VECTORLESS_API_KEY")
    if not resolved_key:
        raise ValueError(
            "Vectorless API key is required. Pass it as `api_key` in the constructor "
            "or set the VECTORLESS_API_KEY environment variable."
        )

    return VectorlessConfig(
        api_key=resolved_key,
        base_url=base_url or "https://api.vectorless.store",
        timeout=timeout,
        max_retries=max_retries,
    )
