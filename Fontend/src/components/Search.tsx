import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

interface VoiceSearchResult {
  transcribed_text: string;
  llm_response: string;
  audio_response: string;
}

interface Suggestions {
  [word: string]: string[];
}

const Search: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [canPlayAudio, setCanPlayAudio] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<AbortController | null>(null);

  // Kiểm tra khi audio sẵn sàng phát
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => setCanPlayAudio(true);
    const handleError = () => setError("Không thể tải âm thanh phản hồi.");

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, [result]);

  // Thử autoplay khi audio sẵn sàng, với fallback
  useEffect(() => {
    if (result?.audio_response && audioRef.current && canPlayAudio) {
      audioRef.current.play().catch((err) => {
        if (err.name === "NotAllowedError") {
          setError(
            "Autoplay bị chặn bởi trình duyệt. Vui lòng nhấn nút phát để nghe."
          );
        } else {
          setError("Không thể tự động phát âm thanh: " + err.message);
        }
      });
    }
  }, [result, canPlayAudio]);

  // Hủy yêu cầu axios khi component unmount
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        sourceRef.current.abort();
      }
    };
  }, []);

  // Tự động lấy gợi ý sản phẩm khi có transcribed_text
  useEffect(() => {
    if (result?.transcribed_text) {
      fetchSuggestions(result.transcribed_text);
    }
  }, [result]);

  const fetchSuggestions = async (product: string) => {
    if (!product.trim()) {
      setError("Không có văn bản để lấy gợi ý.");
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
          "Không thể lấy gợi ý sản phẩm. Vui lòng thử lại."
      );
      setSuggestions({});
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      if (
        selectedFile.type === "audio/wav" &&
        selectedFile.size <= 10 * 1024 * 1024
      ) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
        setCanPlayAudio(false);
        setSuggestions({});
      } else {
        setFile(null);
        setError(
          selectedFile.type !== "audio/wav"
            ? "Vui lòng chọn file định dạng .wav"
            : "File quá lớn (tối đa 10MB)."
        );
      }
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
          throw new Error("Phản hồi từ server không đúng định dạng");
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
            "Không thể xử lý file âm thanh. Có thể do lỗi server hoặc file không hợp lệ."
        );
        break;
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError("Vui lòng chọn file .wav trước khi tải lên");
      return;
    }
    await sendAudioToServer(file, file.name);
  };

  const resetResults = () => {
    setResult(null);
    setError(null);
    setFile(null);
    setCanPlayAudio(false);
    setSuggestions({});
  };

  const playAudioManually = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .catch((err) => setError("Không thể phát âm thanh: " + err.message));
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
        setError("Không thể xóa file âm thanh: " + err.message);
      }
    }
    window.history.back();
  };

  return (
    <div className="vh-100 bg-light d-flex justify-content-center align-items-center">
      <div className="card w-75 shadow">
        <div className="card-body text-center">
          <h2 className="mb-4">Tìm kiếm sản phẩm bằng giọng nói</h2>
          {/* File Upload */}
          <div className="mb-3">
            <input
              type="file"
              className="form-control mb-2"
              accept="audio/wav"
              onChange={handleFileChange}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={handleFileUpload}
              disabled={!file || loading}
            >
              Tải lên và xử lý
            </button>
          </div>
          {/* Error Message */}
          {error && <p className="text-danger mt-3">{error}</p>}
          {/* Loading State */}
          {loading && (
            <div className="mt-3">
              <div className="spinner-border" role="status"></div>
              <p>Đang xử lý, vui lòng đợi...</p>
            </div>
          )}
          {/* Results */}
          {result && !loading && (
            <div className="mt-3 text-start">
              <h5>Kết quả:</h5>
              <p>
                <strong>Text từ giọng nói:</strong> {result.transcribed_text}
              </p>
              <p>
                <strong>Phản hồi từ LLM:</strong> {result.llm_response}
              </p>
              <div>
                <strong>Âm thanh phản hồi:</strong>
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
                      "Không thể tải âm thanh phản hồi. Vui lòng thử lại."
                    )
                  }
                />
                {result.audio_response && (
                  <button
                    className="btn btn-primary mt-2"
                    onClick={playAudioManually}
                    disabled={!canPlayAudio}
                  >
                    Phát âm thanh
                  </button>
                )}
              </div>
              {Object.keys(suggestions).length > 0 && (
                <div className="mt-3">
                  <strong>Gợi ý sản phẩm:</strong>
                  {Object.entries(suggestions).map(([word, products]) => (
                    <div key={word}>
                      <p className="mt-2 mb-1">
                        <strong>Từ "{word}":</strong>
                      </p>
                      {products.length > 0 ? (
                        <ul>
                          {products.map((product, index) => (
                            <li key={index}>{product}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>Không có gợi ý cho từ này.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button
                className="btn btn-outline-secondary mt-3"
                onClick={resetResults}
              >
                Xóa kết quả
              </button>
            </div>
          )}
          {!result && !loading && !error && (
            <p className="text-center mt-3">Không có kết quả</p>
          )}
          {/* Back Button */}
          <a
            href="#"
            className="btn btn-secondary mt-3"
            onClick={handleBackClick}
          >
            Quay lại
          </a>
        </div>
      </div>
    </div>
  );
};

export default Search;
