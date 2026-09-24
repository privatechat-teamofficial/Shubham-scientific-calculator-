import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  Loader2, 
  Check, 
  RefreshCw, 
  RotateCcw,
  BookOpen,
  Edit3,
  AlertCircle
} from 'lucide-react';
import katex from 'katex';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToCalculator: (expr: string) => void;
}

interface ScanData {
  transcribed: string;
  latex: string;
  finalAnswer: string;
  steps?: Array<{ stepNumber: number; explanation: string; latex: string }>;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onInsertToCalculator,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'sample'>('camera');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanData | null>(null);
  const [editableEquation, setEditableEquation] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latexResultRef = useRef<HTMLDivElement>(null);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera stream with multi-layer fallback
  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMsg(null);
    setCameraAvailable(true);

    try {
      let media: MediaStream;
      try {
        // Preferred: requested facing mode (back or front)
        media = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch (e1) {
        // Fallback: any video source (desktop webcams without environment tag)
        media = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }

      setStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
      }
    } catch (err: any) {
      console.warn("Camera init failed:", err);
      setCameraAvailable(false);
      setErrorMsg("Camera access is not permitted or unavailable on this device. You can easily upload a photo or use the Quick Test presets below.");
    }
  }, [facingMode, stopCamera]);

  // Initialize camera when opening modal and activeTab === 'camera'
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, capturedImage, startCamera, stopCamera]);

  // Switch facing mode (Front / Back)
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture snapshot from live video
  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setCapturedImage(dataUrl);
      stopCamera();
      processMathImage(dataUrl);
    } catch (err: any) {
      setErrorMsg("Failed to capture photo: " + (err.message || 'Unknown error'));
    }
  };

  // Upload image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
      processMathImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Process math image with Gemini API backend
  const processMathImage = async (base64Img: string) => {
    setIsScanning(true);
    setErrorMsg(null);
    setScanResult(null);

    try {
      const res = await fetch('/api/ai/scan-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Img,
          mimeType: 'image/jpeg',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to scan math equation');
      }

      const data: ScanData = await res.json();
      setScanResult(data);
      setEditableEquation(data.transcribed || '');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error processing math image. You can test a sample or enter the formula manually.');
    } finally {
      setIsScanning(false);
    }
  };

  // Render LaTeX when result changes
  useEffect(() => {
    if (latexResultRef.current && scanResult?.latex) {
      try {
        katex.render(scanResult.latex, latexResultRef.current, {
          throwOnError: false,
          displayMode: true,
        });
      } catch {
        latexResultRef.current.textContent = scanResult.latex;
      }
    }
  }, [scanResult]);

  // Reset capture
  const resetCapture = () => {
    setCapturedImage(null);
    setScanResult(null);
    setEditableEquation('');
    setErrorMsg(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  // Preset sample equations for instant testing
  const PRESET_SAMPLES = [
    {
      title: 'Quadratic Equation',
      expr: '2x^2 - 5x + 2 = 0',
      latex: '2x^2 - 5x + 2 = 0',
      ans: 'x = 2, \\quad x = \\frac{1}{2}',
      steps: [
        { stepNumber: 1, explanation: 'Identify coefficients', latex: 'a = 2, \\; b = -5, \\; c = 2' },
        { stepNumber: 2, explanation: 'Compute discriminant', latex: '\\Delta = b^2 - 4ac = 25 - 16 = 9' },
        { stepNumber: 3, explanation: 'Apply quadratic formula', latex: 'x = \\frac{5 \\pm \\sqrt{9}}{4} = \\frac{5 \\pm 3}{4}' }
      ]
    },
    {
      title: 'Definite Integral',
      expr: 'int(3x^2 + 2x, 0, 2)',
      latex: '\\int_{0}^{2} (3x^2 + 2x) \\, dx',
      ans: '12',
      steps: [
        { stepNumber: 1, explanation: 'Find antiderivative', latex: 'F(x) = x^3 + x^2' },
        { stepNumber: 2, explanation: 'Evaluate bounds [0, 2]', latex: 'F(2) - F(0) = (8 + 4) - 0 = 12' }
      ]
    },
    {
      title: 'Fraction Arithmetic',
      expr: '(3/4 + 1/2) * 8',
      latex: '\\left(\\frac{3}{4} + \\frac{1}{2}\\right) \\times 8',
      ans: '10',
      steps: [
        { stepNumber: 1, explanation: 'Common denominator inside parenthesis', latex: '\\frac{3}{4} + \\frac{2}{4} = \\frac{5}{4}' },
        { stepNumber: 2, explanation: 'Multiply by 8', latex: '\\frac{5}{4} \\times 8 = 10' }
      ]
    },
  ];

  const handleSelectSample = (s: typeof PRESET_SAMPLES[0]) => {
    setCapturedImage('sample');
    setScanResult({
      transcribed: s.expr,
      latex: s.latex,
      finalAnswer: s.ans,
      steps: s.steps,
    });
    setEditableEquation(s.expr);
    setErrorMsg(null);
  };

  const handleInsert = () => {
    const textToInsert = editableEquation.trim() || scanResult?.transcribed || '';
    if (textToInsert) {
      onInsertToCalculator(textToInsert);
    }
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 select-none">
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header with calculator theme */}
        <div className="px-4 py-3 bg-[#121214] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Camera className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-white text-sm sm:text-base font-oryno-bold block leading-tight">
                AI Math Scanner & Solver
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono">
                Scan, solve, or insert equations
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 active:scale-95 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Friendly Top Mode Tabs */}
        <div className="px-3 pt-2.5 pb-1 bg-[#0f0f11] border-b border-neutral-800/80 flex items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('camera'); resetCapture(); }}
            className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'camera'
                ? 'bg-[#1f2937] text-amber-300 border border-amber-500/40 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>

          <button
            onClick={() => { setActiveTab('upload'); resetCapture(); fileInputRef.current?.click(); }}
            className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'upload'
                ? 'bg-[#1f2937] text-amber-300 border border-amber-500/40 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          <button
            onClick={() => { setActiveTab('sample'); resetCapture(); }}
            className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'sample'
                ? 'bg-[#1f2937] text-amber-300 border border-amber-500/40 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 flex flex-col gap-3">
          {/* CAMERA TAB */}
          {activeTab === 'camera' && !capturedImage && (
            <div className="flex flex-col gap-2">
              <div className="relative w-full aspect-4/3 bg-[#000000] rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center shadow-inner">
                {cameraAvailable ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-6 text-center flex flex-col items-center justify-center gap-3">
                    <AlertCircle className="w-10 h-10 text-amber-400" />
                    <p className="text-xs text-neutral-300 max-w-xs">
                      Camera permission unavailable. Please allow camera or upload an image file directly.
                    </p>
                    <button
                      onClick={() => { setActiveTab('upload'); fileInputRef.current?.click(); }}
                      className="px-4 py-2 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all active:scale-95 shadow-xs"
                    >
                      Choose Photo from Device
                    </button>
                  </div>
                )}

                {/* Camera Viewfinder Guides */}
                {cameraAvailable && (
                  <div className="absolute inset-6 border-2 border-dashed border-amber-400/50 rounded-lg pointer-events-none flex flex-col justify-between p-2">
                    <span className="self-center bg-black/70 backdrop-blur-xs text-amber-300 text-[10px] px-2.5 py-0.5 rounded border border-amber-400/30 font-mono">
                      Align equation inside box
                    </span>
                  </div>
                )}

                {/* Camera Controls Overlay */}
                {cameraAvailable && (
                  <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-6 px-4">
                    {/* Switch Camera Button */}
                    <button
                      onClick={toggleFacingMode}
                      title="Switch front / rear camera"
                      className="p-3 rounded-full bg-black/70 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700 transition-all active:scale-95 shadow-md"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>

                    {/* Shutter Button */}
                    <button
                      onClick={capturePhoto}
                      title="Capture Photo"
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 p-1 flex items-center justify-center shadow-lg shadow-amber-500/30 active:scale-95 transition-transform ring-4 ring-amber-300/30"
                    >
                      <div className="w-full h-full rounded-full border-2 border-black/40 bg-amber-400 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-black" strokeWidth={2.5} />
                      </div>
                    </button>

                    {/* Upload File Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload photo from device"
                      className="p-3 rounded-full bg-black/70 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700 transition-all active:scale-95 shadow-md"
                    >
                      <Upload className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* UPLOAD TAB */}
          {activeTab === 'upload' && !capturedImage && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 hover:border-amber-400/70 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-[#121214] hover:bg-[#18181b] transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Upload className="w-7 h-7" />
              </div>
              <div className="text-center">
                <p className="font-bold text-white text-sm">Select or drop a photo here</p>
                <p className="text-xs text-neutral-400 mt-1">Accepts PNG, JPG, JPEG from camera roll or files</p>
              </div>
              <button className="mt-2 px-4 py-2 rounded-lg bg-[#1f2937] hover:bg-[#27272a] text-amber-300 border border-neutral-700 font-bold text-xs">
                Browse Files
              </button>
            </div>
          )}

          {/* HIDDEN FILE INPUT */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* PRESETS TAB */}
          {activeTab === 'sample' && !capturedImage && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
                Quick Test Equations
              </span>
              <div className="grid grid-cols-1 gap-2">
                {PRESET_SAMPLES.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSample(s)}
                    className="p-3 rounded-xl bg-[#141416] hover:bg-[#1c1c20] border border-neutral-800 hover:border-amber-400/50 flex items-center justify-between text-left transition-all active:scale-[0.99]"
                  >
                    <div>
                      <div className="text-xs font-semibold text-amber-400">{s.title}</div>
                      <div className="text-sm font-mono text-white mt-0.5">{s.expr}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#1f2937] text-neutral-300 text-xs font-bold">
                      Test
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PROCESSING & RESULTS VIEW */}
          {capturedImage && (
            <div className="flex flex-col gap-3">
              {/* Snapshot thumbnail */}
              {capturedImage !== 'sample' && (
                <div className="relative w-full max-h-36 rounded-xl overflow-hidden border border-neutral-800 bg-black flex items-center justify-center">
                  <img
                    src={capturedImage}
                    alt="Captured Math"
                    className="w-full h-36 object-contain"
                  />
                  <button
                    onClick={resetCapture}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-black/80 hover:bg-neutral-800 text-xs text-white border border-neutral-700 font-semibold flex items-center gap-1 shadow-sm"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retake</span>
                  </button>
                </div>
              )}

              {/* Loader */}
              {isScanning && (
                <div className="py-8 flex flex-col items-center justify-center gap-3 text-amber-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="font-mono text-xs tracking-wide text-neutral-300">
                    Gemini AI is recognizing mathematical formula...
                  </span>
                </div>
              )}

              {/* Error state */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              {/* Scanned Result */}
              {scanResult && (
                <div className="p-3.5 rounded-xl bg-[#121214] border border-neutral-800 flex flex-col gap-3">
                  {/* Formula Preview Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Recognized Formula
                    </span>
                    <button
                      onClick={resetCapture}
                      className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>New Scan</span>
                    </button>
                  </div>

                  {/* KaTeX preview */}
                  <div
                    ref={latexResultRef}
                    className="p-3 bg-[#0a0a0a] rounded-lg text-white font-mono text-center overflow-x-auto text-lg border border-neutral-800/80 min-h-[44px] flex items-center justify-center"
                  />

                  {/* Editable text field */}
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 block mb-1 flex items-center gap-1">
                      <Edit3 className="w-3 h-3" />
                      Calculator Input (editable):
                    </label>
                    <input
                      type="text"
                      value={editableEquation}
                      onChange={(e) => setEditableEquation(e.target.value)}
                      placeholder="e.g. 2x^2 - 5x + 2 = 0"
                      className="w-full px-3 py-2 rounded-lg bg-[#000000] border border-neutral-700 text-white font-mono text-sm focus:border-amber-400 focus:outline-hidden"
                    />
                  </div>

                  {/* Final Answer */}
                  {scanResult.finalAnswer && (
                    <div className="p-3 bg-[#0f1d13] border border-emerald-600/40 rounded-lg">
                      <div className="text-[11px] uppercase font-bold text-[#61cc70] mb-0.5">
                        Answer / Roots:
                      </div>
                      <div className="text-white font-mono font-bold text-sm">
                        {scanResult.finalAnswer}
                      </div>
                    </div>
                  )}

                  {/* Step-by-step walkthrough if available */}
                  {scanResult.steps && scanResult.steps.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                        Steps:
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {scanResult.steps.map((st) => (
                          <div key={st.stepNumber} className="p-2 rounded-md bg-[#000000] border border-neutral-800/80 text-xs">
                            <span className="font-bold text-amber-400 mr-1.5">Step {st.stepNumber}:</span>
                            <span className="text-neutral-200">{st.explanation}</span>
                            <div className="font-mono text-neutral-300 mt-1 pl-2 border-l border-amber-500/40">
                              {st.latex}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Insert to calculator primary action */}
                  <button
                    onClick={handleInsert}
                    className="w-full py-2.5 rounded-xl bg-[#61cc70] hover:bg-[#50a65c] active:scale-[0.98] text-black font-oryno-bold font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition-all mt-1"
                  >
                    <Check className="w-4 h-4" strokeWidth={3} />
                    <span>Insert into Calculator</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
