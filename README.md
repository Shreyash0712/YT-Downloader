# YT-Grab

The idea was simple: I was tired of going to website with sketchy ads and redirects just to download a YouTube video, and sometimes you just have to download a snippet from a video and downloading it whole and snipping it is just a pain. I also like to merge a playlist into a single video for watching - I couldn't find a tool that did all that together - so I made one.

## Screenshot

![Interface](docs/image.png)

## Prerequisites

Since this app acts as a beautiful orchestrator, it needs a couple of heavy-lifters installed on your system. 

1. **[Node.js](https://nodejs.org/)** (v18+) 
   - Download and install directly from the [official website](https://nodejs.org/).
2. **[yt-dlp](https://github.com/yt-dlp/yt-dlp#installation)** (The core downloader)
   - **Mac:** `brew install yt-dlp`
   - **Windows:** `winget install yt-dlp` or use [Scoop](https://scoop.sh/)/[Chocolatey](https://chocolatey.org/).
   - **Linux:** Check your package manager or download the [release binary](https://github.com/yt-dlp/yt-dlp/wiki/Installation).
3. **[FFmpeg](https://ffmpeg.org/download.html)** (For merging and fast-trimming)
   - **Mac:** `brew install ffmpeg`
   - **Windows:** `winget install ffmpeg`
   - **Linux:** `sudo apt install ffmpeg`

> **Note:** Ensure both `yt-dlp` and `ffmpeg` are accessible in your system's PATH.

## Usage

You don't even need to clone the repository. As long as you have the prerequisites above, just run:

```bash
npx yt-grab
```

The app will launch instantly in your terminal!

However, if you're a dev or just like to fiddle with code, you can clone the repository and run the app locally:

```bash
git clone https://github.com/Shreyash0712/YT-Grab.git
cd YT-Grab
pnpm install
pnpm dev
```
## Features

- **Media Agnostic Queue**: Mix and match single YouTube videos and entire playlists in the same queue.
- **Precision Trimming**: Skip downloading full videos. Set start/end timestamps (e.g., `01:15` to `03:30`) and extract only what you need.
- **Playlist Segmenting**: Download specific segments of a playlist (e.g., Videos `1` to `5`) without grabbing the whole thing.
- **Auto-Merge Mode**: Seamlessly stitch your entire queue (videos + trimmed segments) into a single, contiguous output file using `ffmpeg` without re-encoding!
- **Format & Quality Control**: Globally toggle between Video (MP4) and Audio (MP3) formats, and easily cycle through max resolution targets (1080p, 720p, etc).