// Usage: node search.mjs <type: occupation|skill|qualification> <limit> "query1" "query2" ...
// Prints title, German label and URI of the top hits per query.
const [type, limit, ...queries] = process.argv.slice(2);
const API = "https://ec.europa.eu/esco/api/search";

for (const q of queries) {
  const url = `${API}?text=${encodeURIComponent(q)}&type=${type}&language=en&limit=${limit}&full=false`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(`\n### ${q}  (total ${data.total})`);
  for (const r of data._embedded?.results ?? []) {
    const id = r.uri.split("/").pop();
    console.log(`  - ${r.title} | de: ${r.preferredLabel?.de ?? "-"} | ${id}`);
  }
}
