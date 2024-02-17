## Load External subtitles

> From easier document, pending to be updated.

Now support `.srt`, `.ass` and WebVTT format, local files only.

Requirements:

- Placed in the same folder as the media file
- Using the same file name as the media file

> Media File: `example.mp4`
> Subtitle File: `example.vtt`

- for multiple languages: valid language code following BCP-47 are required
    - For Chinese: `example.zh.vtt`, `example.cn.vtt` is invalid
    - For English: `example.en.vtt`
    - For other language, visit [this list](https://lingohub.com/academy/best-practices/iso-639-1-list)