"""Vectorless — Official Python SDK for document retrieval."""

from vectorless.client import VectorlessClient
from vectorless.async_client import AsyncVectorlessClient
from vectorless.types import (
    AddDocumentOptions,
    AddDocumentResponse,
    ToCManifest,
    ToCEntry,
    PageRange,
    Section,
    DocumentSummary,
    DocumentDetail,
    ListDocumentsOptions,
    ListDocumentsResponse,
)
from vectorless.errors import (
    VectorlessError,
    AuthenticationError,
    NotFoundError,
    RateLimitError,
    ValidationError,
    ConflictError,
    ServerError,
)

__all__ = [
    "VectorlessClient",
    "AsyncVectorlessClient",
    "AddDocumentOptions",
    "AddDocumentResponse",
    "ToCManifest",
    "ToCEntry",
    "PageRange",
    "Section",
    "DocumentSummary",
    "DocumentDetail",
    "ListDocumentsOptions",
    "ListDocumentsResponse",
    "VectorlessError",
    "AuthenticationError",
    "NotFoundError",
    "RateLimitError",
    "ValidationError",
    "ConflictError",
    "ServerError",
]

__version__ = "0.1.0"
