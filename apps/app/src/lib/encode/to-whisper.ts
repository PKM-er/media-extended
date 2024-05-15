import { ffmpeg } from "./ffmpeg";

// Function to convert MP4 to MP3 using FFmpeg
export async function prepareWhisper(
  path: string,
  { binary }: { binary: string },
): Promise<Blob> {
  const mp3Data = await ffmpeg({
    args: [
      /* eslint-disable prettier/prettier */
      "-i", path,
      "-vn",
      "-map_metadata", "-1",
      // opus, bitrate: 16 kbps, audio rate: 12 kHz, mono audio
      "-c:a", "libopus",
      "-f", "opus",
      "-b:a", "16k",
      "-ar", "12000",
      "-ac", "1",
      "-af", "speechnorm",
      "pipe:1",
       /* eslint-enable prettier/prettier */ 
    ],
    binary,
    pipe: true,
  });
  return new Blob([mp3Data], { type: "audio/opus" });
}
