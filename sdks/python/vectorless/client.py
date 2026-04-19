from __future__ import annotations

import time
from typing import Optional, Union, BinaryIO, List

from pathlib import Path

from vectorless._config import resolve_config
from vectorless._http import SyncHttpTransport
from vectorless._upload import prepare_upload
from vectorless.types import (
    AddDocumentOptions,
    AddDocumentResponse,
    ToCManifest,
    ToCTreeManifest,
    Section,
    SectionSummary,
    DocumentDetail,
    ListDocumentsOptions,
    ListDocumentsResponse,
    TreeQueryOptions,
    TreeQueryResult,
)
from vectorless.errors import ServerError, VectorlessError


class VectorlessClient:
    """Synchronous Vectorless API client."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = 30.0,
        max_retries: int = 3,
    ) -> None:
        config = resolve_config(
            api_key=api_key,
            base_url=base_url,
            timeout=timeout,
            max_retries=max_retries,
        )
        self._http = SyncHttpTransport(config)

    def add_document(
        self,
        source: Union[str, bytes, BinaryIO, Path],
        options: Optional[AddDocumentOptions] = None,
    ) -> AddDocumentResponse:
        """Upload and ingest a document. Waits for processing to complete."""
        files, data = prepare_upload(source, options)
        initial = self._http.post(
            "/v1/documents",
            files=files,
            data=data,
            response_model=AddDocumentResponse,
        )

        if initial.status == "ready" and initial.toc:
            return initial

        return self.wait_for_ready(initial.doc_id)

    def get_toc(self, doc_id: str) -> ToCManifest:
        """Get the Table of Contents manifest for a document."""
        return self._http.get(
            f"/v1/documents/{doc_id}/toc",
            response_model=ToCManifest,
        )

    def fetch_section(self, doc_id: str, section_id: str) -> Section:
        """Fetch a single section by ID."""
        return self._http.get(
            f"/v1/documents/{doc_id}/sections/{section_id}",
            response_model=Section,
        )

    def fetch_sections(
        self, doc_id: str, section_ids: List[str]
    ) -> List[Section]:
        """Fetch multiple sections. Returns in document order."""
        result = self._http.post(
            f"/v1/documents/{doc_id}/sections/batch",
            json={"section_ids": section_ids},
        )
        return [Section.model_validate(s) for s in result["sections"]]

    def get_document(self, doc_id: str) -> DocumentDetail:
        """Get document details including processing status."""
        return self._http.get(
            f"/v1/documents/{doc_id}",
            response_model=DocumentDetail,
        )

    def list_documents(
        self, options: Optional[ListDocumentsOptions] = None
    ) -> ListDocumentsResponse:
        """List all documents in the project."""
        params = {}
        if options:
            if options.cursor:
                params["cursor"] = options.cursor
            if options.limit:
                params["limit"] = str(options.limit)
        return self._http.get(
            "/v1/documents",
            params=params,
            response_model=ListDocumentsResponse,
        )

    def delete_document(self, doc_id: str) -> None:
        """Delete a document and all its sections."""
        self._http.delete(f"/v1/documents/{doc_id}")

    # ── Tree-Aware Methods ──

    def get_tree_toc(self, doc_id: str) -> ToCTreeManifest:
        """Get the hierarchical tree ToC for a document."""
        return self._http.get(
            f"/v1/documents/{doc_id}/toc/tree",
            response_model=ToCTreeManifest,
        )

    def get_root_sections(self, doc_id: str) -> List[SectionSummary]:
        """Get root-level sections (top of the document tree)."""
        result = self._http.get(f"/v1/documents/{doc_id}/sections/roots")
        return [SectionSummary.model_validate(s) for s in result["sections"]]

    def get_child_sections(
        self, doc_id: str, section_id: str
    ) -> List[SectionSummary]:
        """Get children of a specific section."""
        result = self._http.get(
            f"/v1/documents/{doc_id}/sections/{section_id}/children"
        )
        return [SectionSummary.model_validate(s) for s in result["sections"]]

    def query(
        self,
        doc_id: str,
        query: str,
        options: Optional[TreeQueryOptions] = None,
    ) -> TreeQueryResult:
        """Agentic query: LLM navigates the document tree to find relevant sections."""
        payload: dict = {"query": query}
        if options:
            if options.max_steps is not None:
                payload["max_steps"] = options.max_steps
            if options.token_budget is not None:
                payload["token_budget"] = options.token_budget
        result = self._http.post(f"/v1/documents/{doc_id}/query", json=payload)
        return TreeQueryResult.model_validate(result)

    def wait_for_ready(
        self,
        doc_id: str,
        timeout: float = 300.0,
        poll_interval: float = 2.0,
    ) -> AddDocumentResponse:
        """Wait for a document to finish processing."""
        deadline = time.time() + timeout

        while time.time() < deadline:
            time.sleep(poll_interval)
            doc = self.get_document(doc_id)

            if doc.status == "ready":
                toc = self.get_toc(doc_id)
                return AddDocumentResponse(
                    doc_id=doc_id, status="ready", toc=toc
                )

            if doc.status == "failed":
                raise ServerError(
                    f"Document processing failed: {doc.error_message or 'Unknown error'}"
                )

            poll_interval = min(poll_interval * 1.5, 10.0)

        raise VectorlessError(
            "Document processing timed out", 408, "timeout"
        )

    def close(self) -> None:
        """Close the HTTP client."""
        self._http.close()

    def __enter__(self) -> "VectorlessClient":
        return self

    def __exit__(self, *args: object) -> None:
        self.close()
