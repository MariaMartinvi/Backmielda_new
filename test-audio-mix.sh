#!/bin/bash
# Test script for mixing audio with background music using ffmpeg directly

# Set paths
TTS_AUDIO="test-audio.mp3"
MUSIC_PATH="assets/background-music/relaxing-ambient.mp3"
OUTPUT_PATH="test-mixed-output.mp3"

# Check if test audio exists
if [ ! -f "$TTS_AUDIO" ]; then
  echo "Error: Test audio file not found: $TTS_AUDIO"
  echo "Please create a test-audio.mp3 file in the project root."
  exit 1
fi

# Verify music file exists
if [ ! -f "$MUSIC_PATH" ]; then
  echo "Error: Music file not found: $MUSIC_PATH"
  exit 1
fi

echo "Starting audio mixing test..."
echo "TTS Audio: $TTS_AUDIO"
echo "Music: $MUSIC_PATH"
echo "Output: $OUTPUT_PATH"

# Run ffmpeg command
ffmpeg -y -i "$TTS_AUDIO" -i "$MUSIC_PATH" \
  -filter_complex "[1:a]volume=0.1,aloop=loop=-1:size=512k[m];[0:a][m]amix=inputs=2:dropout_transition=3" \
  -ac 2 -c:a libmp3lame -b:a 192k "$OUTPUT_PATH"

# Check if output was created successfully
if [ -f "$OUTPUT_PATH" ]; then
  echo "Success! Mixed audio saved to: $OUTPUT_PATH"
  echo "Please play it to check if mixing was successful."
else
  echo "Error: Failed to create mixed audio output."
  exit 1
fi 