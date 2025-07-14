FROM python:3.10-slim

# Tạo thư mục làm việc
WORKDIR /opt/program

# Cài dependency hệ thống cần thiết (cho numpy, pandas, keras, v.v.)
RUN apt-get update && apt-get install -y \
    build-essential \
    libglib2.0-0 libsm6 libxext6 libxrender-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY docker/requirements.txt .

# Cài pip và các gói cần thiết
RUN pip install --upgrade pip && \
    pip install --prefer-binary --no-cache-dir \
    --default-timeout=100 --retries=10 \
    -i https://pypi.org/simple \
    -r requirements.txt

# Copy các custom modules cần thiết
COPY docker/modules/ ./modules/

ENV PYTHONPATH="/opt/program:${PYTHONPATH}"
