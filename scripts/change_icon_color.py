from PIL import Image
import os

def change_to_green(image_path):
    """Change red and blue colors to green shades"""
    img = Image.open(image_path).convert('RGBA')
    pixels = img.load()

    width, height = img.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]

            # Skip transparent or white pixels
            if a < 10 or (r > 240 and g > 240 and b > 240):
                continue

            # Detect red-ish colors (red > green and red > blue)
            if r > 150 and r > g + 30 and r > b + 30:
                # Convert red to dark green
                new_r = int(g * 0.3)
                new_g = int(r * 0.8)  # Use red intensity for green
                new_b = int(b * 0.3)
                pixels[x, y] = (new_r, new_g, new_b, a)

            # Detect blue-ish colors (blue > red and blue > green)
            elif b > 100 and b > r + 20 and b > g:
                # Convert blue to lighter green
                new_r = int(r * 0.4)
                new_g = int(b * 0.85)  # Use blue intensity for green
                new_b = int(g * 0.5)
                pixels[x, y] = (new_r, new_g, new_b, a)

    img.save(image_path)
    print(f"Updated: {image_path}")

# Base path
base_path = r"C:\Users\DESKTOP\Desktop\ClaudeCodeTest\ServiceManager\android\app\src\main\res"

# Process all icon files
icon_files = [
    "mipmap-hdpi/ic_launcher.png",
    "mipmap-hdpi/ic_launcher_foreground.png",
    "mipmap-hdpi/ic_launcher_round.png",
    "mipmap-mdpi/ic_launcher.png",
    "mipmap-mdpi/ic_launcher_foreground.png",
    "mipmap-mdpi/ic_launcher_round.png",
    "mipmap-xhdpi/ic_launcher.png",
    "mipmap-xhdpi/ic_launcher_foreground.png",
    "mipmap-xhdpi/ic_launcher_round.png",
    "mipmap-xxhdpi/ic_launcher.png",
    "mipmap-xxhdpi/ic_launcher_foreground.png",
    "mipmap-xxhdpi/ic_launcher_round.png",
    "mipmap-xxxhdpi/ic_launcher.png",
    "mipmap-xxxhdpi/ic_launcher_foreground.png",
    "mipmap-xxxhdpi/ic_launcher_round.png",
]

for icon_file in icon_files:
    full_path = os.path.join(base_path, icon_file)
    if os.path.exists(full_path):
        change_to_green(full_path)
    else:
        print(f"Not found: {full_path}")

print("\nDone! All icons changed to green.")
