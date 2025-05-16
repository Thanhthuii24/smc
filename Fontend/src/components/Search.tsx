import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Header from "./Header";

interface VoiceSearchResult {
  transcribed_text: string;
  llm_response: string;
  audio_response: string;
}

interface Suggestions {
  [word: string]: string[];
}

const VoiceSearch: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [canPlayAudio, setCanPlayAudio] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check when audio is ready to play
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => setCanPlayAudio(true);
    const handleError = () => setError("Unable to load response audio.");

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, [result]);

  // Attempt autoplay when audio is ready, with fallback
  useEffect(() => {
    if (result?.audio_response && audioRef.current && canPlayAudio) {
      audioRef.current.play().catch((err) => {
        if (err.name === "NotAllowedError") {
          setError("Autoplay blocked by browser. Please press play to listen.");
        } else {
          setError("Unable to auto-play audio: " + err.message);
        }
      });
    }
  }, [result, canPlayAudio]);

  // Cancel axios request and stop recording when component unmounts
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        sourceRef.current.abort();
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Automatically fetch product suggestions when transcribed_text is available
  useEffect(() => {
    if (result?.transcribed_text) {
      fetchSuggestions(result.transcribed_text);
    }
  }, [result]);

  const fetchSuggestions = async (product: string) => {
    if (!product.trim()) {
      setError("No text available for suggestions.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/suggest/${encodeURIComponent(product)}`
      );
      console.log("Product suggestions:", response.data);
      setSuggestions(response.data || {});
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to fetch product suggestions. Please try again."
      );
      setSuggestions({});
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        await sendAudioToServer(audioBlob, "recording.wav");
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
      setResult(null);
      setCanPlayAudio(false);
      setSuggestions({});
    } catch (err: any) {
      setError("Unable to access microphone: " + err.message);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sendAudioToServer = async (
    audioBlob: Blob,
    filename: string,
    retries = 2
  ) => {
    setLoading(true);
    setError(null);
    sourceRef.current = new AbortController();

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, filename);

        const response = await axios.post(
          "http://127.0.0.1:8000/voice_search/",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 100000,
            signal: sourceRef.current.signal,
          }
        );

        if (
          response.data.transcribed_text &&
          response.data.llm_response &&
          response.data.audio_response
        ) {
          setResult(response.data);
          return;
        } else {
          throw new Error("Invalid response format from server");
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;

        if (attempt < retries && err.code === "ECONNABORTED") {
          console.warn(`Retry ${attempt + 1} after timeout`);
          continue;
        }

        setError(
          err.response?.data?.detail ||
            err.message ||
            "Unable to process audio file. Possible server error or invalid file."
        );
        break;
      } finally {
        setLoading(false);
      }
    }
  };

  const resetResults = async () => {
    if (result?.audio_response) {
      try {
        await axios.delete(
          `http://127.0.0.1:8000/audio/${result.audio_response}`
        );
        console.log(`Deleted audio file: output_${result.audio_response}.wav`);
      } catch (err: any) {
        setError("Unable to delete audio file: " + err.message);
      }
    }

    setResult(null);
    setError(null);
    setCanPlayAudio(false);
    setSuggestions({});
  };

  const playAudioManually = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .catch((err) => setError("Unable to play audio: " + err.message));
    }
  };

  const handleBackClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (result?.audio_response) {
      try {
        await axios.delete(
          `http://127.0.0.1:8000/audio/${result.audio_response}`
        );
        console.log(`Deleted audio file: output_${result.audio_response}.wav`);
      } catch (err: any) {
        setError("Unable to delete audio file: " + err.message);
      }
    }

    window.history.back();
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />
      <main
        className="flex-grow-1 d-flex flex-column align-items-center py-4"
        style={{ overflowY: "auto" }}
      >
        <div
          className="card shadow"
          style={{ maxWidth: "800px", width: "100%" }}
        >
          <div className="card-body text-center">
            <h2 className="mb-4">Voice Product Search</h2>

            {/* Microphone Button */}
            <div className="mb-3">
              <button
                className={`btn ${
                  isRecording ? "btn-danger" : "btn-primary"
                } rounded-circle p-3`}
                onClick={handleMicClick}
                disabled={loading}
                style={{ width: "60px", height: "60px" }}
                title={isRecording ? "Stop Recording" : "Start Recording"}
              >
                <i
                  className={`fas fa-microphone ${
                    isRecording ? "fa-stop" : ""
                  }`}
                ></i>
              </button>
            </div>

            {/* Error Message */}
            {error && <p className="text-danger mt-3">{error}</p>}

            {/* Loading State */}
            {loading && (
              <div className="mt-3">
                <div className="spinner-border" role="status"></div>
                <p>Processing, please wait...</p>
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <div className="mt-3 text-start">
                <h5>Results:</h5>
                <p>
                  <strong>Transcribed Text:</strong> {result.transcribed_text}
                </p>
                <p>
                  <strong>LLM Response:</strong> {result.llm_response}
                </p>
                <div>
                  <strong>Audio Response:</strong>
                  <audio
                    ref={audioRef}
                    controls
                    src={
                      result.audio_response
                        ? `http://127.0.0.1:8000/audio/${result.audio_response}`
                        : undefined
                    }
                    className="mt-2 w-100"
                    onError={() =>
                      setError(
                        "Unable to load response audio. Please try again."
                      )
                    }
                  />
                  {result.audio_response && (
                    <button
                      className="btn btn-primary mt-2"
                      onClick={playAudioManually}
                      disabled={!canPlayAudio}
                    >
                      Play Audio
                    </button>
                  )}
                </div>

                {Object.keys(suggestions).length > 0 && (
                  <div className="mt-3">
                    <strong>Product Suggestions:</strong>
                    {Object.entries(suggestions).map(([word, products]) => (
                      <div key={word}>
                        <p className="mt-2 mb-1">
                          <strong>Word "{word}":</strong>
                        </p>
                        {products.length > 0 ? (
                          <ul>
                            {products.map((product, index) => (
                              <li key={index}>{product}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>No suggestions for this word.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className="btn btn-outline-secondary mt-3"
                  onClick={resetResults}
                >
                  Clear Results
                </button>
              </div>
            )}

            {!result && !loading && !error && (
              <p className="text-center mt-3">No results</p>
            )}

            {/* Back Button */}
            <a
              href="#"
              className="btn btn-secondary mt-3"
              onClick={handleBackClick}
            >
              Back
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VoiceSearch;
