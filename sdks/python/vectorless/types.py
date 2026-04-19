from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Literal, Any, Dict

from pydantic import BaseModel


class PageRange(BaseModel):
    start: int
    end: int


class ToCEntry(BaseModel):
    section_id: str
    title: str
    summary: str
    page_range: Optional[PageRange] = None
    link: str


class ToCManifest(BaseModel):
    doc_id: str
    title: str
    source_type: str
    section_count: int
    created_at: str
    sections: List[ToCEntry]


class Section(BaseModel):
    section_id: str
    doc_id: str
    title: str
    summary: Optional[str] = None
    content: str
    page_range: Optional[PageRange] = None
    order_index: int
    token_count: int
    level: int = 1
    parent_section_id: Optional[str] = None
    child_section_ids: List[str] = []
    is_leaf: bool = True


class SectionSummary(BaseModel):
    section_id: str
    title: str
    summary: Optional[str] = None
    page_range: Optional[PageRange] = None
    order_index: int
    token_count: int
    level: int
    is_leaf: bool


# ── Hierarchical Tree ToC (PageIndex-style) ──


class ToCTreeNode(BaseModel):
    section_id: str
    title: str
    summary: str
    level: int
    page_range: Optional[PageRange] = None
    token_count: int
    child_count: int
    is_leaf: bool
    link: str
    children: List["ToCTreeNode"] = []


class ToCTreeManifest(BaseModel):
    doc_id: str
    title: str
    source_type: str
    section_count: int
    depth: int
    created_at: str
    tree: List[ToCTreeNode]


# ── Agentic Retrieval ──


class TraversalStep(BaseModel):
    step: int
    tool_called: str
    arguments: Dict[str, Any]
    result_summary: str
    reasoning: str
    tokens_used: int


class TreeQueryOptions(BaseModel):
    max_steps: Optional[int] = None
    token_budget: Optional[int] = None


class TreeQueryResult(BaseModel):
    sections: List[Section]
    traversal_trace: List[TraversalStep]
    total_steps: int
    tokens_retrieved: int
    reasoning_summary: str


# ── Document Management ──


class AddDocumentOptions(BaseModel):
    source_type: Optional[Literal["pdf", "docx", "txt", "url"]] = None
    toc_strategy: Optional[Literal["extract", "generate", "hybrid"]] = None
    embed_sections: Optional[bool] = None
    title: Optional[str] = None


class AddDocumentResponse(BaseModel):
    doc_id: str
    status: Literal["processing", "ready", "failed"]
    toc: Optional[ToCManifest] = None


class DocumentSummary(BaseModel):
    doc_id: str
    title: str
    source_type: str
    section_count: Optional[int] = None
    status: Literal["processing", "ready", "failed"]
    created_at: str


class DocumentDetail(DocumentSummary):
    toc_strategy: str
    toc: Optional[ToCManifest] = None
    original_file_url: Optional[str] = None
    error_message: Optional[str] = None
    metadata: Optional[dict] = None  # type: ignore[type-arg]
    updated_at: str


class ListDocumentsOptions(BaseModel):
    cursor: Optional[str] = None
    limit: Optional[int] = None


class ListDocumentsResponse(BaseModel):
    documents: List[DocumentSummary]
    next_cursor: Optional[str] = None
    has_more: bool
