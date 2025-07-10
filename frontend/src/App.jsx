import React, { useState, useEffect } from 'react';

function App() {
  const [image, setImage] = useState(null);
  const [fgUrl, setFgUrl] = useState('');
  const [bgPrompt, setBgPrompt] = useState('');
  const [bgUrl, setBgUrl] = useState('');
  const [suggestedImages, setSuggestedImages] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [finalUrl, setFinalUrl] = useState('');
  const [filteredPrompts, setFilteredPrompts] = useState([]);

  const suggestions = {
    beach: ["beach1.jpeg", "beach2.jpeg", "beach3.jpeg", "beach4.jpeg"],
    forest: ["forest1.jpeg", "forest2.jpeg", "forest3.jpeg", "forest4.jpeg"],
    space: ["space1.jpeg", "space2.jpeg", "space3.jpeg"],
    garden: ["garden1.jpeg", "garden2.jpeg", "garden3.jpeg"],
    city: ["city1.jpeg", "city2.jpeg", "city3.jpeg"]
  };

  const allPrompts = [
    "beach", "beach sunset", "beach party",
    "forest", "dense forest", "autumn forest",
    "space", "galaxy", "nebula", "space station",
    "city", "night city", "futuristic city",
    "garden", "flower garden", "zen garden"
  ];

  useEffect(() => {
    handleShowSuggestions();
  }, [bgPrompt]);

  const handleShowSuggestions = () => {
    const prompt = bgPrompt.toLowerCase();
    if (suggestions[prompt]) {
      const images = suggestions[prompt].map(img => `http://127.0.0.1:8000/static/backgrounds/${img}`);
      setSuggestedImages(images);
    } else {
      setSuggestedImages([]);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/remove-background", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      const imageUrl = `http://127.0.0.1:8000${data.url}`;
      setFgUrl(imageUrl);
      setImage(imageUrl);
    } catch (error) {
      console.error("Failed to upload:", error);
    }
  };

  const handleGenerateBg = async () => {
    const res = await fetch("http://127.0.0.1:8000/generate-background?prompt=" + encodeURIComponent(bgPrompt), {
      method: "POST"
    });
    const data = await res.json();
    setBgUrl("http://127.0.0.1:8000/" + data.bg_url);
  };

  const handleCompose = async () => {
    const formData = new FormData();
    const fgBlob = await fetch(image).then(res => res.blob());
    const fgFile = new File([fgBlob], "foreground.png", { type: fgBlob.type || "image/png" });
    formData.append("foreground", fgFile);

    const bgBlob = await fetch(bgUrl).then(res => res.blob());
    const bgFile = new File([bgBlob], "background.png", { type: bgBlob.type || "image/png" });
    formData.append("background", bgFile);

    try {
      const res = await fetch("http://127.0.0.1:8000/compose", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Server error");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setFinalUrl(url);
    } catch (err) {
      console.error("Compose failed:", err);
      alert("Image composition failed");
    }
  };

  return (
    <div className="h-screen overflow-auto items-center justify-center p-4 bg-gray-100 text-center">
      <div className=" w-1/3 m-auto ">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">AI Background Generator</h1>
      
      <div class="flex items-center justify-center w-full">
          <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
              <div class="flex flex-col items-center justify-center pt-5 pb-6">
                  {fgUrl? 
                   (<img src={fgUrl} alt="Foreground" className="mx-auto w-48 rounded shadow" />):
                   (
                      <div>
                      <svg class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Click to upload</span> or drag and drop</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                    </div>
                   )}

              </div>
              <input id="dropzone-file"  onChange={handleUpload} type="file" class="hidden" />
          </label>
      </div> 

      {/* <input type="file" onChange={handleUpload} className="mb-4" /> */}

      
      <div className='flex mt-6 gap-4'>
      <div className="relative  flex w-1/2">
        <input
          type="text"
          placeholder="Describe background (e.g., beach, forest)"
          value={bgPrompt}
          onChange={e => {
            const val = e.target.value;
            setBgPrompt(val);
            const suggestions = allPrompts.filter(p =>
              p.toLowerCase().startsWith(val.toLowerCase()) && val.trim() !== ""
            );
            setFilteredPrompts(suggestions);
          }}
          className="px-2 py-2 border rounded w-full max-w-md mx-auto"
        />
        {filteredPrompts.length > 0 && (
          <ul className="absolute left-1/2 transform -translate-x-1/2 top-12 w-full max-w-md bg-white border rounded shadow z-10">
            {filteredPrompts.map((suggestion, index) => (
              <li
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setBgPrompt(suggestion);
                  setFilteredPrompts([]);
                }}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
      <span>OR</span>
      <button onClick={handleGenerateBg} className=" w-1/2  px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        Ai Generate Background
      </button>
      </div>


      {suggestedImages.length > 0 && (
        <div className="mt-6">
          <p className="font-semibold mb-2">Select a background suggestion:</p>
          <div className="flex flex-wrap justify-center gap-4">
            {suggestedImages.map((imgUrl, index) => (
              <img
                key={index}
                src={imgUrl}
                alt={`Suggestion ${index}`}
                className={`w-28 h-20 object-cover rounded cursor-pointer border ${selectedSuggestion === imgUrl ? 'border-blue-500 border-4' : 'border-gray-300'}`}
                onClick={() => {
                  setSelectedSuggestion(imgUrl);
                  setBgUrl(imgUrl);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {bgUrl && <img src={bgUrl} alt="Background" className="mx-auto mt-6 w-48 rounded shadow" />}

      <button onClick={handleCompose} className="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Compose Final Image
      </button>

      {finalUrl && <img src={finalUrl} alt="Composed" className="mx-auto mt-6 w-72 rounded shadow-lg" />}
      </div>
    </div>
  );
}

export default App;
