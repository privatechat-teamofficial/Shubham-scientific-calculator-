# SHUBHAM Scientific & Graphing Calculator

A high-performance Casio ClassWiz FX-style scientific and graphing calculator built with React, TypeScript, Tailwind CSS, KaTeX, and MathJS.

## Features
- **Natural Textbook Display**: Multi-tier fraction rendering, superscripts, radical roots, dynamic parentheses, and real-time cursor navigation.
- **ClassWiz Keypad Layout**: True-to-life Casio layout with golden SHIFT secondary operations, mint ALPHA variable insertion, and large ergonomic D-PAD.
- **S⇔D Fraction & Decimal Toggle**: Seamless conversion between exact fractions/radicals and decimal representations.
- **2D Function Graph Plotter**: Interactive canvas plotting for functions $f(x)$ with zoom, pan, crosshair coordinate inspection, and tabular value generator.
- **AI Camera Math Scanner**: OCR scanner powered by Gemini API to transcribe equations from photos or camera directly into the calculator.
- **Step-by-Step AI Solver**: Detailed mathematical breakdowns for algebraic expressions and calculus.
- **40+ Physical & Scientific Constants**: Universal, atomic, electromagnetic, and physico-chemical constants with one-tap insertion.
- **Scientific Unit Converter**: Length, Mass, Velocity, Pressure, Temperature, and Energy units.

---

## Included in this Package
1. **`SHUBHAM-Calculator.apk`**: Production-ready Android APK (offline installable app).
2. **`src/`**: Full TypeScript and React source codebase including:
   - `src/components/Keypad.tsx`: Casio ClassWiz physical keypad layout
   - `src/components/NaturalDisplay.tsx`: Natural textbook math renderer
   - `src/lib/ast/model.ts`: Mathematical AST cursor navigation and manipulation
   - `src/lib/mathEngine.ts`: High-precision calculation engine
   - `src/components/GraphModal.tsx`: Real-time 2D function visualizer
   - `src/components/CameraScannerModal.tsx`: Math camera OCR tool
   - `src/components/StepSolverModal.tsx`: Step-by-step solver
3. **`public/`**: App icons, logos, SVG assets, and fonts (`Oryno-Bold`, `Oryno-Regular`).
4. **`server.ts`**: Full-stack Express backend with Gemini AI endpoints.
5. **`package.json` & configuration files**: Ready to build or deploy.

---

## Android App Installation (APK)
1. Copy `SHUBHAM-Calculator.apk` to your Android device (or download directly from the calculator Settings menu).
2. Open the `.apk` file using your file manager.
3. If prompted, enable "Install from Unknown Sources" or allow your browser/file manager to install apps.
4. Tap **Install** and launch **SHUBHAM Calculator**.

---

## Running Web App Locally
```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional for AI camera)
cp .env.example .env
# Set GEMINI_API_KEY if using AI scanner

# 3. Start development server
npm run dev
# Server runs on http://localhost:3000
```
