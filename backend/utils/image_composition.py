from PIL import Image
from io import BytesIO
import uuid
import os

async def compose_images(foreground_bytes: bytes, background_bytes: bytes) -> str:
    try:
        foreground = Image.open(BytesIO(foreground_bytes)).convert("RGBA")
    except Exception:
        raise ValueError("Foreground is not a valid image.")

    try:
        background = Image.open(BytesIO(background_bytes)).convert("RGBA")
    except Exception:
        raise ValueError("Background is not a valid image.")

    background = background.resize(foreground.size)
    result = Image.alpha_composite(background, foreground)

    filename = f"composed_{uuid.uuid4().hex}.png"
    path = os.path.join("generated", filename)
    os.makedirs("generated", exist_ok=True)
    result.save(path)

    return path
