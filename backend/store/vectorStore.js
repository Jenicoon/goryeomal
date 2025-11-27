const store = []; // { id, vector: number[], text, metadata }

export function addEmbedding(id, vector, text = "", metadata = {}) {
  store.push({ id, vector, text, metadata });
}

function dot(a, b) {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}
function norm(a) {
  return Math.sqrt(a.reduce((s, v) => s + v * v, 0));
}
function cosine(a, b) {
  return dot(a, b) / (norm(a) * norm(b) + 1e-12);
}

export function searchEmbeddings(queryVec, topK = 5) {
  const results = store
    .map(item => ({ id: item.id, text: item.text, metadata: item.metadata, score: cosine(queryVec, item.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return results;
}

export function listStore() {
  return store;
}