"""
Integration test: Tests the Python SDK against the live Vectorless API.

Run with:
  cd sdks/python
  VECTORLESS_API_KEY=vl_xxx VECTORLESS_BASE_URL=http://localhost:3001 uv run pytest tests/test_integration.py -v -s

Requires the API server to be running on localhost:3001.
"""

import os
import pytest
from vectorless import VectorlessClient, AddDocumentOptions

API_KEY = os.environ.get("VECTORLESS_API_KEY", "")
BASE_URL = os.environ.get("VECTORLESS_BASE_URL", "http://localhost:3001")

# Skip all tests if no API key is set
pytestmark = pytest.mark.skipif(
    not API_KEY, reason="VECTORLESS_API_KEY not set"
)

SAMPLE_DOC = """# Python SDK Test Document

## 1. Introduction

This is a test document for the Vectorless Python SDK integration tests.
It contains multiple sections with different topics to verify the parsing
and retrieval pipeline works correctly end-to-end.

## 2. Machine Learning Basics

Machine learning is a subset of artificial intelligence that enables systems
to learn and improve from experience. Key approaches include supervised learning
(classification, regression), unsupervised learning (clustering, dimensionality
reduction), and reinforcement learning (reward-based optimization).

Common algorithms include linear regression, decision trees, random forests,
support vector machines (SVM), k-nearest neighbors (KNN), and neural networks.

## 3. Deep Learning Architectures

Deep learning uses multi-layered neural networks. Key architectures include:

- **CNNs** (Convolutional Neural Networks): Image recognition, computer vision
- **RNNs** (Recurrent Neural Networks): Sequential data, time series
- **Transformers**: Natural language processing, attention mechanisms
- **GANs** (Generative Adversarial Networks): Image generation, data augmentation
- **Autoencoders**: Dimensionality reduction, anomaly detection

## 4. Model Evaluation

Evaluation metrics depend on the task:

- Classification: accuracy, precision, recall, F1-score, AUC-ROC
- Regression: MSE, RMSE, MAE, R-squared
- Clustering: silhouette score, Davies-Bouldin index
- Ranking: NDCG, MAP, MRR
"""


@pytest.fixture
def client():
    c = VectorlessClient(api_key=API_KEY, base_url=BASE_URL)
    yield c
    c.close()


def test_full_pipeline(client: VectorlessClient):
    """Test: upload -> status -> ToC -> fetch section -> batch fetch -> delete"""

    # 1. Upload document
    print("\n> Uploading document...")
    result = client.add_document(
        SAMPLE_DOC.encode("utf-8"),
        options=AddDocumentOptions(
            source_type="txt",
            toc_strategy="extract",
            title="ML Basics Test Doc",
        ),
    )
    assert result.doc_id, "Should return a doc_id"
    assert result.status == "ready", f"Expected ready, got {result.status}"
    doc_id = result.doc_id
    print(f"  OK Uploaded: {doc_id} (status: {result.status})")

    try:
        # 2. Get document details
        print("> Getting document details...")
        doc = client.get_document(doc_id)
        assert doc.status == "ready"
        assert doc.section_count is not None and doc.section_count > 0
        print(f"  OK Status: {doc.status}, Sections: {doc.section_count}")

        # 3. Get ToC
        print("> Getting Table of Contents...")
        toc = client.get_toc(doc_id)
        assert toc.doc_id == doc_id
        assert len(toc.sections) > 0
        print(f"  OK ToC: {toc.title} ({len(toc.sections)} sections)")
        for s in toc.sections:
            print(f"    - {s.title}")

        # 4. Fetch single section
        section_id = toc.sections[1].section_id  # "1. Introduction" or similar
        print(f"> Fetching section: {section_id}")
        section = client.fetch_section(doc_id, section_id)
        assert section.section_id == section_id
        assert len(section.content) > 0
        print(f"  OK Title: {section.title} ({section.token_count} tokens)")
        print(f"  Content preview: {section.content[:100]}...")

        # 5. Batch fetch
        if len(toc.sections) >= 3:
            ids = [toc.sections[1].section_id, toc.sections[2].section_id]
            print(f"> Batch fetching {len(ids)} sections...")
            sections = client.fetch_sections(doc_id, ids)
            assert len(sections) == len(ids)
            print(f"  OK Fetched {len(sections)} sections:")
            for s in sections:
                print(f"    - {s.title} ({s.token_count} tokens)")

        # 6. List documents
        print("> Listing documents...")
        docs_response = client.list_documents()
        assert len(docs_response.documents) > 0
        print(f"  OK {len(docs_response.documents)} document(s) found")

    finally:
        # 7. Clean up — delete
        print("> Deleting document...")
        client.delete_document(doc_id)
        print("  OK Deleted")

    print("\n[PASS] All Python SDK integration tests passed!")
