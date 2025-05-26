# backend/utils/llm.py
import os
from openai import AzureOpenAI
from dotenv import load_dotenv
load_dotenv()

endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")
deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "model-router")
api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
api_key = os.environ.get("AZURE_OPENAI_API_KEY")

client = AzureOpenAI(
    api_version=api_version,
    azure_endpoint=endpoint,
    api_key=api_key,
)

class LLMResponse:
    def __init__(self, content: str):
        self.content = content

def call_model(prompt: str) -> LLMResponse:
    response = client.chat.completions.create(
        model=deployment,
        messages=[
            {"role": "system", "content": "You are a SQL data engineer assistant."},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
    )
    return LLMResponse(response.choices[0].message.content)