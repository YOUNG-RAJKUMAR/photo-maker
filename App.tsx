import React, { useState, useCallback } from 'react';
import { generatePassportPhoto } from './services/geminiService';
import { Loader } from './components/Loader';
import { UploadIcon, DownloadIcon, SparklesIcon, ArrowPathIcon } from './components/icons';

type BackgroundColor = {
  name: string;
  value: string;
  className: string;
};

const backgroundColors: BackgroundColor[] = [
  { name: 'White', value: 'off-white', className: 'bg-gray-200' },
  { name: 'Gray', value: 'light gray', className: 'bg-gray-400' },
  { name: 'Blue', value: 'light blue', className: 'bg-blue-300' },
];

const App: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>(backgroundColors[0].value);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (e.g., JPEG, PNG).');
        return;
      }
      setOriginalFile(file);
      resetState(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateClick = useCallback(async () => {
    if (!originalFile) {
      setError("Please upload an image first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const generatedBase64 = await generatePassportPhoto(originalFile, backgroundColor);
      setGeneratedImage(`data:image/png;base64,${generatedBase64}`);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate photo: ${errorMessage}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  }, [originalFile, backgroundColor]);
  
  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'passport-photo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetState = (fullReset: boolean = true) => {
    if (fullReset) {
      setOriginalFile(null);
      setOriginalImagePreview(null);
    }
    setGeneratedImage(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          AI Passport Photo Generator
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          Upload your photo and get a professional passport picture in seconds.
        </p>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Upload and Original Image */}
        <div className="flex flex-col gap-6 p-6 bg-gray-800/50 rounded-2xl border border-gray-700 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-200 border-b border-gray-600 pb-3">1. Upload &amp; Customize</h2>
          {!originalImagePreview ? (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG, or WEBP</p>
              </div>
              <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          ) : (
            <>
              <div className="relative">
                <img src={originalImagePreview} alt="Original upload" className="w-full h-auto rounded-lg object-contain max-h-80" />
                <button onClick={() => resetState()} className="absolute top-2 right-2 p-2 bg-gray-900/70 rounded-full text-gray-300 hover:bg-red-600/80 hover:text-white transition-all duration-200" title="Remove image">
                    <ArrowPathIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Background Color:</label>
                <div className="flex items-center gap-3">
                  {backgroundColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setBackgroundColor(color.value)}
                      className={`w-full flex items-center justify-center p-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                        backgroundColor === color.value
                          ? 'ring-2 ring-blue-500 text-white bg-gray-700/50'
                          : 'text-gray-300 hover:bg-gray-700/50 bg-gray-900/50'
                      }`}
                      title={`Set background to ${color.name}`}
                    >
                       <span className={`w-5 h-5 rounded-full mr-2 border border-gray-500 ${color.className}`}></span>
                       {color.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <button
            onClick={handleGenerateClick}
            disabled={!originalImagePreview || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 mt-auto"
          >
            <SparklesIcon className="w-5 h-5" />
            {isLoading ? 'Generating...' : 'Generate Passport Photo'}
          </button>
        </div>

        {/* Right Column: Result */}
        <div className="flex flex-col gap-6 p-6 bg-gray-800/50 rounded-2xl border border-gray-700 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-200 border-b border-gray-600 pb-3">2. Your Result</h2>
          <div className="flex items-center justify-center w-full h-full min-h-[20rem] bg-gray-900/40 rounded-lg p-4">
            {isLoading && <Loader />}
            {error && !isLoading && (
              <div className="text-center text-red-400">
                <p className="font-semibold">Oops! Something went wrong.</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
            {!isLoading && !error && generatedImage && (
              <div className="flex flex-col items-center gap-4">
                <img src={generatedImage} alt="Generated passport photo" className="max-w-full h-auto rounded-lg shadow-2xl" />
                <button
                  onClick={handleDownload}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                  <DownloadIcon className="w-5 h-5" />
                  Download Photo
                </button>
              </div>
            )}
            {!isLoading && !error && !generatedImage && (
              <div className="text-center text-gray-500">
                <p>Your generated photo will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="w-full max-w-4xl text-center mt-8 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} AI Passport Photo Generator. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;