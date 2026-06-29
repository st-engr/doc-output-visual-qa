# Automated PDF Output Validation & Visual QA Pipeline

This repository contains an enterprise-ready, proof-of-concept (POC) visual regression testing framework designed to validate automated PDF invoice generation. The architecture intercepts document download streams directly in memory, converts the binary data into high-resolution images, and executes pixel-by-pixel assertions against version-controlled baselines.

The framework is built using a highly scalable, decoupled architecture implementing custom utility abstraction and the **Page Object Model (POM)**. By containerizing the entire runtime, the suite completely eliminates environment drift, ensuring identical test execution across local workstations and CI/CD runners.

---

## 🎯 The Core Problem & Our Engineering Approach

### The Testing Challenge
Validating generated PDF files in a continuous integration pipeline introduces two primary technical bottlenecks:
1. **Headless Browser PDF Limitations**: Headless browser environments struggle to render complex vector PDF binaries natively without introducing heavy virtual desktop display layers (like `xvfb`). Treating PDFs as standard browser URLs frequently triggers unexpected download prompts or empty page freezes.
2. **The Visual Masking Limitation**: Financial documents output volatile real-time data like auto-generated timestamps. Even if opened in a browser tab, Chrome renders PDFs inside a closed-source shadow extension container, stripping away all HTML elements and DOM tags [INDEX]. Because the document becomes a flat, unreadable graphical canvas to Playwright, standard selector-based visual masking is completely impossible [INDEX], turning minor date changes into false-positive failures.

### Our Solution & Framework Architecture
Instead of relying on fragile pixel-coordinate masking overrides—which break the moment layouts scale or shift—this framework enforces stability, maintainability, and execution speed at both ends of the test lifecycle through three core engineering pillars:

*   **Network Resource Blocking (Throughput Optimization)**: To accelerate execution and eliminate external flakiness, a centralized `NetworkHelper` utilizes Playwright's `page.route()` to block heavy third-party assets (images, ads, fonts, tracking pixels) before they load, cutting down test suite execution times.
*   **Encapsulated Page Object Models (POM)**: All UI selectors, form entries, and widget interactions are isolated inside the `InvoicePage` class. The test script drives the application's native datepicker widget through this clean interface, enforcing **Upstream Data Determinism** by freezing the invoice date *prior* to file generation.
*   **In-Memory Rasterization**: The suite bypasses browser plugin rendering issues completely by converting the downloaded PDF file straight into an image buffer. We use `pdf-img-convert` to unpack vector sheets into a standardized `1200px` flat pixel map inside Node.js memory space for strict asset comparison.

---

## 📂 Project Structure

```text
├── .github/workflows/
│   └── playwright.yml       # Automated GitHub Actions CI/CD Pipeline
├── artifacts/               # Ephemeral local folder for download interception [IGNORED]
├── playwright-report/       # Interactive HTML visual comparison UI [IGNORED]
├── test-results/            # Visual diff pixel map generation tracks [IGNORED]
├── tests/
│   ├── __snapshots__/       # Version-controlled baseline layout sources of truth
│   ├── document-datasets.ts # Schema structures and matrix test datasets
│   ├── helpers/
│   │   ├── network-helper.ts # Abstraction for resource blocking and asset filtering
│   │   └── pdf-handler.ts    # Interception buffers and binary-to-image converters
│   ├── page-object-models/
│   │   └── invoice-page.ts   # Encapsulated UI selectors and form entry logic (POM)
│   └── pdf-output-validation.spec.ts  # Clean, readable data-driven test orchestrator
├── .gitignore               # Workspace hygiene rules
├── Dockerfile               # Multi-stage Linux environment compiler map
└── docker-compose.yml       # Host-agnostic test orchestration manifest
```

---

## ⚠️ Architectural Trade-offs & Production Warnings

### The C++ Compilation Dependency
Be aware that `pdf-img-convert` relies internally on `node-canvas`, which requires native C++ libraries (`libcairo2`, `pango`, etc.) to build via `node-gyp`. 
*   **The Solution**: We utilize a **Multi-Stage Dockerfile**. The heavy compilation utilities are isolated inside a temporary `builder` stage. The final execution stage simply copies the compiled node binaries, keeping the production test runner lightweight and free of unnecessary build tools.

