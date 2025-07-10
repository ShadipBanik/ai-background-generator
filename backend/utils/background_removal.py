from rembg import remove

async def remove_bg(img_bytes, output_path):
    output = remove(img_bytes)
    with open(output_path, "wb") as f:
        f.write(output)
    return output_path
