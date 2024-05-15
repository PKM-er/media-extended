import { getSpawn } from "@/lib/require";

// Dedicated function to convert Node.js Buffer to ArrayBuffer
function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
}

export class FFmpegError extends Error {
  constructor(message: string, public stderr: string[]) {
    super(message);
  }
}

export function ffmpeg(opts: {
  args: string[];
  binary: string;
  pipe: true;
}): Promise<ArrayBuffer>;
export function ffmpeg(opts: {
  args: string[];
  binary: string;
  pipe?: false;
}): Promise<void>;
export function ffmpeg({
  args,
  binary: ffmpeg,
  pipe = false,
}: {
  args: string[];
  binary: string;
  pipe?: boolean;
}): Promise<ArrayBuffer | void> {
  const spawn = getSpawn();
  if (!spawn) throw new Error("Not desktop app");
  return new Promise<ArrayBuffer | void>((resolve, reject) => {
    console.debug(`Running FFmpeg with args: ${args.join(" ")}`);
    if (!pipe) console.debug("stdout to /dev/null");
    const stdout: Buffer[] = [];
    function handleStdErr(process: { stderr: NodeJS.ReadableStream }) {
      const stderr: string[] = [];
      process.stderr.on("data", (data) => {
        const message = data.toString("utf-8");
        console.debug(`> FFMPEG: ${message}`);
        stderr.push(message);
      });
      return stderr;
    }
    if (pipe) {
      const process = spawn(ffmpeg, args, {
        // Ignore stdin, pipe stdout and stderr
        stdio: ["ignore", "pipe", "pipe"],
      });
      const stderr = handleStdErr(process);
      process.stdout.on("data", (data) => stdout.push(data));
      process.on("error", (err) =>
        reject(
          new FFmpegError(`FFmpeg error (${err.name}): ${err.message}`, stderr),
        ),
      );
      process.on("close", (code) => {
        if (code === 0) {
          const output = Buffer.concat(stdout);
          resolve(bufferToArrayBuffer(output));
        } else {
          reject(new FFmpegError(`FFmpeg error (code: ${code})`, stderr));
        }
      });
    } else {
      const process = spawn(ffmpeg, args, {
        stdio: ["ignore", "ignore", "pipe"],
      });
      process.stderr.on("data", (data: Buffer) =>
        console.debug(data.toString("utf-8")),
      );
      process.on("error", (err) => reject(new Error(`FFmpeg error: ${err}`)));
      process.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `FFmpeg exited with code ${code}, see debug logs for output`,
            ),
          );
        }
      });
    }
  });
}
