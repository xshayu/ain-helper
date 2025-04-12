import React, { useState, useCallback } from 'react';
import LabelWithTooltip from './labelWithTooltip';
import Section from './sectionComponent';

// Helper to format numbers for display
const formatNumber = (num: number | null | undefined, decimals = 2): string => {
  if (isNaN(Number(num)) || num === null || num === undefined) return '0';
  // Handle potential floating point inaccuracies for rounding
  const factor = Math.pow(10, decimals);
  // Use Number() to satisfy TypeScript strict checks
  const rounded = Math.round((Number(num) + Number.EPSILON) * factor) / factor;
  return rounded.toLocaleString('en-US', {
    minimumFractionDigits: 0, // Don't show .00
    maximumFractionDigits: decimals,
  });
};

// Type definition for Dropdown options
interface DropdownOption {
  id: number;
  label: string;
}

// Options for dropdowns
const buyerTypes: DropdownOption[] = [
  { id: 1, label: "Consolidator/wholesaler" }, { id: 2, label: "Retailer" },
  { id: 3, label: "Wholesaler" }, { id: 4, label: "Restaurant" },
  { id: 5, label: "Hotel" }, { id: 6, label: "Broker" },
  { id: 7, label: "Others (specify)" }
];
const buyerLocations: DropdownOption[] = [
  { id: 1, label: "San Dionisio" }, { id: 2, label: "Estancia" },
  { id: 3, label: "Concepcion" }, { id: 4, label: "Others (specify)" }
];
const paymentModes: DropdownOption[] = [
  { id: 1, label: "Cash upon pick up" }, { id: 2, label: "Cash on delivery" },
  { id: 3, label: "Credit - pick up" }, { id: 4, label: "Credit - delivery" },
  { id: 5, label: "Bank transfer" }, { id: 6, label: "Gcash" },
  { id: 7, label: "Others (specify)" }
];

// Interface defining the structure for each species' data
interface SpeciesData {
  id: number; // Unique identifier for React keys
  name: string;
  // marketSchedule: string;
  timesPerSixMonths: number;
  freshVolume: number;
  freshPrice: number;
  ratioInput: string; // Store the raw input string e.g., "5" or "7:1"
  freshToDryRatio: number; // Store the calculated numeric ratio
  driedVolume: number;
  driedPrice: number;
  consumedVolume: number;
  processedVolume: number;
  // Marketing data
  // buyerType: number;
  // buyerLocation: number;
  // paymentMode: number;
  // buyerOther: string;
  // locationOther: string;
  // paymentOther: string;
}

// Interface for the calculated data derived from SpeciesData
interface CalculatedSpeciesData extends SpeciesData {
  freshRevenuePerCycle: number;
  driedRevenuePerCycle: number;
  totalRevenuePerCycle: number;
  salesPerYear: number;
  annualRevenue: number;
}

// Initial state for a species row
const initialSpeciesData: Omit<SpeciesData, 'id'> = { // Omit ID as it's generated
  name: '',
  // marketSchedule: '',
  timesPerSixMonths: 2,
  freshVolume: 0,
  freshPrice: 0,
  ratioInput: '5', // Default raw input
  freshToDryRatio: 5, // Default numeric ratio
  driedVolume: 0, // Will be calculated initially based on fresh/ratio
  driedPrice: 0,
  consumedVolume: 0,
  processedVolume: 0,
  // Marketing data defaults
  // buyerType: 1,
  // buyerLocation: 1,
  // paymentMode: 1,
  // buyerOther: '',
  // locationOther: '',
  // paymentOther: ''
};

// Helper to parse ratio input (string like "5" or "7:1") into a number
const parseRatio = (input: string | number): number => {
  const trimmed = String(input).trim();
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length === 2) {
      const freshPart = parseFloat(parts[0]);
      const dryPart = parseFloat(parts[1]);
      if (!isNaN(freshPart) && !isNaN(dryPart) && dryPart > 0 && freshPart >= 0) {
        return freshPart / dryPart;
      }
    }
  } else {
    const num = parseFloat(trimmed);
    if (!isNaN(num) && num > 0) {
      return num;
    }
  }
  // Return 1 or maybe throw error/return NaN? Returning 1 avoids division by zero later.
  // Let's return Infinity if invalid/zero denominator to signal issues downstream
  // Or stick to 1 for safer calculations if user enters garbage
  return 1; // Default ratio if parsing fails or is invalid
};


