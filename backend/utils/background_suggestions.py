
import os
from diffusers import StableDiffusionPipeline
import torch
from PIL import Image
import uuid

os.makedirs("generated", exist_ok=True)
pipe = StableDiffusionPipeline.from_pretrained(
    "CompVis/stable-diffusion-v1-4",
    torch_dtype=torch.float32
).to("cpu")

async def suggest_or_generate_bg(prompt: str) -> str:
    image = pipe(prompt, num_inference_steps=15, height=384, width=384).images[0]
    image_name = f"{uuid.uuid4()}.png"
    image_path = os.path.join("generated", image_name)
    image.save(image_path)
    return image_path
