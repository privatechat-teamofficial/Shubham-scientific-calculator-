import React, { useState } from 'react';
import { X, ArrowRightLeft, Scale, Check } from 'lucide-react';

interface ConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertValue: (val: number) => void;
}

interface UnitCategory {
  name: string;
  units: Array<{ name: string; toBase: (v: number) => number; fromBase: (v: number) => number }>;
}

const CATEGORIES: UnitCategory[] = [
  {
    name: 'Length',
    units: [
      { name: 'Meters (m)', toBase: (v) => v, fromBase: (v) => v },
      { name: 'Kilometers (km)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { name: 'Centimeters (cm)', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { name: 'Millimeters (mm)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { name: 'Miles (mi)', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      { name: 'Yards (yd)', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { name: 'Feet (ft)', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { name: 'Inches (in)', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { name: 'Nautical Miles (nmi)', toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
    ],
  },
  {
    name: 'Mass',
    units: [
      { name: 'Kilograms (kg)', toBase: (v) => v, fromBase: (v) => v },
      { name: 'Grams (g)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { name: 'Pounds (lb)', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      { name: 'Ounces (oz)', toBase: (v) => v * 0.028349523, fromBase: (v) => v / 0.028349523 },
      { name: 'Metric Tons (t)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    ],
  },
  {
    name: 'Velocity',
    units: [
      { name: 'Meters per second (m/s)', toBase: (v) => v, fromBase: (v) => v },
      { name: 'Kilometers per hour (km/h)', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { name: 'Miles per hour (mph)', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { name: 'Knots (kn)', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    ],
  },
  {
    name: 'Pressure',
    units: [
      { name: 'Pascals (Pa)', toBase: (v) => v, fromBase: (v) => v },
      { name: 'Atmospheres (atm)', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
      { name: 'Bar (bar)', toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
      { name: 'Torr / mmHg', toBase: (v) => v * 133.322, fromBase: (v) => v / 133.322 },
      { name: 'PSI (lbf/in²)', toBase: (v) => v * 6894.757, fromBase: (v) => v / 6894.757 },
    ],
  },
  {
    name: 'Temperature',
    units: [
      { name: 'Celsius (°C)', toBase: (v) => v, fromBase: (v) => v },
      { name: 'Fahrenheit (°F)', toBase: (v) => (v - 32) * (5 / 9), fromBase: (v) => v * (9 / 5) + 32 },
      { name: 'Kelvin (K)', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  {
    name: 'Energy',
    units: [
      { name: 'Joules (J)', toBase: (v) => v, fromBase: (v) => v },
      { name: 'Kilojoules (kJ)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { name: 'Calories (cal)', toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
      { name: 'Kilocalories (kcal)', toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
      { name: 'Watt-hours (Wh)', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { name: 'Kilowatt-hours (kWh)', toBase: (v) => v * 3600000, fromBase: (v) => v / 3600000 },
      { name: 'Electronvolts (eV)', toBase: (v) => v * 1.602176634e-19, fromBase: (v) => v / 1.602176634e-19 },
    ],
  },
];

export const ConversionModal: React.FC<ConversionModalProps> = ({
  isOpen,
  onClose,
  onInsertValue,
}) => {
  const [selectedCatIdx, setSelectedCatIdx] = useState(0);
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const [inputVal, setInputVal] = useState('1');

  if (!isOpen) return null;

  const currentCat = CATEGORIES[selectedCatIdx];
  const numInput = parseFloat(inputVal) || 0;

  // Perform unit conversion via base
  const fromUnit = currentCat.units[fromIdx] || currentCat.units[0];
  const toUnit = currentCat.units[toIdx] || currentCat.units[1] || currentCat.units[0];
  const baseValue = fromUnit.toBase(numInput);
  const convertedVal = toUnit.fromBase(baseValue);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#121214] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Scale className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-white text-base font-oryno-bold block leading-tight">
                Scientific Unit Converter
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono">
                [SHIFT] [8] (CONV)
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

        {/* Category Tabs */}
        <div className="p-3 bg-[#0f0f11] border-b border-neutral-800 flex gap-1.5 overflow-x-auto text-xs">
          {CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              onClick={() => {
                setSelectedCatIdx(idx);
                setFromIdx(0);
                setToIdx(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap text-xs ${
                selectedCatIdx === idx
                  ? 'bg-amber-500 text-black border border-amber-400 shadow-xs'
                  : 'bg-[#18181b] text-neutral-300 hover:bg-[#27272a] border border-neutral-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Converter Body */}
        <div className="p-4 flex flex-col gap-3.5">
          {/* From */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-400">From Value & Unit:</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-1/2 bg-[#000000] border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-hidden focus:border-amber-400"
              />
              <select
                value={fromIdx}
                onChange={(e) => setFromIdx(parseInt(e.target.value, 10))}
                className="w-1/2 bg-[#18181b] border border-neutral-700 rounded-xl px-2 py-2 text-neutral-200 text-xs focus:outline-hidden focus:border-amber-400"
              >
                {currentCat.units.map((u, i) => (
                  <option key={u.name} value={i} className="bg-[#141416] text-white">
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => {
                const temp = fromIdx;
                setFromIdx(toIdx);
                setToIdx(temp);
              }}
              title="Swap Units"
              className="p-2 rounded-full bg-[#18181b] hover:bg-neutral-800 text-amber-400 border border-neutral-700 active:scale-95 transition-all shadow-sm"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* To */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-400">Converted Output:</label>
            <div className="flex gap-2">
              <div className="w-1/2 bg-[#000000] border border-neutral-700 rounded-xl px-3 py-2 text-[#61cc70] font-mono text-sm font-bold flex items-center overflow-x-auto">
                {parseFloat(convertedVal.toFixed(6))}
              </div>
              <select
                value={toIdx}
                onChange={(e) => setToIdx(parseInt(e.target.value, 10))}
                className="w-1/2 bg-[#18181b] border border-neutral-700 rounded-xl px-2 py-2 text-neutral-200 text-xs focus:outline-hidden focus:border-amber-400"
              >
                {currentCat.units.map((u, i) => (
                  <option key={u.name} value={i} className="bg-[#141416] text-white">
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => {
              onInsertValue(parseFloat(convertedVal.toFixed(8)));
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-[#61cc70] hover:bg-[#50a65c] font-black text-black text-sm transition-all shadow-md active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" strokeWidth={3} />
            <span>Insert Converted Value</span>
          </button>
        </div>
      </div>
    </div>
  );
};
