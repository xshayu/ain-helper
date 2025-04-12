import { useState } from 'react';
import LabelWithTooltip from './ui/labelWithTooltip';

const formatCurrency = (num: number) =>
  '₱' + (Math.round(num * 100) / 100).toLocaleString('en-PH');

type TimeUnit = 'year' | 'month' | 'week' | 'everyXMos' | 'everyXWks';

interface InputItem {
  name: string;
  qtyRange: boolean;
  qtyMin: number;
  qtyMax: number;
  freqRange: boolean;
  freqMin: number;
  freqMax: number;
  freqUnit: TimeUnit;
  priceRange: boolean;
  priceMin: number;
  priceMax: number;
}

const defaultItem = (): InputItem => ({
  name: '',
  qtyRange: false,
  qtyMin: 1,
  qtyMax: 1,
  freqRange: false,
  freqMin: 1,
  freqMax: 1,
  freqUnit: 'year',
  priceRange: false,
  priceMin: 0,
  priceMax: 0,
});

function calcAnnualFrequency(item: InputItem, freq: number) {
  switch (item.freqUnit) {
    case 'year':
      return freq;
    case 'month':
      return freq * 12;
    case 'week':
      return freq * 52;
    case 'everyXMos':
      return 12 / freq;
    case 'everyXWks':
      return 52 / freq;
    default:
      return freq;
  }
}

type RangeInputRowProps = {
  label: string;
  rangeEnabled: boolean;
  onToggleRange: () => void;
  minValue: number;
  maxValue: number;
  onChangeMin: (val: number) => void;
  onChangeMax: (val: number) => void;
  singleValue: number;
  onChangeSingle: (val: number) => void;
  minPlaceholder: string;
  maxPlaceholder: string;
  singlePlaceholder: string;
  min?: number;
  unitInput?: React.ReactNode;
};

const RangeInputRow = ({
  label,
  rangeEnabled,
  onToggleRange,
  minValue,
  maxValue,
  onChangeMin,
  onChangeMax,
  singleValue,
  onChangeSingle,
  minPlaceholder,
  maxPlaceholder,
  singlePlaceholder,
  min = 0,
  unitInput,
}: RangeInputRowProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 my-2 nth-of-type-3:border-y nth-of-type-3:border-gray-200 nth-of-type-3:py-2">
      <label className="w-48 font-medium">{label}</label>
      {rangeEnabled ? (
        <div className="flex gap-2 flex-grow items-center">
          <input
            type="number"
            value={minValue}
            onChange={(e) => onChangeMin(+e.target.value)}
            min={min}
            placeholder={minPlaceholder}
            className="border rounded p-2 w-24 bg-white text-gray-700"
          />
          <span>to</span>
          <input
            type="number"
            value={maxValue}
            onChange={(e) => onChangeMax(+e.target.value)}
            min={min}
            placeholder={maxPlaceholder}
            className="border rounded p-2 w-24 bg-white text-gray-700"
          />
        </div>
      ) : (
        <input
          type="number"
          value={singleValue}
          onChange={(e) => onChangeSingle(+e.target.value)}
          min={min}
          placeholder={singlePlaceholder}
          className="border rounded p-2 w-32 flex-grow bg-white text-gray-700"
        />
      )}
      {unitInput}
      <label className="flex items-center gap-2 whitespace-nowrap">
        <input
          type="checkbox"
          checked={rangeEnabled}
          onChange={onToggleRange}
          className="h-4 w-4 text-green-600"
        />
        Min-Max?
      </label>
    </div>
  );
};

