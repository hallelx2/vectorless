from __future__ import annotations

import asyncio
import random
import time
from typing import Callable, TypeVar, Awaitable

from vectorless.errors import VectorlessError, RateLimitError

T = TypeVar("T")


def _jitter() -> float:
    return random.random() * 0.2


def sync_retry(
    fn: Callable[[], T],
    max_retries: int = 3,
    retry_delay: float = 0.5,
) -> T:
    last_error: BaseException | None = None

    for attempt in range(max_retries + 1):
        try:
            return fn()
        except VectorlessError as e:
            last_error = e

            if e.status == 429:
                delay = (
                    e.retry_after  # type: ignore[union-attr]
                    if isinstance(e, RateLimitError) and e.retry_after is not None
                    else retry_delay * (2**attempt)
                )
                if attempt < max_retries:
                    time.sleep(delay + _jitter())
                    continue

            if 400 <= e.status < 500 and e.status not in (408, 429):
                raise

            if attempt < max_retries:
                time.sleep(retry_delay * (2**attempt) + _jitter())
                continue

            raise
        except Exception as e:
            last_error = e
            if attempt < max_retries:
                time.sleep(retry_delay * (2**attempt) + _jitter())
                continue
            raise

    raise last_error  # type: ignore[misc]


async def async_retry(
    fn: Callable[[], Awaitable[T]],
    max_retries: int = 3,
    retry_delay: float = 0.5,
) -> T:
    last_error: BaseException | None = None

    for attempt in range(max_retries + 1):
        try:
            return await fn()
        except VectorlessError as e:
            last_error = e

            if e.status == 429:
                delay = (
                    e.retry_after  # type: ignore[union-attr]
                    if isinstance(e, RateLimitError) and e.retry_after is not None
                    else retry_delay * (2**attempt)
                )
                if attempt < max_retries:
                    await asyncio.sleep(delay + _jitter())
                    continue

            if 400 <= e.status < 500 and e.status not in (408, 429):
                raise

            if attempt < max_retries:
                await asyncio.sleep(retry_delay * (2**attempt) + _jitter())
                continue

            raise
        except Exception as e:
            last_error = e
            if attempt < max_retries:
                await asyncio.sleep(retry_delay * (2**attempt) + _jitter())
                continue
            raise

    raise last_error  # type: ignore[misc]
