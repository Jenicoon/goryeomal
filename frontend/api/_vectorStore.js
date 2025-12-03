// 서버리스 함수는 인스턴스별 메모리라 영속성은 없지만, 데모용으로 사용합니다.
let store = []; // { id, vector:number[], text:string, metadata:object }

export function addEmbedding(id, vector, text = "", metadata = {}) {
  store.push({ id, vector, text, metadata });
}

function dot(a, b) { return a.reduce((s, v, i) => s + v * b[i], 0); }
function norm(a) { return Math.sqrt(a.reduce((s, v) => s + v * v, 0)); }
function cosine(a, b) { return dot(a, b) / (norm(a) * norm(b) + 1e-12); }

export function searchEmbeddings(queryVec, topK = 5) {
  if (!store.length) return [];
  return store
    .map(item => ({ id: item.id, text: item.text, metadata: item.metadata, score: cosine(queryVec, item.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function listStore() { return store; }