from __future__ import annotations

from typing import Any, Dict, Optional, Type, TypeVar, List, Tuple

import httpx
from pydantic import BaseModel

from vectorless._config import VectorlessConfig
from vectorless._retry import sync_retry, async_retry
from vectorless._version import __version__
from vectorless.errors import (
    VectorlessError,
    AuthenticationError,
    NotFoundError,
    RateLimitError,
    ValidationError,
    ConflictError,
    ServerError,
)

T = TypeVar("T")


def _parse_error(response: httpx.Response) -> VectorlessError:
    request_id = response.headers.get("x-request-id")
    try:
        body = response.json()
        message = body.get("error", {}).get("message", f"Request failed: {response.status_code}")
        field_errors = body.get("error", {}).get("field_errors")
    except Exception:
        message = f"Request failed with status {response.status_code}"
        field_errors = None

    status = response.status_code
    if status == 401:
        return AuthenticationError(message, request_id)
    if status == 404:
        return NotFoundError(message, request_id)
    if status == 429:
        retry_after_header = response.headers.get("retry-after")
        retry_after = float(retry_after_header) if retry_after_header else None
        return RateLimitError(message, retry_after, request_id)
    if status == 400:
        return ValidationError(message, field_errors, request_id)
    if status == 409:
        return ConflictError(message, request_id)
    if status >= 500:
        return ServerError(message, request_id)
    return VectorlessError(message, status, "unknown", request_id)


class SyncHttpTransport:
    def __init__(self, config: VectorlessConfig) -> None:
        self._config = config
        self._client = httpx.Client(
            base_url=config.base_url,
            headers={
                "Authorization": f"Bearer {config.api_key}",
                "User-Agent": f"vectorless-python/{__version__}",
            },
            timeout=config.timeout,
        )

    def get(
        self,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        response_model: Optional[Any] = None,
    ) -> Any:
        def _do() -> Any:
            resp = self._client.get(path, params=params)
            if not resp.is_success:
                raise _parse_error(resp)
            if resp.status_code == 204:
                return None
            data = resp.json()
            if response_model and issubclass(response_model, BaseModel):
                return response_model.model_validate(data)
            return data

        return sync_retry(_do, self._config.max_retries, self._config.retry_delay)

    def post(
        self,
        path: str,
        json: Optional[Dict[str, Any]] = None,
        files: Optional[Any] = None,
        data: Optional[Dict[str, Any]] = None,
        response_model: Optional[Any] = None,
    ) -> Any:
        def _do() -> Any:
            resp = self._client.post(path, json=json, files=files, data=data)
            if not resp.is_success:
                raise _parse_error(resp)
            if resp.status_code == 204:
                return None
            result = resp.json()
            if response_model and isinstance(response_model, type) and issubclass(response_model, BaseModel):
                return response_model.model_validate(result)
            return result

        return sync_retry(_do, self._config.max_retries, self._config.retry_delay)

    def delete(self, path: str) -> None:
        def _do() -> None:
            resp = self._client.delete(path)
            if not resp.is_success:
                raise _parse_error(resp)

        sync_retry(_do, self._config.max_retries, self._config.retry_delay)

    def close(self) -> None:
        self._client.close()


class AsyncHttpTransport:
    def __init__(self, config: VectorlessConfig) -> None:
        self._config = config
        self._client = httpx.AsyncClient(
            base_url=config.base_url,
            headers={
                "Authorization": f"Bearer {config.api_key}",
                "User-Agent": f"vectorless-python/{__version__}",
            },
            timeout=config.timeout,
        )

    async def get(
        self,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        response_model: Optional[Any] = None,
    ) -> Any:
        async def _do() -> Any:
            resp = await self._client.get(path, params=params)
            if not resp.is_success:
                raise _parse_error(resp)
            if resp.status_code == 204:
                return None
            data = resp.json()
            if response_model and issubclass(response_model, BaseModel):
                return response_model.model_validate(data)
            return data

        return await async_retry(_do, self._config.max_retries, self._config.retry_delay)

    async def post(
        self,
        path: str,
        json: Optional[Dict[str, Any]] = None,
        files: Optional[Any] = None,
        data: Optional[Dict[str, Any]] = None,
        response_model: Optional[Any] = None,
    ) -> Any:
        async def _do() -> Any:
            resp = await self._client.post(path, json=json, files=files, data=data)
            if not resp.is_success:
                raise _parse_error(resp)
            if resp.status_code == 204:
                return None
            result = resp.json()
            if response_model and isinstance(response_model, type) and issubclass(response_model, BaseModel):
                return response_model.model_validate(result)
            return result

        return await async_retry(_do, self._config.max_retries, self._config.retry_delay)

    async def delete(self, path: str) -> None:
        async def _do() -> None:
            resp = await self._client.delete(path)
            if not resp.is_success:
                raise _parse_error(resp)

        await async_retry(_do, self._config.max_retries, self._config.retry_delay)

    async def close(self) -> None:
        await self._client.aclose()
