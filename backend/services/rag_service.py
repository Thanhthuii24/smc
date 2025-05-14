from llama_cpp import Llama

model_path = "backend/models/phi2_model.gguf"
llm = Llama(model_path=model_path, n_ctx=2048, n_threads=4)

def query_phi2(prompt: str) -> str:
    output = llm(prompt, max_tokens=256, stop=["</s>"])
    return output["choices"][0]["text"].strip()
