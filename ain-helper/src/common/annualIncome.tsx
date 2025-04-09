import { useState } from 'react';
import LabelWithTooltip from './labelWithTooltip';

const formatNumber = (num: number) => {
  const rounded = Math.round(num * 100) / 100;
  return rounded.toString().replace(/\.00$/, '');
};

const AnnualIncomeCalculator = () => {
  const [harvestsPerSixMonths, setHarvestsPerSixMonths] = useState(2);
  const [speciesName, setSpeciesName] = useState('');

  const [volumeDried, setVolumeDried] = useState(0);
  const [priceDried, setPriceDried] = useState(0);

  const [volumeFresh, setVolumeFresh] = useState(0);
  const [priceFresh, setPriceFresh] = useState(0);

  const revenueDriedPerCycle = volumeDried * priceDried;
  const revenueFreshPerCycle = volumeFresh * priceFresh;

  const totalRevenuePerCycle = revenueDriedPerCycle + revenueFreshPerCycle;
  const annualRevenue = totalRevenuePerCycle * harvestsPerSixMonths * 2; // 2 six-month periods

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 font-sans">

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {/* Harvest cycles */}
        <label>
          <LabelWithTooltip tooltip="Number of harvest cycles conducted within a six-month period">
            Harvests per 6 Months
          </LabelWithTooltip>
          <input
            type="number" min={1}
            value={harvestsPerSixMonths}
            onChange={(e) => setHarvestsPerSixMonths(+e.target.value)}
            className="border p-2 rounded w-full"
          />
        </label>

        {/* Species */}
        <label>
          <LabelWithTooltip tooltip="Species you wish to calculate income for">
            Seaweed Species
          </LabelWithTooltip>
          <input
            className="border p-2 rounded w-full"
            value={speciesName}
            onChange={(e) => setSpeciesName(e.target.value)}
            placeholder="e.g., Kappaphycus"
          />
        </label>

        {/* Volume dried */}
        <label>
          <LabelWithTooltip tooltip="Expected harvest volume of dried seaweed per cycle, kg">
            Dried Volume (kg)
          </LabelWithTooltip>
          <input
            type="number" min={0}
            value={volumeDried}
            onChange={(e) => setVolumeDried(+e.target.value)}
            className="border p-2 rounded w-full"
          />
        </label>

        {/* Price dried */}
        <label>
          <LabelWithTooltip tooltip="Price per kg of dried seaweed">
            Dried Price (per kg)
          </LabelWithTooltip>
          <input
            type="number" min={0}
            value={priceDried}
            onChange={(e) => setPriceDried(+e.target.value)}
            className="border p-2 rounded w-full"
          />
        </label>

        {/* Volume fresh */}
        <label>
          <LabelWithTooltip tooltip="Expected fresh seaweed volume harvested per cycle, kg">
            Fresh Volume (kg)
          </LabelWithTooltip>
          <input
            type="number" min={0}
            value={volumeFresh}
            onChange={(e) => setVolumeFresh(+e.target.value)}
            className="border p-2 rounded w-full"
          />
        </label>

        {/* Price fresh */}
        <label>
          <LabelWithTooltip tooltip="Selling price per kg fresh wet seaweed">
            Fresh Price (per kg)
          </LabelWithTooltip>
          <input
            type="number" min={0}
            value={priceFresh}
            onChange={(e) => setPriceFresh(+e.target.value)}
            className="border p-2 rounded w-full"
          />
        </label>
      </div>

      <div className="mt-6 p-4 border rounded bg-lime-100 space-y-3">
        <div className="flex justify-end items-center">
          <div className="text-right">
            <div className="uppercase text-xs text-gray-500">Annual Revenue Estimate</div>
            <div className="text-2xl font-bold">
              {formatNumber(annualRevenue)}
            </div>
          </div>
        </div>
        <hr/>
        <h3 className="italic text-xs text-lime-600 font-bold text-right">
          Multiply total cycle revenue by cycles/year for annual
        </h3>
        <p>
          For <strong>{speciesName || '[Species]'}</strong>, one cycle revenue is approx. <strong>{formatNumber(totalRevenuePerCycle)}</strong>:<br/>
          — Dried: <strong>{formatNumber(revenueDriedPerCycle)}</strong><br/>
          — Fresh: <strong>{formatNumber(revenueFreshPerCycle)}</strong><br/>
          Number of harvests per year: <strong>{harvestsPerSixMonths * 2}</strong><br/>
          Total yearly income: <strong>{formatNumber(annualRevenue)}</strong>
        </p>
      </div>

    </div>
  );
};

export default AnnualIncomeCalculator;