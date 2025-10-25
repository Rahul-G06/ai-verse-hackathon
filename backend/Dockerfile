# Use a Python base image, preferably one with CUDA if you plan to use a GPU
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies (like ffmpeg for Whisper)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install Python dependencies
COPY requirements.txt .
# Use a separate step for pip install to take advantage of Docker caching
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Hugging Face Spaces default port is 7860
ENV PORT 7860
EXPOSE $PORT

# Command to run the application using Uvicorn
# The application runs on 0.0.0.0 for external access
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]