### The Zero-Tolerance Constraint (`maxDiffPixels: 0`)
For this POC project, the snapshot matching parameters are set to a strict zero-tolerance model to easily demonstrate how the suite catches character edits (like changing an invoice field string):
```typescript
expect(firstPageImageBuffer).toMatchSnapshot({
    maxDiffPixelRatio: 0,
    maxDiffPixels: 0
});
```
*   **Real-World Reality Check**: In a live enterprise production pipeline, **absolute zero-tolerance is an anti-pattern**. Microscopic shifts in font anti-aliasing or sub-pixel smoothing can occur if your cloud provider changes your runner's underlying CPU architecture (e.g., shifting an AWS instance from Intel to AMD).
*   **Production Recommendation**: Real-world AQA teams should adjust these variables to allow a razor-thin pixel safety margin (e.g., `threshold: 0.2` to ignore gray text halos and `maxDiffPixelRatio: 0.005` to absorb sub-pixel rendering noise).

---

## 🏁 Quick Start & Local Commands

### Prerequisites
*   [Docker Desktop](https://docker.com) installed on your machine.
*   Node.js (v20+) installed locally (purely to provide IDE code autocomplete).

### 1. Synchronize IDE Typing Definitions
Because the PDF converter builds native C++ code, running a standard `npm install` on a local Windows host will fail without local C++ compilers. To clear the package warnings out of your IDE (like VS Code) without breaking your host machine, install the types by ignoring installation scripts:
```powershell
npm install pdf-img-convert --ignore-scripts
```

### 2. Compile the Containerized Sandbox
Build the multi-stage Linux environment. This installs your software dependencies and compiles the native binaries cleanly inside Docker:
```powershell
docker-compose build --no-cache document-tests
```

### 3. Record Baseline Layouts (Snapshots)
Run the pipeline with the update flag to populate the version-controlled `tests/__snapshots__/` directory with your visual layout anchors:
```powershell
docker-compose run --entrypoint "npx playwright test --update-snapshots" document-tests
```

### 4. Execute the Regression Tests
Run strict regression matching passes against your current application state:
```powershell
docker-compose run document-tests npx playwright test
```

### 5. On-Demand Containerized UI Mode (Interactive Debugging)
To visually debug layout mismatches, inspect the DOM tree, or build new data-driven test matrices without compiling native C++ packages on your Windows workstation, you can serve the Playwright UI dashboard directly out of the Linux container sandbox over your local network:

```powershell
docker-compose run --service-ports -e CI=false document-tests npm run test:ui
```

#### Verification Steps:
1. **Network Tunneling**: The `--service-ports` flag maps container port `8080` directly to your local host. The `-e CI=false` variable temporarily deactivates automated production mode to allow the graphical application engine to initialize.
2. **Accessing the Dashboard**: Open any web browser on your host machine and navigate to `http://localhost:8080`.
3. **Friction-Free DX**: This isolated UI layer gives local developers full access to execution traces, timeline replays, and visual image diffs completely on-demand, leaving our primary automated CI/CD pipeline lightweight and lightning-fast.

---

## 🔄 CI/CD Automation (GitHub Actions)

The repository includes a ready-to-use cloud pipeline blueprint (`.github/workflows/playwright.yml`). On every code push or pull request, the workflow spins up a fresh runner, builds your container environment, and triggers the test execution loop.

### Fail-Safe Artifact Triage
If a layout breaks or text shifts unexpectedly:
1. The containerized process exits with a failure code, turning the GitHub run red.
2. A conditional runner hook triggers to compress and archive the local `playwright-report/` folder.
3. You can download this zip archive straight from the GitHub run dashboard, open `index.html` locally, and use the **Interactive Slider Tool** to inspect the exact pixel mismatch.

---

## 🧹 Housekeeping
To wipe out stale background network structures and clear orphaned containers between testing cycles, execute:
```powershell
docker-compose down --remove-orphans
```
