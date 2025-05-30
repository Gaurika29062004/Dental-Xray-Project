from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import shutil
from uuid import uuid4
import pydicom
import numpy as np
import cv2
import base64
import requests
from inference_sdk import InferenceHTTPClient

# Setup FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Roboflow client
roboflow_client = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key="Q3fP6Qol8I8bVYYMBVUD"
)

# OpenRouter API key
OPENROUTER_API_KEY = "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"
# Convert DICOM to image array + base64 string
def dicom_to_image(filepath):
    dcm = pydicom.dcmread(filepath)
    pixel_array = dcm.pixel_array
    img_8bit = cv2.normalize(pixel_array, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    if len(img_8bit.shape) == 2:
        img_8bit = cv2.cvtColor(img_8bit, cv2.COLOR_GRAY2RGB)
    return img_8bit

# Convert OpenCV image to base64 JPEG string
def image_to_base64(image_array):
    _, buffer = cv2.imencode(".jpg", image_array)
    return base64.b64encode(buffer).decode("utf-8")

# Call OpenRouter GPT to generate a report
def call_openrouter_llm(prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "openai/gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": "You are a dental radiologist."},
            {"role": "user", "content": prompt}
        ]
    }
    response = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
    response.raise_for_status()
    report = response.json()["choices"][0]["message"]["content"]

    # Clean the sign-off lines from the generated report
    def remove_sign_off(report_text):
        lines = report_text.strip().split('\n')
        while lines and any(lines[-1].strip().startswith(keyword) for keyword in ["Sincerely","Radiologist:", "[Your Name]", "Dental Radiologist","Patient Name","Date of Exam"]):
            lines.pop()
        return '\n'.join(lines)

    cleaned_report = remove_sign_off(report)
    return cleaned_report

# Annotate image with bounding boxes
def draw_annotations(image, annotations):
    for ann in annotations:
        x, y, w, h = int(ann["x"]), int(ann["y"]), int(ann["width"]), int(ann["height"])
        x1, y1 = x - w // 2, y - h // 2
        x2, y2 = x + w // 2, y + h // 2
        cv2.rectangle(image, (x1, y1), (x2, y2), (0, 0, 255), 2)
        cv2.putText(image, ann["class"], (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
    return image

# Upload endpoint
from fastapi.responses import JSONResponse
import traceback

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        print("✅ Step 1: Received file:", file.filename)

        filename = f"{uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        print("✅ Step 2: Saved file to:", file_path)

        image = dicom_to_image(file_path)
        print("✅ Step 3: DICOM converted")

        temp_img_path = file_path.replace(".dcm", ".jpg")
        cv2.imwrite(temp_img_path, image)
        print("✅ Step 4: Saved temp JPG at:", temp_img_path)

        result = roboflow_client.infer(temp_img_path, model_id="adr/6")
        print("✅ Step 5: Roboflow response:", result)

        annotations = result.get("predictions", [])
        print("✅ Step 6: Annotations:", annotations)

        annotated_image = draw_annotations(image.copy(), annotations)

        prompt = "These are the detected dental conditions from X-ray:\n"
        for ann in annotations:
            prompt += f"- {ann['class']} at (x={ann['x']}, y={ann['y']}, w={ann['width']}, h={ann['height']})\n"
        prompt += "\nPlease write a diagnostic report."

        print("✅ Step 7: Prompt constructed")
        report = call_openrouter_llm(prompt)
        print("✅ Step 8: LLM response:", report)

        return JSONResponse(content={
            "annotated_image": image_to_base64(annotated_image),
            "report": report.strip()
        })

    except Exception as e:
        print("❌ ERROR during upload:\n", traceback.format_exc())
        return JSONResponse(status_code=500, content={"message": f"Upload failed: {str(e)}"})

# Root check
@app.get("/")
def root():
    return {"message": "Backend is running"}