export default function SeaweedInputsForm() {
  const [items, setItems] = useState<InputItem[]>([defaultItem()]);

  const addItem = () => setItems([...items, defaultItem()]);
  const updateItem = (i: number, updated: Partial<InputItem>) =>
    setItems(items.map((item, idx) => (idx === i ? { ...item, ...updated } : item)));
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const grandMin = items.reduce((sum, it) => {
    const freqMin = calcAnnualFrequency(it, it.freqMin);
    return sum + it.qtyMin * freqMin * it.priceMin;
  }, 0);

  const grandMax = items.reduce((sum, it) => {
    const freqMax = calcAnnualFrequency(it, it.freqMax);
    return sum + it.qtyMax * freqMax * it.priceMax;
  }, 0);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 font-sans bg-teal-200 rounded-lg shadow space-y-8">
      {/* Form Items */}
      <div className="space-y-6">
        {items.map((it, idx) => {
          const freqMin = calcAnnualFrequency(it, it.freqMin);
          const freqMax = calcAnnualFrequency(it, it.freqMax);
          const qtyAnnMin = it.qtyMin * freqMin;
          const qtyAnnMax = it.qtyMax * freqMax;
          const totalMin = qtyAnnMin * it.priceMin;
          const totalMax = qtyAnnMax * it.priceMax;

          return (
            <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative">
              <button
                onClick={() => removeItem(idx)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800"
              >
                Remove
              </button>

              <h3 className="text-lg font-medium text-gray-700 border-b pb-2 mb-4">
                Input Item #{idx + 1}
              </h3>

              {/* Input Name */}
              <div className="mb-4">
                <LabelWithTooltip tooltip="Name of input item (e.g., Seedlings, Straw)">
                  Input Name
                </LabelWithTooltip>
                <input
                  type="text"
                  value={it.name}
                  onChange={(e) => updateItem(idx, { name: e.target.value })}
                  placeholder="e.g., Seedlings"
                  className="w-full p-2 border border-gray-300 rounded bg-white text-gray-700"
                />
              </div>

              {/* Quantity Per Purchase */}
              <RangeInputRow
                label="How many do you buy"
                rangeEnabled={it.qtyRange}
                onToggleRange={() => updateItem(idx, { qtyRange: !it.qtyRange })}
                minValue={it.qtyMin}
                maxValue={it.qtyMax}
                onChangeMin={(val) => updateItem(idx, { qtyMin: val })}
                onChangeMax={(val) => updateItem(idx, { qtyMax: val })}
                singleValue={it.qtyMin}
                onChangeSingle={(val) => updateItem(idx, { qtyMin: val, qtyMax: val })}
                minPlaceholder="Min qty"
                maxPlaceholder="Max qty"
                singlePlaceholder="Quantity"
              />

              {/* Frequency */}
              <RangeInputRow
                label="How often do you buy"
                rangeEnabled={it.freqRange}
                onToggleRange={() => updateItem(idx, { freqRange: !it.freqRange })}
                minValue={it.freqMin}
                maxValue={it.freqMax}
                onChangeMin={(val) => updateItem(idx, { freqMin: val })}
                onChangeMax={(val) => updateItem(idx, { freqMax: val })}
                singleValue={it.freqMin}
                onChangeSingle={(val) => updateItem(idx, { freqMin: val, freqMax: val })}
                minPlaceholder="Min"
                maxPlaceholder="Max"
                singlePlaceholder="Frequency"
                min={1}
                unitInput={
                  <select
                    value={it.freqUnit}
                    onChange={(e) => updateItem(idx, { freqUnit: e.target.value as TimeUnit })}
                    className="p-2 border border-gray-300 rounded bg-white text-gray-700 md:ml-auto"
                  >
                    <option value="year">per Year</option>
                    <option value="month">per Month</option>
                    <option value="week">per Week</option>
                    <option value="everyXMos">Every X Months</option>
                    <option value="everyXWks">Every X Weeks</option>
                  </select>
                }
              />

              {/* Price */}
              <RangeInputRow
                label="Price"
                rangeEnabled={it.priceRange}
                onToggleRange={() => updateItem(idx, { priceRange: !it.priceRange })}
                minValue={it.priceMin}
                maxValue={it.priceMax}
                onChangeMin={(val) => updateItem(idx, { priceMin: val })}
                onChangeMax={(val) => updateItem(idx, { priceMax: val })}
                singleValue={it.priceMin}
                onChangeSingle={(val) => updateItem(idx, { priceMin: val, priceMax: val })}
                minPlaceholder="Min ₱"
                maxPlaceholder="Max ₱"
                singlePlaceholder="₱ Price"
              />

              {/* Summary for this item */}
              <div className="mt-4 p-3 rounded border bg-emerald-50 flex flex-col md:flex-row items-center justify-between">
                <div>
                  Annual Quantity:{' '}
                  <strong>{qtyAnnMin.toFixed(1)}</strong>
                  {it.qtyRange || it.freqRange ? (
                    <>
                      {' '}
                      - <strong>{qtyAnnMax.toFixed(1)}</strong>
                    </>
                  ) : null}
                </div>
                <div className="text-xl">
                  Annual Cost:{' '}
                  <strong>{formatCurrency(totalMin)}</strong>
                  {it.qtyRange || it.freqRange || it.priceRange ? (
                    <>
                      {' '}
                      - <strong>{formatCurrency(totalMax)}</strong>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Button and Total Summary */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={addItem}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-semibold cursor-pointer"
        >
          + Add Input
        </button>
        <div className="text-right">
          <div className="text-xs uppercase text-gray-500">Total Annual Inputs Cost</div>
          <div className="text-2xl font-bold">
            {formatCurrency(grandMin)}
            {grandMin !== grandMax && ` - ${formatCurrency(grandMax)}`}
          </div>
        </div>
      </div>
    </div>
  );
}