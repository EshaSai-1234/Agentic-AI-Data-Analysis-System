import math
from typing import List, Dict, Any

class VectorStore:
    """
    Lightweight, fast in-memory semantic vector store for dataset schema & metadata RAG.
    Zero external dependencies, highly resilient.
    """

    def __init__(self):
        self.documents: List[Dict[str, Any]] = []

    def index_dataset_schema(self, dataset_name: str, columns: List[Dict[str, Any]], sample_stats: Dict[str, Any]):
        self.documents.clear()
        for col in columns:
            name = col.get("name", "")
            dtype = col.get("data_type", "")
            inferred = col.get("inferred_type", "")
            text = f"Column: {name}. Data Type: {dtype}. Inferred Role: {inferred}. Sample Stats: {sample_stats.get(name, {})}"
            tokens = self._tokenize(text)
            self.documents.append({
                "dataset": dataset_name,
                "column": name,
                "text": text,
                "tokens": tokens,
                "metadata": col
            })

    def search_relevant_columns(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        query_tokens = self._tokenize(query)
        if not query_tokens or not self.documents:
            return [doc["metadata"] for doc in self.documents[:top_k]]

        scored_docs = []
        for doc in self.documents:
            score = self._compute_similarity(query_tokens, doc["tokens"])
            scored_docs.append((score, doc["metadata"]))

        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_docs[:top_k]]

    def _tokenize(self, text: str) -> List[str]:
        cleaned = text.lower().replace("_", " ").replace("-", " ")
        words = [w for w in cleaned.split() if len(w) > 2]
        return words

    def _compute_similarity(self, q_tokens: List[str], doc_tokens: List[str]) -> float:
        if not q_tokens or not doc_tokens:
            return 0.0
        q_set = set(q_tokens)
        doc_set = set(doc_tokens)
        intersection = q_set.intersection(doc_set)
        if not intersection:
            return 0.0
        return len(intersection) / math.sqrt(len(q_set) * len(doc_set))

vector_engine = VectorStore()
