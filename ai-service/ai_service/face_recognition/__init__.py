"""
Face Recognition Module
"""

from .v2_arcface import (
    init_arcface_v2_system,
    extract_arcface_v2_embedding_from_camera,
    cache_customers_v2_embeddings,
    add_customer_v2_embedding,
    search_faiss_v2_candidates,
    compute_similarity_v2,
    similarity_to_confidence,
    ARCFACE_V2_MODEL,
    CUSTOMER_V2_CACHE,
    FAISS_V2_INDEX,
    FAISS_V2_ID_MAP,
    SIMILARITY_V2_THRESHOLD
)

__all__ = [
    "init_arcface_v2_system",
    "extract_arcface_v2_embedding_from_camera",
    "cache_customers_v2_embeddings",
    "add_customer_v2_embedding",
    "search_faiss_v2_candidates",
    "compute_similarity_v2",
    "similarity_to_confidence",
    "ARCFACE_V2_MODEL",
    "CUSTOMER_V2_CACHE",
    "FAISS_V2_INDEX",
    "FAISS_V2_ID_MAP",
    "SIMILARITY_V2_THRESHOLD"
]
