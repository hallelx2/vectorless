from __future__ import annotations

from pathlib import Path
from typing import Any, BinaryIO, Dict, List, Optional, Tuple, Union

from vectorless.types import AddDocumentOptions


def prepare_upload(
    source: Union[str, bytes, BinaryIO, Path],
    options: Optional[AddDocumentOptions] = None,
) -> Tuple[Optional[List[Tuple[str, Any]]], Dict[str, str]]:
    """Prepare file upload for httpx.

    Returns (files, data) tuple for httpx.post(files=files, data=data).
    """
    files: Optional[List[Tuple[str, Any]]] = None
    data: Dict[str, str] = {}

    if isinstance(source, str):
        if source.startswith(("http://", "https://")):
            data["source_url"] = source
        else:
            # File path
            path = Path(source)
            files = [("file", (path.name, path.read_bytes()))]
    elif isinstance(source, Path):
        files = [("file", (source.name, source.read_bytes()))]
    elif isinstance(source, bytes):
        files = [("file", ("document", source))]
    else:
        # BinaryIO
        name = getattr(source, "name", "document")
        if isinstance(name, str) and "/" in name:
            name = name.rsplit("/", 1)[-1]
        files = [("file", (name, source.read()))]

    if options:
        if options.source_type:
            data["source_type"] = options.source_type
        if options.toc_strategy:
            data["toc_strategy"] = options.toc_strategy
        if options.embed_sections is not None:
            data["embed_sections"] = str(options.embed_sections).lower()
        if options.title:
            data["title"] = options.title

    return files, data
