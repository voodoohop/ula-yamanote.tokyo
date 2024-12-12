#!/bin/bash

# Create output directory if it doesn't exist
mkdir -p public/assets/tracks/low

# Loop through all mp3 files in the tracks directory
for file in public/assets/tracks/*.mp3; do
    # Skip if file doesn't exist
    [ -f "$file" ] || continue
    
    # Get the filename without path
    filename=$(basename "$file")
    
    # Create the output filename with -low suffix
    output_file="public/assets/tracks/low/${filename%.*}-low.mp3"
    
    # Skip if the low bitrate version already exists
    if [ -f "$output_file" ]; then
        echo "Skipping $filename (already encoded)"
        continue
    fi
    
    echo "Converting $filename to low bitrate version..."
    
    # Convert using ffmpeg with VBR encoding, quality level 7 (around 96kbps VBR)
    ffmpeg -i "$file" -codec:a libmp3lame -q:a 7 "$output_file"
done

echo "Conversion complete!"
