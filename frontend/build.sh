#!/bin/bash

# Frontend production build script
echo "Building frontend for production..."

# Minify CSS
npx clean-css-cli -o src/style.min.css src/style.css

# Minify JavaScript
npx terser src/script.js -o src/script.min.js --compress --mangle

# Generate WebP images (if imagemagick is available)
if command -v convert &> /dev/null; then
    echo "Converting images to WebP..."
    find ../images -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | while read img; do
        webp_name="${img%.*}.webp"
        if [ ! -f "$webp_name" ]; then
            convert "$img" -quality 85 "$webp_name"
            echo "Created: $webp_name"
        fi
    done
fi

# Update HTML to use minified files
sed -i 's/style\.css/style.min.css/g' src/index.html
sed -i 's/script\.js/script.min.js/g' src/index.html

echo "Frontend build complete!"
