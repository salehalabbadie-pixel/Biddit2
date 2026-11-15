/**
 * Text of a PDF (CV or LinkedIn export), read entirely in the browser.
 * pdf.js is loaded on first use, so it never weighs on the main bundle.
 * A scanned PDF has no text layer and yields an empty string.
 */
export async function readPdfText(file) {
  const [pdfjs, worker] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n += 1) {
    const content = await (await doc.getPage(n)).getTextContent();
    pages.push(
      content.items.map((item) => `${item.str ?? ""}${item.hasEOL ? "\n" : " "}`).join("")
    );
  }
  await doc.destroy();
  return pages.join("\n");
}
