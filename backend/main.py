from fastapi import FastAPI, UploadFile, File
from fastapi import HTTPException
from rembg import remove
from PIL import Image
import io
import uuid
from fastapi.responses import JSONResponse
from PIL import Image
import io
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from utils.background_removal import remove_bg
from utils.image_composition import compose_images
from utils.background_suggestions import suggest_or_generate_bg
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import ALL_METHODS
import os
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Or ["*"] for dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ 2. Custom StaticFiles class with CORS support
class CORSEnabledStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response: Response = await super().get_response(path, scope)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = ", ".join(ALL_METHODS)
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

# ✅ 3. Mount static and generated folders with CORS-enabled static files
if not os.path.exists("static"): os.makedirs("static")
if not os.path.exists("generated"): os.makedirs("generated")

app.mount("/static", CORSEnabledStaticFiles(directory="static"), name="static")
app.mount("/generated", CORSEnabledStaticFiles(directory="generated"), name="generated")
@app.post("/remove-background")
async def remove_background(file: UploadFile = File(...)):
    print('start remove background...')
    contents = await file.read()

    # Load image
    input_image = Image.open(io.BytesIO(contents)).convert("RGBA")

    # Remove background
    output_image_bytes = remove(contents)  # Use bytes, not PIL Image
    output_image = Image.open(io.BytesIO(output_image_bytes)).convert("RGBA")

    # Save processed image
    filename = f"{uuid.uuid4()}.png"
    output_path = Path("static") / filename
    output_image.save(output_path)

    # Return file path
    return JSONResponse(content={"url": f"/static/{filename}"})

@app.post("/generate-background")
async def generate_background(prompt: str):
    path = await suggest_or_generate_bg(prompt)
    return {"bg_url": path}


@app.post("/compose")
async def compose(foreground: UploadFile = File(...), background: UploadFile = File(...)):
    try:
        print(f"Foreground filename: {foreground.filename}, content_type: {foreground.content_type}")
        print(f"Background filename: {background.filename}, content_type: {background.content_type}")

        fg_bytes = await foreground.read()
        bg_bytes = await background.read()

        print(f"Foreground bytes: {len(fg_bytes)}, Background bytes: {len(bg_bytes)}")

        result_path = await compose_images(fg_bytes, bg_bytes)
        return FileResponse(result_path)

    except Exception as e:
        print("Compose error:", e)
        raise HTTPException(status_code=500, detail=str(e))


