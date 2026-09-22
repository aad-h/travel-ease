# RAG follow-up plan

This is a planning note only; no RAG behavior has been added yet.

1. Identify the travel documents and data sources that should be searchable.
2. Choose a low-cost embedding and retrieval approach compatible with the current stack.
3. Add ingestion, chunking, retrieval, and citation boundaries behind a small server-side module.
4. Keep provider keys server-side and add only variable names to `.env.example`.
5. Add tests for ingestion, retrieval, empty results, and provider failures before enabling the feature.
