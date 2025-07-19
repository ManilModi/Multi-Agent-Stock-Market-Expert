FROM apache/airflow:2.9.1-python3.11

USER root

# Install OS-level dependencies required for common Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    git \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER airflow

# Copy and install Python dependencies
COPY requirements.txt .

# Install pipdeptree for debug (optional)
RUN pip install pipdeptree
RUN pipdeptree

# Install your actual dependencies
RUN pip install --no-cache-dir -r requirements.txt
