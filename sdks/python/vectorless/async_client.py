from __future__ import annotations

import asyncio
from typing import Optional, Union, BinaryIO, List

from pathlib import Path

from vectorless._config import resolve_config
from vectorless._http import AsyncHttpTransport
from vectorless._upload import prepare_upload
from vectorless.types import (
    AddDocumentOptions,
    AddDocumentResponse,
    ToCManifest,
    Section,
    DocumentDetail,
    ListDocumentsOptions,
    ListDocumentsResponse,
)
from vectorless.errors import ServerError, VectorlessError


class AsyncVectorlessClient:
    """Asynchronous Vectorless API client."""

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
        self._http = AsyncHttpTransport(config)

    async def add_document(
        self,
        source: Union[str, bytes, BinaryIO, Path],
        options: Optional[AddDocumentOptions] = None,
    ) -> AddDocumentResponse:
        """Upload and ingest a document. Waits for processing to complete."""
        files, data = prepare_upload(source, options)
        initial = await self._http.post(
            "/v1/documents",
            files=files,
            data=data,
            response_model=AddDocumentResponse,
        )

        if initial.status == "ready" and initial.toc:
            return initial

        return await self.wait_for_ready(initial.doc_id)

    async def get_toc(self, doc_id: str) -> ToCManifest:
        return await self._http.get(
            f"/v1/documents/{doc_id}/toc",
            response_model=ToCManifest,
        )

    async def fetch_section(
        self, doc_id: str, section_id: str
    ) -> Section:
        return await self._http.get(
            f"/v1/documents/{doc_id}/sections/{section_id}",
            response_model=Section,
        )

    async def fetch_sections(
        self, doc_id: str, section_ids: List[str]
    ) -> List[Section]:
        result = await self._http.post(
            f"/v1/documents/{doc_id}/sections/batch",
            json={"section_ids": section_ids},
        )
        return [Section.model_validate(s) for s in result["sections"]]

    async def get_document(self, doc_id: str) -> DocumentDetail:
        return await self._http.get(
            f"/v1/documents/{doc_id}",
            response_model=DocumentDetail,
        )

    async def list_documents(
        self, options: Optional[ListDocumentsOptions] = None
    ) -> ListDocumentsResponse:
        params = {}
        if options:
            if options.cursor:
                params["cursor"] = options.cursor
            if options.limit:
                params["limit"] = str(options.limit)
        return await self._http.get(
            "/v1/documents",
            params=params,
            response_model=ListDocumentsResponse,
        )

    async def delete_document(self, doc_id: str) -> None:
        await self._http.delete(f"/v1/documents/{doc_id}")

    async def wait_for_ready(
        self,
        doc_id: str,
        timeout: float = 300.0,
        poll_interval: float = 2.0,
    ) -> AddDocumentResponse:
        deadline = asyncio.get_event_loop().time() + timeout

        while asyncio.get_event_loop().time() < deadline:
            await asyncio.sleep(poll_interval)
            doc = await self.get_document(doc_id)

            if doc.status == "ready":
                toc = await self.get_toc(doc_id)
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

    async def close(self) -> None:
        await self._http.close()

    async def __aenter__(self) -> "AsyncVectorlessClient":
        return self

    async def __aexit__(self, *args: object) -> None:
        await self.close()
