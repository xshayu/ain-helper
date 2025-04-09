import { useState } from 'react';

interface HarvestEvent {
  id: number;
  volume: number;
  freshYield: number;
  dryYield: number;
}

const formatNumber = (num: number) => {
  const rounded = Math.round(num * 100) / 100;
  return rounded.toString().replace(/\.00$/, '');
};

const SeaweedProductionCalculator = () => {
  // Basic info (Table 4)
  const [species, setSpecies] = useState('');
  const [source, setSource] = useState('');
  const [processing, setProcessing] = useState('');
  const [priceFresh, setPriceFresh] = useState(0);
  const [priceDry, setPriceDry] = useState(0);

  // Harvest events (Table 5)
  const [harvests, setHarvests] = useState<HarvestEvent[]>([]);

  // Add new harvest row
  const addHarvest = () => {
    setHarvests([
      ...harvests,
      { id: Date.now(), volume: 1, freshYield: 0, dryYield: 0 }
    ]);
  };

  const updateHarvest = (id: number, field: keyof HarvestEvent, value: number) => {
    setHarvests(
      harvests.map(h =>
        h.id === id ? { ...h, [field]: value } : h
      )
    );
  };

  const removeHarvest = (id: number) => {
    setHarvests(harvests.filter(h => h.id !== id));
  };

  // Calculate totals
  const totalFreshIncome = harvests.reduce(
    (sum, h) => sum + h.volume * h.freshYield * priceFresh, 0
  );
  const totalDryIncome = harvests.reduce(
    (sum, h) => sum + h.volume * h.dryYield * priceDry, 0
  );

  return (
    <div className="max-w-5xl mx-auto p-4 font-sans space-y-8">
      <h1 className="text-xl font-bold">Seaweed Production Income Calculator</h1>

      {/* Production Info - Table 4 */}
      <section className="border rounded p-4 bg-gray-50 space-y-4">
        <h2 className="font-semibold">Production Info (Table 4)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label>
            Species
            <input className="border p-2 rounded w-full"
              value={species} onChange={e => setSpecies(e.target.value)} placeholder="e.g. Kappaphycus" />
          </label>
          <label>
            Source / Origin
            <input className="border p-2 rounded w-full"
              value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. nursery raised" />
          </label>

          <label>
            Price per kg (Fresh)
            <input type="number" min={0}
              className="border p-2 rounded w-full"
              value={priceFresh} onChange={e => setPriceFresh(+e.target.value)} placeholder="e.g. 10" />
          </label>
          <label>
            Price per kg (Dry)
            <input type="number" min={0}
              className="border p-2 rounded w-full"
              value={priceDry} onChange={e => setPriceDry(+e.target.value)} placeholder="e.g. 50" />
          </label>

          <label className="sm:col-span-2">
            Processing Notes
            <textarea value={processing} onChange={e => setProcessing(e.target.value)}
              className="border p-2 rounded w-full" placeholder="e.g. sun drying, semi-dried..." />
          </label>
        </div>
      </section>

      {/* Harvest Events - Table 5 */}
      <section className="border rounded p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Harvest Events (Table 5)</h2>
          <button onClick={addHarvest} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-1 rounded">
            + Add Harvest
          </button>
        </div>

        {harvests.length === 0 && <p className="italic">Add harvest data rows above.</p>}

        {harvests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-green-100">
                <tr>
                  <th className="border px-2 py-1">#</th>
                  <th className="border px-2 py-1">Volume (units)</th>
                  <th className="border px-2 py-1">Fresh weight per unit (kg)</th>
                  <th className="border px-2 py-1">Dry weight per unit (kg)</th>
                  <th className="border px-2 py-1">Gross Income Fresh</th>
                  <th className="border px-2 py-1">Gross Income Dry</th>
                  <th className="border px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {harvests.map((h, idx) => (
                  <tr key={h.id} className="even:bg-white odd:bg-gray-50">
                    <td className="border px-2 py-1">{idx + 1}</td>
                    <td className="border px-2 py-1">
                      <input type="number" min={0} value={h.volume}
                             onChange={e => updateHarvest(h.id, 'volume', +e.target.value)}
                             className="w-20 border p-1 rounded" />
                    </td>
                    <td className="border px-2 py-1">
                      <input type="number" min={0} value={h.freshYield}
                             onChange={e => updateHarvest(h.id, 'freshYield', +e.target.value)}
                             className="w-20 border p-1 rounded" />
                    </td>
                    <td className="border px-2 py-1">
                      <input type="number" min={0} value={h.dryYield}
                             onChange={e => updateHarvest(h.id, 'dryYield', +e.target.value)}
                             className="w-20 border p-1 rounded" />
                    </td>
                    <td className="border px-2 py-1 text-right">
                      {formatNumber(h.volume * h.freshYield * priceFresh)}
                    </td>
                    <td className="border px-2 py-1 text-right">
                      {formatNumber(h.volume * h.dryYield * priceDry)}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button onClick={() => removeHarvest(h.id)} className="text-red-600 font-bold">X</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-green-50 font-semibold">
                  <td colSpan={4} className="border px-2 py-1 text-right">TOTAL:</td>
                  <td className="border px-2 py-1 text-right">{formatNumber(totalFreshIncome)}</td>
                  <td className="border px-2 py-1 text-right">{formatNumber(totalDryIncome)}</td>
                  <td className="border"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Summary */}
      <section className="border rounded p-4 bg-green-100 space-y-2">
        <h2 className="font-semibold">Summary</h2>
        <p>
          Species: <strong>{species || '[Species]'}</strong> from <strong>{source || '[Origin]'}</strong>
        </p>
        <p>
          Processing: <strong>{processing || '[Processing Notes]'}</strong>
        </p>
        <p>
          **Estimated Total Gross Income:**  
          <br/>
          Fresh: <strong>{formatNumber(totalFreshIncome)}</strong>  
          <br/>
          Dry: <strong>{formatNumber(totalDryIncome)}</strong>
        </p>
      </section>
    </div>
  );
};

export default SeaweedProductionCalculator;