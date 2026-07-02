# Automated PDF Output Validation & Visual QA Pipeline

This repository contains a small Playwright-based test suite for validating invoice PDF output. The tests fill in invoice data, download the generated PDF, convert it to an image buffer, and compare it to stored snapshots.

## Test Environment & Configuration

The suite targets [invoice-generator.com](https://invoice-generator.com/), a public invoice PDF generator used here as the application under test.

- Local execution uses Docker via `docker-compose`.
- CI execution uses the workflow in [.github/workflows/playwright.yml](.github/workflows/playwright.yml).
- There is no separate staging environment in this repository; tests run directly against the live public site.
- The base URL is set in [playwright.config.ts](playwright.config.ts) through the `BASE_URL` environment variable, with a default of `https://invoice-generator.com`. The variable name is documented in [.env.example](.env.example).
- Test data is defined statically in [tests/document-datasets.ts](tests/document-datasets.ts). No external data source or reset step is required for these runs.
- The runtime is intentionally narrow: headless Chromium, viewport `1280x1440`, GPU disabled, and device scale factor locked to `1` for consistent screenshots.

## Project Structure

```text
├── .github/workflows/
│   └── playwright.yml
├── tests/
│   ├── __snapshots__/
│   ├── document-datasets.ts
│   ├── support/
│   │   ├── helpers/
│   │   │   ├── network-helper.ts
│   │   │   └── pdf-handler.ts
│   │   └── page-object-models/
│   │       └── invoice-page.ts
│   └── pdf-output-validation.spec.ts
├── Dockerfile
├── docker-compose.yml
├── playwright.config.ts
└── .env.example
```

## Running the Tests

Prerequisites:
- Docker Desktop
- Node.js (optional, mainly for editor support)

Useful commands:

```powershell
# Build and run the test container
npm run test:docker

# Run the test suite directly inside the container
docker-compose run document-tests npx playwright test

# Update snapshots
docker-compose run --entrypoint "npx playwright test --update-snapshots" document-tests

# Open the Playwright UI inside the container
docker-compose run --service-ports -e CI=false document-tests npm run test:ui
```

## Notes

The PDF conversion step depends on native image libraries used by `pdf-img-convert`. The Docker-based workflow is the supported path because it keeps the runtime consistent across machines and CI.