const SeaweedFarmingCalculator: React.FC = () => {
  const [speciesData, setSpeciesData] = useState<SpeciesData[]>([
    { ...initialSpeciesData, id: Date.now(), name: 'Kappaphycus alvarezii' } // Default first species
  ]);

  const addSpecies = () => {
    const newSpecies: SpeciesData = {
      ...initialSpeciesData,
      id: Date.now() + speciesData.length // Ensure unique ID
    };
    // Calculate initial dried volume for new species
    newSpecies.driedVolume = (newSpecies.freshToDryRatio > 0)
      ? newSpecies.freshVolume / newSpecies.freshToDryRatio
      : 0;
    setSpeciesData([...speciesData, newSpecies]);
  };

  const removeSpecies = (idToRemove: number) => {
    if (speciesData.length > 1) {
      setSpeciesData(currentData => currentData.filter(species => species.id !== idToRemove));
    }
  };

  // useCallback to potentially optimize state updates
  const updateSpeciesField = useCallback((idToUpdate: number, field: keyof SpeciesData, value: string | number) => {
    setSpeciesData(currentData => {
      return currentData.map(species => {
        if (species.id !== idToUpdate) {
          return species; // Not the species to update
        }

        // Create a mutable copy of the species object
        const updatedSpecies: SpeciesData = { ...species };

        // --- Update the specific field ---
        // Type assertion needed as 'value' can be string or number,
        // but fields have specific types. Parsing handles conversion.
        (updatedSpecies[field] as any) = value;

        // --- Perform cascading calculations based on the field updated ---
        let numValue: number;

        switch (field) {
          case 'freshVolume':
            numValue = parseFloat(String(value)) || 0;
            updatedSpecies.freshVolume = numValue;
            // Recalculate dried volume based on current ratio
            updatedSpecies.driedVolume = (updatedSpecies.freshToDryRatio > 0)
              ? numValue / updatedSpecies.freshToDryRatio
              : 0;
            break;

          case 'ratioInput':
             // Update the raw input first
            updatedSpecies.ratioInput = String(value);
            const newNumericRatio = parseRatio(String(value));
            updatedSpecies.freshToDryRatio = newNumericRatio;
            // Recalculate dried volume based on new ratio and current fresh volume
             updatedSpecies.driedVolume = (newNumericRatio > 0)
              ? updatedSpecies.freshVolume / newNumericRatio
              : 0;
            break;

          case 'driedVolume':
            numValue = parseFloat(String(value)) || 0;
            updatedSpecies.driedVolume = numValue;
            // Recalculate the ratio based on current fresh volume and NEW dried volume
            if (numValue > 0 && updatedSpecies.freshVolume > 0) {
              const calculatedRatio = updatedSpecies.freshVolume / numValue;
              updatedSpecies.freshToDryRatio = calculatedRatio;
              // Decide if ratioInput should be updated. Let's NOT update it automatically
              // to preserve user's manual input type (e.g. "7:1") unless they edit ratioInput directly.
              // updatedSpecies.ratioInput = formatNumber(calculatedRatio, 1); // Optional: update display
            } else {
              // If dried is 0 or fresh is 0, ratio is problematic.
              // Keep existing numeric ratio? Set to Infinity? Or 1? Let's stick with 1 or last valid.
              // If user explicitly sets dried to 0, maybe keep ratio?
              // If freshVol is 0, ratio becomes meaningless for calculating dried.
              // Let's leave numeric ratio as is unless calculatedRatio is valid.
               if (updatedSpecies.freshVolume <= 0 && numValue > 0) {
                  updatedSpecies.freshToDryRatio = Infinity; // Or some indicator?
               }
            }
            break;

           // Ensure numeric types for other relevant fields
           case 'freshPrice':
           case 'driedPrice':
           case 'consumedVolume':
           case 'processedVolume':
               updatedSpecies[field] = parseFloat(String(value)) || 0;
               break;
           case 'timesPerSixMonths':
          //  case 'buyerType': // Ensure dropdown values are numbers
          //  case 'buyerLocation':
          //  case 'paymentMode':
               updatedSpecies[field] = parseInt(String(value), 10) || 0;
               break;

           // Default case for string fields like name, schedule, other inputs
           default:
               (updatedSpecies[field] as any) = String(value);
               break;
        }

        return updatedSpecies;
      });
    });
  }, []); // Empty dependency array means this function is created once


  // Calculate all revenue figures
  const calculateTotals = (): { calculatedData: CalculatedSpeciesData[], totalAnnualIncome: number } => {
    let totalAnnualIncome = 0;

    const calculatedData: CalculatedSpeciesData[] = speciesData.map(species => {
      const salesPerYear = species.timesPerSixMonths * 2;

      const freshRevenuePerCycle = species.freshVolume * species.freshPrice;
      const driedRevenuePerCycle = species.driedVolume * species.driedPrice;
      const totalRevenuePerCycle = freshRevenuePerCycle + driedRevenuePerCycle;

      const annualRevenue = totalRevenuePerCycle * salesPerYear;

      totalAnnualIncome += annualRevenue;

      return {
        ...species, // Includes all original SpeciesData fields
        freshRevenuePerCycle,
        driedRevenuePerCycle,
        totalRevenuePerCycle,
        salesPerYear, // Needed for calculation and display in table 5
        annualRevenue
      };
    });

    return { calculatedData, totalAnnualIncome };
  };

  const { calculatedData, totalAnnualIncome } = calculateTotals();

  // Generic handler for numeric inputs to simplify onChange props
  const handleNumericInputChange = (id: number, field: keyof SpeciesData, e: React.ChangeEvent<HTMLInputElement>) => {
      updateSpeciesField(id, field, e.target.value); // Pass value as string, handler parses
  };
  // Generic handler for text inputs
   const handleTextInputChange = (id: number, field: keyof SpeciesData, e: React.ChangeEvent<HTMLInputElement>) => {
       updateSpeciesField(id, field, e.target.value);
   };
   // Generic handler for select dropdowns
  //  const handleSelectChange = (id: number, field: keyof SpeciesData, e: React.ChangeEvent<HTMLSelectElement>) => {
  //       updateSpeciesField(id, field, parseInt(e.target.value, 10)); // Pass value as number
  //   };


  return (
    <div className="max-w-full mx-auto p-4 font-sans">
      <h1 className="text-2xl font-bold mb-6 text-center text-teal-800">Seaweed Farming Income Calculator</h1>

      {/* Form 4 Equivalent - Production Data */}
      <Section title="PART 4: Seaweed Farming Production Data">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border text-sm">
            <thead className="bg-teal-50">
              <tr>
                <th className="border p-2"><LabelWithTooltip tooltip="Name of the seaweed species">Species</LabelWithTooltip></th>
{/*                 <th className="border p-2">
                  <LabelWithTooltip tooltip="What is the usual harvest/market schedule? (e.g., Monthly, Every 45 days)">
                    Market Schedule
                  </LabelWithTooltip>
                </th> */}
                <th className="border p-2">
                  <LabelWithTooltip tooltip="Number of times sold within a six-month period. Determines annual calculation multiplier.">
                    Times Sold per 6 Months
                  </LabelWithTooltip>
                </th>
                <th className="border p-2">
                  <LabelWithTooltip tooltip="Expected FRESH seaweed volume SOLD per sale event/cycle, kg">
                    Fresh Vol Sold (kg)
                  </LabelWithTooltip>
                </th>
                <th className="border p-2">
                  <LabelWithTooltip tooltip="Selling price per kg FRESH wet seaweed">
                    Fresh Price (₱/kg)
                  </LabelWithTooltip>
                </th>
                <th className="border p-2">
                  <LabelWithTooltip tooltip="Ratio of FRESH weight to DRIED weight. Enter as a number (e.g., 5) or ratio (e.g., 7:1). Changing this or Fresh Volume updates Dried Volume.">
                    Fresh:Dry Ratio
                  </LabelWithTooltip>
                </th>
                <th className="border p-2">
                  <LabelWithTooltip tooltip="Expected volume of DRIED seaweed SOLD per sale event/cycle, kg. Changing this updates the effective Fresh:Dry ratio based on Fresh Volume.">
                    Dried Vol Sold (kg)
                  </LabelWithTooltip>
                </th>
                <th className="border p-2">
                  <LabelWithTooltip tooltip="Selling price per kg DRIED seaweed">
                    Dried Price (₱/kg)
                  </LabelWithTooltip>
                </th>
                <th className="border p-2">
                  <LabelWithTooltip tooltip="How many kg was eaten/consumed (per cycle/harvest)? Optional data.">
                    Consumed (kg)
                  </LabelWithTooltip>
                </th>
                <th className="border p-2">
                  <LabelWithTooltip tooltip="How many kg was processed into chips, etc. (per cycle/harvest)? Optional data.">
                    Processed (kg)
                  </LabelWithTooltip>
                </th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {speciesData.map((species) => (
                <tr key={species.id}>
                  <td className="border p-2">
                    <input
                      type="text"
                      className="w-full p-1 border rounded min-w-[150px]"
                      placeholder="e.g., Kappaphycus alvarezii"
                      value={species.name}
                      onChange={(e) => handleTextInputChange(species.id, 'name', e)}
                    />
                  </td>
{/*                   <td className="border p-2">
                    <input
                      type="text"
                      className="w-full p-1 border rounded min-w-[100px]"
                      placeholder="e.g., Monthly"
                      value={species.marketSchedule}
                      onChange={(e) => handleTextInputChange(species.id, 'marketSchedule', e)}
                    />
                  </td> */}
                  <td className="border p-2">
                    <input
                      type="number"
                      min="0" step="1"
                      className="w-20 p-1 border rounded"
                      value={species.timesPerSixMonths}
                      onChange={(e) => handleNumericInputChange(species.id, 'timesPerSixMonths', e)}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      min="0" step="any"
                      className="w-24 p-1 border rounded"
                      value={species.freshVolume}
                      onChange={(e) => handleNumericInputChange(species.id, 'freshVolume', e)}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      min="0" step="any"
                      className="w-24 p-1 border rounded"
                      value={species.freshPrice}
                      onChange={(e) => handleNumericInputChange(species.id, 'freshPrice', e)}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text" // Changed to text
                      className="w-20 p-1 border rounded"
                      placeholder="e.g., 5 or 7:1"
                      value={species.ratioInput} // Display the raw input
                      onChange={(e) => handleTextInputChange(species.id, 'ratioInput', e)}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      min="0" step="any"
                      className="w-24 p-1 border rounded"
                      value={species.driedVolume}
                      onChange={(e) => handleNumericInputChange(species.id, 'driedVolume', e)}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      min="0" step="any"
                      className="w-24 p-1 border rounded"
                      value={species.driedPrice}
                      onChange={(e) => handleNumericInputChange(species.id, 'driedPrice', e)}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      min="0" step="any"
                      className="w-24 p-1 border rounded"
                      value={species.consumedVolume}
                       onChange={(e) => handleNumericInputChange(species.id, 'consumedVolume', e)}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      min="0" step="any"
                      className="w-24 p-1 border rounded"
                      value={species.processedVolume}
                      onChange={(e) => handleNumericInputChange(species.id, 'processedVolume', e)}
                    />
                  </td>
                  <td className="border p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeSpecies(species.id)}
                      className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={speciesData.length === 1}
                      aria-label={`Remove ${species.name || 'species'}`}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={11} className="border p-2"> {/* Adjusted colspan */}
                  <button
                    type="button"
                    onClick={addSpecies}
                    className="flex items-center text-green-600 hover:text-green-800 font-medium"
                  >
                    <span className="mr-1 text-xl">➕</span> Add Species
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>

      {/* Form 5 Equivalent - Annual Income Calculation */}
      <Section title="PART 5: Annual Income Calculation">
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
          <h3 className="font-semibold mb-2">Calculation Logic:</h3>
          <p>Vol per Sale (Fresh/Dried) × Price (Fresh/Dried) = Revenue per Sale (Fresh/Dried)</p>
          <p>Rev per Sale (Fresh + Dried) = Total Revenue per Sale</p>
          <p>Total Rev per Sale × (Times Sold per 6 Months × 2) = Annual Income</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border text-sm">
            <thead className="bg-teal-50">
              <tr>
                <th className="border p-2 align-bottom" rowSpan={2}>Species</th>
                <th className="border p-2 text-center" colSpan={3}>Dried (Annual)</th>
                <th className="border p-2 text-center" colSpan={3}>Fresh (Annual)</th>
                <th className="border p-2 align-bottom" rowSpan={2}>Total Annual Income</th>
              </tr>
              <tr>
                <th className="border p-2">Avg Price (₱/kg)</th>
                <th className="border p-2">
                  <LabelWithTooltip tooltip="Total volume of DRIED seaweed sold per year, calculated as Volume per Sale (kg) × (Times Sold per 6 Months × 2)">
                    Total Volume (kg/yr)
                  </LabelWithTooltip>
                </th>
                <th className="border p-2">Total Revenue (₱/yr)</th>
                <th className="border p-2">Avg Price (₱/kg)</th>
                <th className="border p-2">
                  <LabelWithTooltip tooltip="Total volume of FRESH seaweed sold per year, calculated as Volume per Sale (kg) × (Times Sold per 6 Months × 2)">
                    Total Volume (kg/yr)
                  </LabelWithTooltip>
                </th>
                <th className="border p-2">Total Revenue (₱/yr)</th>
              </tr>
            </thead>
            <tbody>
              {calculatedData.map((species) => {
                const driedVolumePerYear = species.driedVolume * species.salesPerYear;
                const freshVolumePerYear = species.freshVolume * species.salesPerYear;
                const driedRevenuePerYear = species.driedRevenuePerCycle * species.salesPerYear;
                const freshRevenuePerYear = species.freshRevenuePerCycle * species.salesPerYear;

                const driedVolText = `${formatNumber(species.driedVolume, 1)}kg × ${species.salesPerYear} = ${formatNumber(driedVolumePerYear, 1)} kg`;
                const freshVolText = `${formatNumber(species.freshVolume, 1)}kg × ${species.salesPerYear} = ${formatNumber(freshVolumePerYear, 1)} kg`;

                return (
                  <tr key={species.id}>
                    <td className="border p-2 font-medium">
                      {species.name || `Species ${species.id}`}
                    </td>
                    {/* Dried Annual */}
                    <td className="border p-2 text-right">₱{formatNumber(species.driedPrice)}</td>
                    <td className="border p-2 text-right">{driedVolText}</td>
                    <td className="border p-2 text-right">₱{formatNumber(driedRevenuePerYear)}</td>
                    {/* Fresh Annual */}
                    <td className="border p-2 text-right">₱{formatNumber(species.freshPrice)}</td>
                    <td className="border p-2 text-right">{freshVolText}</td>
                    <td className="border p-2 text-right">₱{formatNumber(freshRevenuePerYear)}</td>
                    {/* Total Annual */}
                    <td className="border p-2 text-right font-bold">₱{formatNumber(species.annualRevenue)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-teal-100">
                <td className="border p-2 font-bold" colSpan={7}>Total Annual Income (All Species)</td> {/* Adjusted colspan */}
                <td className="border p-2 text-right font-bold text-lg">₱{formatNumber(totalAnnualIncome)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>

      {/* Form 6 Equivalent - Marketing Information (Single Sale Cycle) */}
      <Section title="PART 6: Seaweed Farming Marketing (Single Sale Cycle)">
         <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border text-sm">
            <thead className="bg-teal-50">
              <tr>
                <th className="border p-2 align-bottom" rowSpan={2}>Species</th>
                <th className="border p-2 align-bottom" rowSpan={2}>Type (D/F)</th>
                <th className="border p-2 text-center" colSpan={2}>Volume & Price (per Sale)</th>
                <th className="border p-2 align-bottom" rowSpan={2}>Income (per Sale Cycle)</th>
              </tr>
              <tr>
                <th className="border p-2">Volume (kg)</th>
                <th className="border p-2">Price (₱/kg)</th>
              </tr>
            </thead>
            <tbody>
              {calculatedData.map((species) => (
                <React.Fragment key={species.id}>
                  {/* --- Dried Row --- */}
                  <tr className={species.driedVolume > 0 ? "bg-gray-50" : "bg-gray-50 opacity-50"}> {/* Dim if no volume */}
                    <td className="border p-2 align-top" rowSpan={2}>
                       {species.name || `Species ${species.id}`}
                    </td>
                    <td className="border p-2 font-medium text-center align-middle">D</td>
                    {/* Dried Specifics */}
                    <td className="border p-2 text-right align-middle">
                      {formatNumber(species.driedVolume, 1)} kg
                    </td>
                    <td className="border p-2 text-right align-middle">
                      ₱{formatNumber(species.driedPrice)}
                    </td>
                    <td className="border p-2 text-right font-semibold align-middle">
                      ₱{formatNumber(species.driedRevenuePerCycle)}
                    </td>
                  </tr>

                  {/* --- Fresh Row --- */}
                   <tr className={species.freshVolume > 0 ? "" : "opacity-50"}> {/* Dim if no volume */}
                    <td className="border p-2 font-medium text-center align-middle">F</td>
                    {/* Fresh Specifics */}
                    <td className="border p-2 text-right align-middle">
                      {formatNumber(species.freshVolume, 1)} kg
                    </td>
                    <td className="border p-2 text-right align-middle">
                      ₱{formatNumber(species.freshPrice)}
                    </td>
                    <td className="border p-2 text-right font-semibold align-middle">
                      ₱{formatNumber(species.freshRevenuePerCycle)}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
             <tfoot>
              <tr className="bg-teal-100">
                <td className="border p-2 font-bold" colSpan={4}>Total Income (Single Sale Cycle, All Species)</td>
                <td className="border p-2 text-right font-bold text-lg">
                  ₱{formatNumber(calculatedData.reduce((sum, item) => sum + item.totalRevenuePerCycle, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>

       {/* Summary Card */}
      <div className="mt-8 p-4 bg-teal-50 border border-teal-200 rounded-md shadow-sm">
        <h3 className="font-bold mb-4 text-teal-800 border-b border-teal-300 pb-2">Calculation Summary:</h3>
         <div className="mt-4 p-4 bg-white rounded-lg border border-teal-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center p-3 bg-yellow-100 rounded shadow-sm border border-yellow-300">
              <div className="text-sm text-yellow-700 mb-1">Total Income per Sale Cycle</div>
              <div className="font-bold text-xl text-yellow-900">
                ₱{formatNumber(calculatedData.reduce((sum, item) => sum + item.totalRevenuePerCycle, 0))}
              </div>
              <div className="text-xs text-gray-500 mt-1">(Sum of Fresh + Dried for all species, for one sale)</div>
            </div>
            <div className="text-center p-3 bg-green-100 rounded shadow-sm border border-green-300">
              <div className="text-sm text-green-700 mb-1">Estimated Total Annual Income</div>
              <div className="font-bold text-xl text-green-900">
                ₱{formatNumber(totalAnnualIncome)}
              </div>
               <div className="text-xs text-gray-500 mt-1">(Income per Cycle × Sales per Year, summed for all species)</div>
            </div>
          </div>
        </div>
        <ul className="space-y-1 text-sm mt-4 list-disc pl-5 text-gray-700">
          <li><span className="font-medium">Income per Sale Cycle</span> = (Fresh Vol × Fresh Price) + (Dried Vol × Dried Price)</li>
          <li><span className="font-medium">Annual Income</span> = Income per Sale Cycle × (Times Sold per 6 Months × 2)</li>
          <li>Entering Fresh Vol & Ratio calculates Dried Vol.</li>
          <li>Entering Dried Vol calculates the effective Ratio (based on Fresh Vol).</li>
          <li>A "sale cycle" corresponds to the data entered for a single sale event (volumes & prices in Part 4).</li>
        </ul>
      </div>
    </div>
  );
}

export default SeaweedFarmingCalculator;