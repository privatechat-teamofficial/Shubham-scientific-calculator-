import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RefreshCw, Crosshair, Table as TableIcon, LineChart } from 'lucide-react';
import * as math from 'mathjs';

interface GraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFunction?: string;
}

export const GraphModal: React.FC<GraphModalProps> = ({
  isOpen,
  onClose,
  initialFunction = 'x^2 - 3*x + 1',
}) => {
  const [fnStr, setFnStr] = useState(initialFunction);
  const [activeTab, setActiveTab] = useState<'plot' | 'table'>('plot');
  const [scale, setScale] = useState(40); // pixels per unit
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // center offset in pixels
  const [cursorCoord, setCursorCoord] = useState<{ x: number; y: number } | null>(null);
  
  // Table state
  const [tableRange, setTableRange] = useState({ start: -5, end: 5, step: 1 });
  const [tableData, setTableData] = useState<Array<{ x: number; y: number | null }>>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Update fnStr if initialFunction changes when opening
  useEffect(() => {
    if (initialFunction && initialFunction.includes('x')) {
      setFnStr(initialFunction);
    }
  }, [initialFunction, isOpen]);

  // Compute table data
  useEffect(() => {
    try {
      const compiled = math.compile(fnStr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-'));
      const rows: Array<{ x: number; y: number | null }> = [];
      const step = tableRange.step <= 0 ? 1 : tableRange.step;
      for (let x = tableRange.start; x <= tableRange.end + 1e-9; x += step) {
        try {
          const val = compiled.evaluate({ x, pi: Math.PI, e: Math.E });
          const num = typeof val === 'number' ? val : (val?.toNumber ? val.toNumber() : null);
          rows.push({ x: Number(x.toFixed(4)), y: num !== null && isFinite(num) ? Number(num.toFixed(4)) : null });
        } catch {
          rows.push({ x: Number(x.toFixed(4)), y: null });
        }
      }
      setTableData(rows);
    } catch {
      setTableData([]);
    }
  }, [fnStr, tableRange]);

  // Draw plot on canvas
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Deep matte black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const originX = width / 2 + offset.x;
    const originY = height / 2 + offset.y;

    // Grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#18181b';
    ctx.fillStyle = '#71717a';
    ctx.font = '10px monospace';

    // Vertical grid lines
    const startX = Math.floor(-originX / scale);
    const endX = Math.ceil((width - originX) / scale);
    for (let i = startX; i <= endX; i++) {
      const gx = originX + i * scale;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();

      if (i !== 0 && Math.abs(i) % Math.ceil(40 / scale) === 0) {
        ctx.fillText(i.toString(), gx + 2, originY - 4);
      }
    }

    // Horizontal grid lines
    const startY = Math.floor((originY - height) / scale);
    const endY = Math.ceil(originY / scale);
    for (let j = startY; j <= endY; j++) {
      const gy = originY - j * scale;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();

      if (j !== 0 && Math.abs(j) % Math.ceil(40 / scale) === 0) {
        ctx.fillText(j.toString(), originX + 4, gy - 2);
      }
    }

    // Main Axes
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1.8;
    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();
    // Y Axis
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Plot Function f(x) with radiant ClassWiz Golden Amber curve
    try {
      const cleanExpr = fnStr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
      const compiled = math.compile(cleanExpr);

      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#f59e0b'; // Amber Gold
      ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';
      ctx.shadowBlur = 6;

      let isDrawing = false;
      const stepPixels = 2;

      for (let px = 0; px <= width; px += stepPixels) {
        const mathX = (px - originX) / scale;
        try {
          const val = compiled.evaluate({ x: mathX, pi: Math.PI, e: Math.E });
          const mathY = typeof val === 'number' ? val : (val?.toNumber ? val.toNumber() : NaN);

          if (!isNaN(mathY) && isFinite(mathY)) {
            const py = originY - mathY * scale;
            if (!isDrawing) {
              ctx.moveTo(px, py);
              isDrawing = true;
            } else {
              // Discontinuity check
              if (Math.abs(py - originY) > height * 4) {
                isDrawing = false;
              } else {
                ctx.lineTo(px, py);
              }
            }
          } else {
            isDrawing = false;
          }
        } catch {
          isDrawing = false;
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    } catch {
      // Incomplete or invalid formula while typing
    }
  }, [fnStr, scale, offset]);

  // Handle resize & redrawing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.parentElement?.clientWidth || 400;
        canvas.height = canvas.parentElement?.clientHeight || 340;
        drawGraph();
      }
    };
    if (isOpen && activeTab === 'plot') {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, activeTab, drawGraph]);

  // Redraw when plot settings change
  useEffect(() => {
    if (activeTab === 'plot') {
      drawGraph();
    }
  }, [drawGraph, activeTab]);

  // Mouse / Touch Drag handlers for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const originX = canvas.width / 2 + offset.x;
    const originY = canvas.height / 2 + offset.y;
    const calcX = Number(((mouseX - originX) / scale).toFixed(2));
    const calcY = Number(((originY - mouseY) / scale).toFixed(2));
    setCursorCoord({ x: calcX, y: calcY });

    if (isDraggingRef.current) {
      setOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const PRESET_FUNCS = [
    { label: 'x²', val: 'x^2 - 3*x + 1' },
    { label: 'sin(x)', val: 'sin(x)' },
    { label: 'cos(x)', val: 'cos(x)' },
    { label: '1/x', val: '1/x' },
    { label: 'eˣ', val: 'e^x' },
    { label: '|x|', val: 'abs(x)' },
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#121214] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <LineChart className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-white text-base font-oryno-bold block leading-tight">
                2D Graph Plotter & Table
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono">
                Real-time function visualizer
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 active:scale-95 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Function input bar */}
        <div className="p-3 bg-[#0f0f11] border-b border-neutral-800 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-mono font-bold text-sm shrink-0">f(x) =</span>
            <input
              type="text"
              value={fnStr}
              onChange={(e) => setFnStr(e.target.value)}
              placeholder="e.g. x^2 - 4 or sin(x)"
              className="flex-1 bg-[#000000] border border-neutral-700 text-white font-mono text-sm px-3 py-1.5 rounded-lg focus:outline-hidden focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
            <span className="text-[10px] text-neutral-500 font-bold uppercase shrink-0">Presets:</span>
            {PRESET_FUNCS.map((p) => (
              <button
                key={p.label}
                onClick={() => setFnStr(p.val)}
                className="px-2 py-0.5 rounded-md bg-[#18181b] hover:bg-[#27272a] text-neutral-300 hover:text-amber-300 border border-neutral-800 text-[11px] font-mono transition-colors shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab switcher & Zoom controls */}
        <div className="px-3 py-2 bg-[#121214] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('plot')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'plot'
                  ? 'bg-[#1f2937] text-amber-300 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Plot Graph
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'table'
                  ? 'bg-[#1f2937] text-amber-300 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Value Table</span>
            </button>
          </div>

          {activeTab === 'plot' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setScale((s) => Math.min(s * 1.3, 200))}
                title="Zoom In"
                className="p-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-neutral-200 border border-neutral-800 active:scale-95 transition-all"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setScale((s) => Math.max(s / 1.3, 10))}
                title="Zoom Out"
                className="p-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-neutral-200 border border-neutral-800 active:scale-95 transition-all"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setScale(40); setOffset({ x: 0, y: 0 }); }}
                title="Reset View"
                className="p-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-neutral-200 border border-neutral-800 active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {activeTab === 'plot' ? (
            <div className="relative w-full h-[360px] bg-[#000000] select-none cursor-crosshair">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full h-full block"
              />
              {/* Bottom stats probe */}
              {cursorCoord && (
                <div className="absolute bottom-2 left-2 bg-[#121214]/90 border border-neutral-800 px-2.5 py-1 rounded-md text-xs font-mono text-amber-300 flex items-center gap-2 shadow-lg backdrop-blur-xs">
                  <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                  <span>X: {cursorCoord.x}</span>
                  <span>Y: {cursorCoord.y}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 p-4 overflow-y-auto max-h-[360px] bg-[#0c0c0e]">
              {/* Table Range Controls */}
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <label className="text-neutral-400 block mb-1">Start X:</label>
                  <input
                    type="number"
                    value={tableRange.start}
                    onChange={(e) => setTableRange({ ...tableRange, start: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#000000] border border-neutral-800 rounded px-2 py-1 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">End X:</label>
                  <input
                    type="number"
                    value={tableRange.end}
                    onChange={(e) => setTableRange({ ...tableRange, end: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#000000] border border-neutral-800 rounded px-2 py-1 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Step:</label>
                  <input
                    type="number"
                    value={tableRange.step}
                    step="0.5"
                    min="0.1"
                    onChange={(e) => setTableRange({ ...tableRange, step: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-[#000000] border border-neutral-800 rounded px-2 py-1 text-white font-mono"
                  />
                </div>
              </div>

              {/* Data Table */}
              <table className="w-full text-xs font-mono border-collapse border border-neutral-800">
                <thead>
                  <tr className="bg-[#18181b] text-neutral-300">
                    <th className="border border-neutral-800 p-2 text-left">x</th>
                    <th className="border border-neutral-800 p-2 text-left">f(x)</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#1f2937]/50 border-b border-neutral-800/80 text-neutral-200">
                      <td className="border border-neutral-800 p-2 text-amber-400 font-bold">{row.x}</td>
                      <td className="border border-neutral-800 p-2">
                        {row.y !== null ? (
                          <span className={row.y === 0 ? 'text-[#61cc70] font-bold underline' : ''}>
                            {row.y}
                          </span>
                        ) : (
                          <span className="text-neutral-500 italic">undefined</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
