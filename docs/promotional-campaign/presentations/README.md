# Video Presentations

PowerPoint presentations for the Scenarist promotional video series. Compatible with Microsoft PowerPoint, Apple Keynote, and Google Slides.

## Files

| File                                           | Video   | Description                        |
| ---------------------------------------------- | ------- | ---------------------------------- |
| `video-01-the-testing-gap.pptx`                | Video 1 | The Testing Gap Nobody Talks About |
| `video-02-meet-payflow.pptx`                   | Video 2 | Meet PayFlow - A Real Payment App  |
| `video-03-one-server-unlimited-scenarios.pptx` | Video 3 | One Server, Unlimited Scenarios    |

## Design

- **Aspect ratio:** 16:9
- **Theme:** Dark background (zinc-900) with high contrast text
- **Color palette:**
  - Background: `#18181b` (zinc-900)
  - Text: `#ffffff` (white), `#a1a1aa` (zinc-400)
  - Accent: `#f59e0b` (amber-500) for key points
  - Success: `#22c55e` (green-500)
  - Error: `#ef4444` (red-500)
  - Info: `#3b82f6` (blue-500)

## Regenerating Slides

Each presentation has a corresponding Python script. To regenerate:

```bash
cd docs/promotional-campaign/presentations
python3 create-video-1-slides.py  # Video 1
python3 create-video-2-slides.py  # Video 2
python3 create-video-3-slides.py  # Video 3
```

Requires `python-pptx`:

```bash
pip3 install python-pptx
```

## Usage Tips

1. **Keynote:** Open the .pptx file directly - Keynote imports it automatically
2. **Google Slides:** Upload to Google Drive, then "Open with Google Slides"
3. **Font note:** Code blocks use Menlo font. If unavailable, they'll fall back to system monospace.

## Editing

For minor edits, modify the .pptx directly in your presentation software.

For structural changes, edit the Python script and regenerate - this keeps the source of truth in code and makes changes reproducible.
