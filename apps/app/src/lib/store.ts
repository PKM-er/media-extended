export async function jsonToGzipBlob(data: any) {
  return await new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(JSON.stringify(data));
        controller.close();
      },
    })
      .pipeThrough(new TextEncoderStream())
      .pipeThrough(new CompressionStream("gzip")),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    { headers: { "Content-Type": "application/gzip" } },
  ).blob();
}
export async function gzipBlobToJson<T = unknown>(blob: Blob) {
  if (blob.type !== "application/gzip") throw new Error("Invalid blob type");
  return (await new Response(
    blob.stream().pipeThrough(new DecompressionStream("gzip")),
  ).json()) as T;
}
