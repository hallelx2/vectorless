from __future__ import annotations

from typing import Optional, Dict, List


class VectorlessError(Exception):
    """Base exception for all Vectorless SDK errors."""

    def __init__(
        self,
        message: str,
        status: int,
        code: str,
        request_id: Optional[str] = None,
    ) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.request_id = request_id


class AuthenticationError(VectorlessError):
    def __init__(
        self, message: str, request_id: Optional[str] = None
    ) -> None:
        super().__init__(message, 401, "authentication_error", request_id)


class NotFoundError(VectorlessError):
    def __init__(
        self, message: str, request_id: Optional[str] = None
    ) -> None:
        super().__init__(message, 404, "not_found", request_id)


class RateLimitError(VectorlessError):
    def __init__(
        self,
        message: str,
        retry_after: Optional[float] = None,
        request_id: Optional[str] = None,
    ) -> None:
        super().__init__(message, 429, "rate_limit_exceeded", request_id)
        self.retry_after = retry_after


class ValidationError(VectorlessError):
    def __init__(
        self,
        message: str,
        field_errors: Optional[Dict[str, List[str]]] = None,
        request_id: Optional[str] = None,
    ) -> None:
        super().__init__(message, 400, "validation_error", request_id)
        self.field_errors = field_errors


class ConflictError(VectorlessError):
    def __init__(
        self, message: str, request_id: Optional[str] = None
    ) -> None:
        super().__init__(message, 409, "conflict", request_id)


class ServerError(VectorlessError):
    def __init__(
        self, message: str, request_id: Optional[str] = None
    ) -> None:
        super().__init__(message, 500, "server_error", request_id)
