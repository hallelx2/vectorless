import pytest
from vectorless import VectorlessClient


def test_client_requires_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("VECTORLESS_API_KEY", raising=False)
    with pytest.raises(ValueError, match="API key is required"):
        VectorlessClient()


def test_client_accepts_api_key() -> None:
    client = VectorlessClient(api_key="vl_test_key")
    assert client is not None
    client.close()


def test_client_context_manager() -> None:
    with VectorlessClient(api_key="vl_test_key") as client:
        assert client is not None
