FROM mcr.microsoft.com/playwright:v1.44.0-focal

WORKDIR /app

# 1. Prevent unexpected UI dialogue halts during base packages
ENV DEBIAN_FRONTEND=noninteractive

# 2. Keep the OS base updated and include font utilities cleanly
RUN apt-get update && \
    apt-get install -y --no-install-recommends fontconfig && \
    rm -rf /var/lib/apt/lists/*

# 3. Handle project dependencies efficiently
COPY package*.json ./
RUN npm ci

# 4. Install Playwright browser binaries and system level dependencies
RUN npx playwright install --with-deps

# 5. Copy the rest of your testing codebase
COPY . .

# 6. Execute tests using the standard array syntax (best practice)
CMD ["npx", "playwright", "test"]
