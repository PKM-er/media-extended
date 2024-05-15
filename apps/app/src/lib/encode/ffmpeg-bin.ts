import { Platform } from "obsidian";

const version = "7.0";
const pkg = "@aidenlx/ffmpeg-static@0.1.0";

export const getBinaryName = () => {
  if (!Platform.isDesktopApp) return null;
  return (
    `ffmpeg-${version}-${process.platform}-${process.arch}` +
    (process.platform === "win32" ? ".exe" : "")
  );
};

const toBinaryURL = (binaryName: string) =>
  `https://www.unpkg.com/${pkg}/bin/${binaryName}.gz`;

export async function isPlatformSupported(): Promise<boolean> {
  const binaryName = getBinaryName();
  if (!binaryName) return false;
  const url = toBinaryURL(binaryName);
  const resp = await fetch(url, { method: "HEAD" });
  if (resp.status === 404) return false;
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.statusText}`);
  return true;
}

export async function downloadBinary(): Promise<ArrayBuffer> {
  const binaryName = getBinaryName();
  if (!binaryName) throw new Error("Not desktop app");

  const url = toBinaryURL(binaryName);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.statusText}`);
  const stream = resp.body?.pipeThrough(new DecompressionStream("gzip"));
  if (!stream) throw new Error("No stream");
  return await new Response(stream).arrayBuffer();
}
