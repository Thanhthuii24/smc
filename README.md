# Voice_Interaction_SSC
Ứng dụng cho đề tài AI on Edge for Retail
+ Sử dụng 3 models : STT --> LLM+RAG --> TTS
Các chức năng chính của hệ thống Smart Shopping Cart with Voice Interaction
+ Tìm vị trí sản phẩm theo giọng nói 
+ Gợi ý sản phẩm liên quan
+ Tặng voucher ngữ cảnh

Recommend : 
         + Giao tiếp tự nhiên với giọng nói
         + Offline hoàn toàn (Edge AI) - không cần Internet, xử lí local bằng Phi-2, Whisper,FAISS

Cấu trúc file và giải thích cho từng folder
 ```
── backend/
   ├── api/
   │   ├── routes.py         # Định nghĩa các endpoint REST API
   │   └── schemas.py        # Khai báo dữ liệu đầu vào API bằng Pydantic
   ├── config/
   │   └── config.yaml       # File cấu hình hệ thống (cổng, thư mục model...)
   ├── data/
   │   ├── excel/
   │   │   ├── location.xlsx     # File dữ liệu vị trí sản phẩm
   │   │   └── voucher.xlsx      # File dữ liệu voucher
   │   └── location.db       # SQLite DB sinh ra từ Excel
   ├── models/
   │   ├── vector_store/     # Vector từ dữ liệu cho RAG
   │   └── phi2_model.gguf   # Mô hình LLM phi-2 định dạng GGUF (sử dụng llama.cpp)
   ├── services/
   │   ├── __init__.py
   │   ├── location.py       # Xử lý chuyển file Excel sang SQLite và tìm vị trí sản phẩm
   │   ├── voucher_engine.py # Truy vấn voucher từ dữ liệu đã sync
   │   ├── rag_service.py    # Giao tiếp với mô hình phi-2 và vector store
   │   ├── stt_service.py    # Nhận giọng nói và chuyển thành text (Whisper)   
   │   ├── tts_service.py    # Chuyển văn bản thành giọng nói (Coqui TTS)
   │   └── recommender.py    # Gợi ý sản phẩm dựa trên input (placeholder cho future)
   ├── main.py               # Khởi chạy FastAPI backend, đồng bộ dữ liệu ban đầu
   └── requirements.txt      # Danh sách thư viện cần cài

 ```
Thêm folder     ```models    ``` vào    ```backend   ```
có dạng như sau
  ```

 models/
   │   ├── vector_store/     # Vector từ dữ liệu cho RAG
   │   └── phi2_model.gguf

   ```
phi2_model lấy từ link 

 https://huggingface.co/TheBloke/phi-2-GGUF/blob/main/phi-2.Q4_K_M.gguf

đổi tên thành    ``` phi2_model.gguf   ``` và đưa vào folder    ```models   ```