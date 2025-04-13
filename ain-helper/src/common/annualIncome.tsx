import React, { useState, useCallback, useEffect } from 'react'; // Import useEffect
import LabelWithTooltip from './ui/labelWithTooltip';
import Section from './ui/sectionComponent';
import { formatNumber, CONFIG } from '../utils'; // Assuming CONFIG is exported

// Define the frequency type
type FrequencyType = 'perMonth' | 'perWeek' | 'everyXMonths' | 'everyXWeeks' | 'once' | 'perYear';

// Updated Interface for SpeciesData
interface SpeciesData {
  id: number;
  name: string;
  // Frequency fields replace timesPerSixMonths
  frequencyType: FrequencyType;
  frequencyValue: number; // Used for perMonth, perWeek, perYear
  everyXValue: number;    // Used for everyXMonths, everyXWeeks
  monthsMarked: number;   // How many months per year sales *can* happen (1-12)
  // Other fields remain
  freshVolume: number;
  freshPrice: number;
  ratioInput: string;
  freshToDryRatio: number;
  driedVolume: number;
  driedPrice: number;
  consumedVolume: number;
  processedVolume: number;
}

// Interface for calculated data (remains the same structure)
interface CalculatedSpeciesData extends SpeciesData {
  freshRevenuePerCycle: number;
  driedRevenuePerCycle: number;
  totalRevenuePerCycle: number;
  salesPerYear: number; // This is now calculated differently
  annualRevenue: number;
}

// Updated initial state
const initialSpeciesData: Omit<SpeciesData, 'id'> = {
  name: '',
  // Default Frequency: Sold twice per year
  frequencyType: 'perYear',
  frequencyValue: 2,
  everyXValue: 1, // Default, not used for 'perYear'
  monthsMarked: 12, // Default, applies to whole year
  // Other fields
  freshVolume: 0,
  freshPrice: 0,
  ratioInput: '5',
  freshToDryRatio: 5,
  driedVolume: 0,
  driedPrice: 0,
  consumedVolume: 0,
  processedVolume: 0,
};

// parseRatio helper function (keep as is)
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
  return 1; // Default ratio if parsing fails or is invalid
};

// --- NEW: Helper function to calculate annual sales ---
const calculateAnnualSales = (species: Pick<SpeciesData, 'frequencyType' | 'frequencyValue' | 'everyXValue' | 'monthsMarked'>): number => {
  const { frequencyType, frequencyValue, everyXValue, monthsMarked } = species;

  // Ensure monthsMarked is within valid range
  const validMonths = Math.max(1, Math.min(12, monthsMarked || 12));
  // Ensure values are positive where needed
  const val = Math.max(1, frequencyValue || 1);
  const xVal = Math.max(1, everyXValue || 1);

  switch (frequencyType) {
    case 'once':
      return 1;
    case 'perYear':
      return val; // Directly use frequencyValue as annual count
    case 'perMonth':
      // 'frequencyValue' times per month, only during 'validMonths'
      return val * validMonths;
    case 'perWeek':
      // 'frequencyValue' times per week, only during 'validMonths'
      // Use a more standard 4.33 weeks/month if CONFIG isn't defined or you prefer
      const weeksPerMonth = CONFIG?.NUMBER_OF_WEEKS_PER_MONTH ?? (52/12);
      return val * validMonths * weeksPerMonth;
    case 'everyXMonths':
      // How many full 'everyXValue' month intervals fit within 'validMonths'?
      // This calculates occurrences *within* the active months.
      if (xVal <= 0) return 0; // Avoid division by zero
      // Ensure at least one sale if monthsMarked >= xVal
      return validMonths >= xVal ? Math.floor(validMonths / xVal) : 0;
    case 'everyXWeeks':
      // How many full 'everyXValue' week intervals fit within the weeks of 'validMonths'?
      if (xVal <= 0) return 0; // Avoid division by zero
      const weeksPerMonthForCalc = CONFIG?.NUMBER_OF_WEEKS_PER_MONTH ?? (52/12);
      const totalWeeksInMarkedMonths = validMonths * weeksPerMonthForCalc;
       // Ensure at least one sale if totalWeeks >= xVal
      return totalWeeksInMarkedMonths >= xVal ? Math.floor(totalWeeksInMarkedMonths / xVal) : 0;
    default:
      return 0;
  }
};

// --- NEW: Helper function to describe frequency ---
const getFrequencyDescription = (species: Pick<SpeciesData, 'frequencyType' | 'frequencyValue' | 'everyXValue' | 'monthsMarked'>): string => {
    const { frequencyType, frequencyValue, everyXValue, monthsMarked } = species;
    const val = frequencyValue || 1;
    const xVal = everyXValue || 1;
    const months = monthsMarked || 12;
    const monthText = `${months} ${months === 1 ? 'mo' : 'mos'}`; // Handle plural 'mo'

    switch (frequencyType) {
        case 'once': return `Once (over ${monthText})`;
        case 'perYear': return `${val} time(s) per year`;
        case 'perMonth': return `${val} time(s)/month for ${monthText}`;
        case 'perWeek': return `${val} time(s)/week for ${monthText}`;
        case 'everyXMonths': return `Every ${xVal} months for ${monthText}`;
        case 'everyXWeeks': return `Every ${xVal} weeks for ${monthText}`;
        default: return 'N/A';
    }
};

// --- React Component ---
const SeaweedFarmingCalculator: React.FC = () => {
  const [speciesData, setSpeciesData] = useState<SpeciesData[]>([
    { ...initialSpeciesData, id: Date.now(), name: 'Kappaphycus alvarezii' }
  ]);

  // --- NEW: State for Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpeciesId, setEditingSpeciesId] = useState<number | null>(null);
  // Temporary state within the modal form
  const [modalFrequency, setModalFrequency] = useState<Pick<SpeciesData, 'frequencyType' | 'frequencyValue' | 'everyXValue' | 'monthsMarked'>>({
    frequencyType: 'perYear',
    frequencyValue: 2,
    everyXValue: 1,
    monthsMarked: 12,
  });

  const addSpecies = () => {
    const newSpecies: SpeciesData = {
      ...initialSpeciesData,
      id: Date.now() + speciesData.length
    };
    // Calculate initial dried volume (no change needed here)
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

  // --- Update Handler ---
  const updateSpeciesField = useCallback((idToUpdate: number, field: keyof SpeciesData, value: string | number) => {
    setSpeciesData(currentData => {
      return currentData.map(species => {
        if (species.id !== idToUpdate) {
          return species;
        }

        const updatedSpecies: SpeciesData = { ...species };

        switch (field) {
          case 'frequencyType':
            updatedSpecies.frequencyType = value as FrequencyType;
            break;
          case 'frequencyValue':
          case 'everyXValue':
          case 'monthsMarked':
            updatedSpecies[field] = parseInt(String(value), 10) || 0;
            if (field === 'monthsMarked') {
                updatedSpecies.monthsMarked = Math.max(1, Math.min(12, updatedSpecies.monthsMarked));
            }
             if (field === 'frequencyValue' || field === 'everyXValue') {
                updatedSpecies[field] = Math.max(1, updatedSpecies[field]); // Ensure at least 1
            }
            break;

          case 'freshVolume':
            const numValue = parseFloat(String(value)) || 0;
            updatedSpecies.freshVolume = numValue;
            updatedSpecies.driedVolume = (updatedSpecies.freshToDryRatio > 0 && updatedSpecies.freshToDryRatio !== Infinity)
              ? numValue / updatedSpecies.freshToDryRatio
              : 0;
            break;

          case 'ratioInput':
            updatedSpecies.ratioInput = String(value);
            const newNumericRatio = parseRatio(String(value));
            updatedSpecies.freshToDryRatio = newNumericRatio;
            updatedSpecies.driedVolume = (newNumericRatio > 0 && newNumericRatio !== Infinity)
              ? updatedSpecies.freshVolume / newNumericRatio
              : 0;
            break;

          case 'driedVolume':
            const driedNumValue = parseFloat(String(value)) || 0;
            updatedSpecies.driedVolume = driedNumValue;
            if (driedNumValue > 0 && updatedSpecies.freshVolume > 0) {
              const calculatedRatio = updatedSpecies.freshVolume / driedNumValue;
              updatedSpecies.freshToDryRatio = calculatedRatio;
              // Update ratio input to reflect the change, formatted nicely
              updatedSpecies.ratioInput = formatNumber(calculatedRatio, 1) + ':1'; // Or just the number
            } else if (driedNumValue > 0 && updatedSpecies.freshVolume <= 0) {
               // Cannot calculate ratio if fresh volume is 0
               updatedSpecies.freshToDryRatio = Infinity; // Or keep previous? Or set to 1? Decide behavior.
               // updatedSpecies.ratioInput = "∞"; // Indicate infinity or uncalculable
            } else if (driedNumValue <= 0) {
                // If dried volume is set to 0, ratio might become infinity or 0/0.
                // Maybe revert to the ratio derived from ratioInput if available?
                const ratioFromInput = parseRatio(updatedSpecies.ratioInput);
                updatedSpecies.freshToDryRatio = ratioFromInput;
                 // Or simply set driedVolume to 0 and leave ratio as is? Depends on desired UX.
            }
            break;

          case 'freshPrice':
          case 'driedPrice':
          case 'consumedVolume':
          case 'processedVolume':
            updatedSpecies[field] = parseFloat(String(value)) || 0;
            break;

          default: // Handles 'name'
            (updatedSpecies[field] as any) = String(value);
            break;
        }

        return updatedSpecies;
      });
    });
  }, []); // Keep empty dependency array

  // --- Modal Handling Functions ---
  const openFrequencyModal = (id: number) => {
    const speciesToEdit = speciesData.find(s => s.id === id);
    if (speciesToEdit) {
      setEditingSpeciesId(id);
      setModalFrequency({
        frequencyType: speciesToEdit.frequencyType,
        frequencyValue: speciesToEdit.frequencyValue,
        everyXValue: speciesToEdit.everyXValue,
        monthsMarked: speciesToEdit.monthsMarked,
      });
      setIsModalOpen(true);
    }
  };

  // --- NEW: Wrap closeFrequencyModal in useCallback ---
  const closeFrequencyModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingSpeciesId(null);
    // Optional: Reset modal form state if you don't want it to persist
    // setModalFrequency({ frequencyType: 'perYear', frequencyValue: 2, everyXValue: 1, monthsMarked: 12 });
  }, []); // No dependencies needed as it only uses state setters

  const handleModalFrequencyChange = (field: keyof typeof modalFrequency, value: string | number) => {
    setModalFrequency(prev => {
        const updated = { ...prev };
        if (field === 'frequencyType') {
            updated.frequencyType = value as FrequencyType;
            // Optional: Reset other values when type changes for clarity
            // if (value === 'perYear' || value === 'once') {
            //     updated.frequencyValue = (value === 'perYear' ? 2 : 1);
            // } else {
            //     updated.frequencyValue = 1;
            // }
            // updated.everyXValue = 1;
        } else {
            let numValue = parseInt(String(value), 10) || 0;
             // Add validation/clamping
            if (field === 'monthsMarked') numValue = Math.max(1, Math.min(12, numValue));
            if (field === 'frequencyValue' || field === 'everyXValue') numValue = Math.max(1, numValue); // Min 1
            updated[field] = numValue;
        }
        return updated;
    });
  };

  const saveFrequencyChanges = () => {
    if (editingSpeciesId !== null) {
      updateSpeciesField(editingSpeciesId, 'frequencyType', modalFrequency.frequencyType);
      updateSpeciesField(editingSpeciesId, 'frequencyValue', modalFrequency.frequencyValue);
      updateSpeciesField(editingSpeciesId, 'everyXValue', modalFrequency.everyXValue);
      updateSpeciesField(editingSpeciesId, 'monthsMarked', modalFrequency.monthsMarked);
    }
    closeFrequencyModal();
  };


  // --- Calculation Function ---
  const calculateTotals = (): { calculatedData: CalculatedSpeciesData[], totalAnnualIncome: number } => {
    let totalAnnualIncome = 0;

    const calculatedData: CalculatedSpeciesData[] = speciesData.map(species => {
      const salesPerYear = calculateAnnualSales(species);

      const freshRevenuePerCycle = species.freshVolume * species.freshPrice;
      const driedRevenuePerCycle = species.driedVolume * species.driedPrice;
      const totalRevenuePerCycle = freshRevenuePerCycle + driedRevenuePerCycle;

      const annualRevenue = totalRevenuePerCycle * salesPerYear;

      totalAnnualIncome += annualRevenue;

      return {
        ...species,
        freshRevenuePerCycle,
        driedRevenuePerCycle,
        totalRevenuePerCycle,
        salesPerYear, // Store the calculated value
        annualRevenue
      };
    });

    return { calculatedData, totalAnnualIncome };
  };

  const { calculatedData, totalAnnualIncome } = calculateTotals(); // Calculation runs on every render

  // Generic input handlers remain the same
   const handleNumericInputChange = (id: number, field: keyof SpeciesData, e: React.ChangeEvent<HTMLInputElement>) => {
      updateSpeciesField(id, field, e.target.value);
  };
   const handleTextInputChange = (id: number, field: keyof SpeciesData, e: React.ChangeEvent<HTMLInputElement>) => {
       updateSpeciesField(id, field, e.target.value);
   };

   // --- NEW: useEffect for Escape key handling ---
   useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFrequencyModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    // Cleanup function: remove listener when modal closes or component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, closeFrequencyModal]); // Dependencies


  // --- Render JSX ---
  return (
    <div className="max-w-full mx-auto p-4 font-sans">
      {/* ... (rest of the component preamble, table headers etc. remains the same) ... */}
      <h1 className="text-xl font-bold mb-6 text-center text-teal-800">Seaweed Farming Income Calculator</h1>

      {/* Form 4 Equivalent - Production Data */}
      <Section title="PART 5: Seaweed Farming Production Data">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border text-sm">
            <thead className="bg-teal-50">
              <tr>
                <th className="border p-2"><LabelWithTooltip tooltip="Name of the seaweed species">Species</LabelWithTooltip></th>
                <th className="border p-2">
                  <LabelWithTooltip tooltip="Frequency of sales per year. Click 'Edit' to configure details (e.g., per month, per week, specific number of times).">
                    Sales Frequency (per Year)
                  </LabelWithTooltip>
                </th>
                <th className="border p-2"><LabelWithTooltip tooltip="Expected FRESH seaweed volume SOLD per sale event/cycle, kg">Fresh Vol Sold (kg)</LabelWithTooltip></th>
                <th className="border p-2"><LabelWithTooltip tooltip="Selling price per kg FRESH wet seaweed">Fresh Price (₱/kg)</LabelWithTooltip></th>
                <th className="border p-2"><LabelWithTooltip tooltip="Ratio of FRESH weight to DRIED weight. Enter as a number (e.g., 5) or ratio (e.g., 7:1). Changing this or Fresh Volume updates Dried Volume.">Fresh:Dry Ratio</LabelWithTooltip></th>
                <th className="border p-2"><LabelWithTooltip tooltip="Expected volume of DRIED seaweed SOLD per sale event/cycle, kg. Changing this updates the effective Fresh:Dry ratio based on Fresh Volume.">Dried Vol Sold (kg)</LabelWithTooltip></th>
                <th className="border p-2"><LabelWithTooltip tooltip="Selling price per kg DRIED seaweed">Dried Price (₱/kg)</LabelWithTooltip></th>
                <th className="border p-2"><LabelWithTooltip tooltip="How many kg was eaten/consumed (per cycle/harvest)? Optional data.">Consumed (kg)</LabelWithTooltip></th>
                <th className="border p-2"><LabelWithTooltip tooltip="How many kg was processed into chips, etc. (per cycle/harvest)? Optional data.">Processed (kg)</LabelWithTooltip></th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {calculatedData.map((species) => (
                <tr key={species.id}>
                  {/* Species Name */}
                  <td className="border p-2">
                    <input
                      type="text"
                      className="w-full p-1 border rounded min-w-[150px]"
                      placeholder="e.g., Kappaphycus alvarezii"
                      value={species.name}
                      onChange={(e) => handleTextInputChange(species.id, 'name', e)}
                    />
                  </td>
                  {/* Frequency Cell */}
                  <td className="border p-2 text-center align-middle">
                    <div className='flex flex-col items-center gap-1'>
                      <span className="text-xs whitespace-nowrap">
                        {getFrequencyDescription(species)}
                      </span>
                      <span className='text-xs font-semibold'>
                        (~{formatNumber(species.salesPerYear, 1)} sales/yr)
                      </span>
                      <button
                        type="button"
                        onClick={() => openFrequencyModal(species.id)}
                        className="mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded border border-blue-300"
                      >
                        Edit Freq.
                      </button>
                    </div>
                  </td>
                  {/* Other cells */}
                  <td className="border p-2">
                    <input type="number" min="0" step="any" className="w-24 p-1 border rounded" value={species.freshVolume} onChange={(e) => handleNumericInputChange(species.id, 'freshVolume', e)} />
                  </td>
                   <td className="border p-2">
                    <input type="number" min="0" step="any" className="w-24 p-1 border rounded" value={species.freshPrice} onChange={(e) => handleNumericInputChange(species.id, 'freshPrice', e)} />
                  </td>
                  <td className="border p-2">
                     <input type="text" className="w-20 p-1 border rounded" placeholder="e.g., 5 or 7:1" value={species.ratioInput} onChange={(e) => handleTextInputChange(species.id, 'ratioInput', e)} />
                  </td>
                   <td className="border p-2">
                    <input type="number" min="0" step="any" className="w-24 p-1 border rounded" value={species.driedVolume} onChange={(e) => handleNumericInputChange(species.id, 'driedVolume', e)} />
                  </td>
                  <td className="border p-2">
                     <input type="number" min="0" step="any" className="w-24 p-1 border rounded" value={species.driedPrice} onChange={(e) => handleNumericInputChange(species.id, 'driedPrice', e)} />
                  </td>
                  <td className="border p-2">
                     <input type="number" min="0" step="any" className="w-24 p-1 border rounded" value={species.consumedVolume} onChange={(e) => handleNumericInputChange(species.id, 'consumedVolume', e)} />
                  </td>
                   <td className="border p-2">
                     <input type="number" min="0" step="any" className="w-24 p-1 border rounded" value={species.processedVolume} onChange={(e) => handleNumericInputChange(species.id, 'processedVolume', e)} />
                  </td>
                  {/* Actions Cell */}
                  <td className="border p-2 text-center">
                    <button type="button" onClick={() => removeSpecies(species.id)} className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed" disabled={speciesData.length === 1} aria-label={`Remove ${species.name || 'species'}`}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                 {/* Adjust colspan */}
                <td colSpan={10} className="border p-2">
                  <button type="button" onClick={addSpecies} className="flex items-center text-green-600 hover:text-green-800 font-medium">
                    <span className="mr-1 text-xl">➕</span> Add Species
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>

      {/* --- Frequency Editor Modal --- */}
      {/* --- NEW: Added onClick handler to the backdrop --- */}
      {isModalOpen && editingSpeciesId !== null && (
        <div
          className="fixed inset-0 bg-black/30 flex justify-center items-center p-4 z-50" // Slightly darker backdrop, added blur
          onClick={(e) => {
            // Close if the click is directly on the backdrop, not the content
            if (e.target === e.currentTarget) {
              closeFrequencyModal();
            }
          }}
          role="dialog" // Add role for accessibility
          aria-modal="true" // Indicate it's a modal dialog
          aria-labelledby="frequency-modal-title" // Reference the title for screen readers
        >
          {/* --- Modal Content --- */}
          {/* Stop propagation to prevent backdrop click when clicking inside */}
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
            >
            <h3
              id="frequency-modal-title" // ID for aria-labelledby
              className="text-lg font-medium mb-4 text-gray-800"
              >
              Edit Sales Frequency for {speciesData.find(s => s.id === editingSpeciesId)?.name || 'Species'}
            </h3>

            <div className="space-y-4">
               {/* Months Marked */}
               <div>
                 <LabelWithTooltip tooltip="Over how many months *in total per year* do sales typically occur?">
                    Active Months per Year (1-12)
                  </LabelWithTooltip>
                  <input
                    type="number" min="1" max="12" step="1"
                    value={modalFrequency.monthsMarked}
                    onChange={(e) => handleModalFrequencyChange('monthsMarked', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded bg-white"
                  />
               </div>

              {/* Frequency Type */}
              <div>
                 <LabelWithTooltip tooltip="Select how sales frequency is measured *during* the active months.">
                   Frequency Type
                 </LabelWithTooltip>
                <select
                  value={modalFrequency.frequencyType}
                  onChange={(e) => handleModalFrequencyChange('frequencyType', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded bg-white text-gray-700"
                >
                   <option value="perYear">Times per Year (Total)</option>
                   <option value="perMonth">Times per Month</option>
                   <option value="perWeek">Times per Week</option>
                   <option value="everyXMonths">Every X Months</option>
                   <option value="everyXWeeks">Every X Weeks</option>
                   <option value="once">Once (Total)</option>
                 </select>
              </div>

              {/* Conditional Inputs */}
               {(modalFrequency.frequencyType === 'perMonth' || modalFrequency.frequencyType === 'perWeek' || modalFrequency.frequencyType === 'perYear') && (
                <div>
                   <LabelWithTooltip tooltip={`How many times per ${modalFrequency.frequencyType === 'perWeek' ? 'week' : (modalFrequency.frequencyType === 'perMonth' ? 'month' : 'year')}?`}>
                     Times
                   </LabelWithTooltip>
                   <input
                    type="number" min="1" step="1"
                    value={modalFrequency.frequencyValue}
                    onChange={(e) => handleModalFrequencyChange('frequencyValue', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded bg-white"
                   />
                </div>
              )}

               {(modalFrequency.frequencyType === 'everyXMonths' || modalFrequency.frequencyType === 'everyXWeeks') && (
                 <div>
                   <LabelWithTooltip tooltip={`Sales occur every how many ${modalFrequency.frequencyType === 'everyXWeeks' ? 'weeks' : 'months'} (during active months)?`}>
                     Interval (X)
                   </LabelWithTooltip>
                   <input
                     type="number" min="1" step="1"
                     value={modalFrequency.everyXValue}
                     onChange={(e) => handleModalFrequencyChange('everyXValue', e.target.value)}
                     className="w-full p-2 border border-gray-300 rounded bg-white"
                   />
                 </div>
               )}

               {/* Display Calculated Annual Sales */}
                <div className="mt-4 p-2 bg-gray-100 rounded border text-sm">
                    Calculated Annual Sales: <span className='font-semibold'>{formatNumber(calculateAnnualSales(modalFrequency), 1)}</span> times/year
                    <p className='text-xs text-gray-500'>{getFrequencyDescription(modalFrequency)}</p>
                </div>

            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeFrequencyModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveFrequencyChanges}
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
              >
                Save Frequency
              </button>
            </div>
          </div> {/* End Modal Content */}
        </div> // End Modal Backdrop
      )}

      {/* --- Annual Income Calculation Section (PART 5) --- */}
      {/* (No changes needed in the rest of the component) */}
       <Section title="Annual Income Calculation">
         <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
           <h3 className="font-semibold mb-2">Calculation Logic:</h3>
           <p>Vol per Sale (Fresh/Dried) × Price (Fresh/Dried) = Revenue per Sale (Fresh/Dried)</p>
           <p>Rev per Sale (Fresh + Dried) = Total Revenue per Sale</p>
           <p>Total Rev per Sale × (Calculated Annual Sales based on Frequency Settings) = Annual Income</p>
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
                   <LabelWithTooltip tooltip="Total volume of DRIED seaweed sold per year, calculated as Volume per Sale (kg) × Calculated Annual Sales">
                     Total Volume (kg/yr)
                   </LabelWithTooltip>
                 </th>
                <th className="border p-2">Total Revenue (₱/yr)</th>
                <th className="border p-2">Avg Price (₱/kg)</th>
                <th className="border p-2">
                   <LabelWithTooltip tooltip="Total volume of FRESH seaweed sold per year, calculated as Volume per Sale (kg) × Calculated Annual Sales">
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
                const driedVolText = `${formatNumber(species.driedVolume, 1)}kg × ${formatNumber(species.salesPerYear, 1)} sales = ${formatNumber(driedVolumePerYear, 1)} kg`;
                const freshVolText = `${formatNumber(species.freshVolume, 1)}kg × ${formatNumber(species.salesPerYear, 1)} sales = ${formatNumber(freshVolumePerYear, 1)} kg`;

                return (
                  <tr key={species.id}>
                    <td className="border p-2 font-medium">{species.name || `Species ${species.id}`}</td>
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
                <td className="border p-2 font-bold" colSpan={7}>Total Annual Income (All Species)</td>
                <td className="border p-2 text-right font-bold text-lg">₱{formatNumber(totalAnnualIncome)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>

      {/* --- Marketing Section (PART 6 - Single Sale Cycle) --- */}
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
                  {/* Dried Row */}
                  <tr className={species.driedVolume > 0 ? "bg-gray-50" : "bg-gray-50 opacity-50"}>
                    <td className="border p-2 align-top" rowSpan={2}>{species.name || `Species ${species.id}`}</td>
                    <td className="border p-2 font-medium text-center align-middle">D</td>
                    <td className="border p-2 text-right align-middle">{formatNumber(species.driedVolume, 1)} kg</td>
                    <td className="border p-2 text-right align-middle">₱{formatNumber(species.driedPrice)}</td>
                    <td className="border p-2 text-right font-semibold align-middle">₱{formatNumber(species.driedRevenuePerCycle)}</td>
                  </tr>
                  {/* Fresh Row */}
                   <tr className={species.freshVolume > 0 ? "" : "opacity-50"}>
                    <td className="border p-2 font-medium text-center align-middle">F</td>
                    <td className="border p-2 text-right align-middle">{formatNumber(species.freshVolume, 1)} kg</td>
                    <td className="border p-2 text-right align-middle">₱{formatNumber(species.freshPrice)}</td>
                    <td className="border p-2 text-right font-semibold align-middle">₱{formatNumber(species.freshRevenuePerCycle)}</td>
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

      {/* --- Summary Card --- */}
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
                <div className="text-xs text-gray-500 mt-1">(Income per Cycle × Calculated Sales per Year, summed for all species)</div>
                </div>
            </div>
         </div>
        <ul className="space-y-1 text-sm mt-4 list-disc pl-5 text-gray-700">
          <li><span className="font-medium">Income per Sale Cycle</span> = (Fresh Vol × Fresh Price) + (Dried Vol × Dried Price)</li>
          <li><span className="font-medium">Annual Income</span> = Income per Sale Cycle × (Calculated Annual Sales based on Frequency Settings)</li>
          <li>Entering Fresh Vol & Ratio calculates Dried Vol.</li>
          <li>Entering Dried Vol calculates the effective Ratio (based on Fresh Vol).</li>
          <li>Use the <span className='font-semibold'>'Edit Freq.'</span> button in Part 5 to set how often sales occur per year.</li>
        </ul>
      </div>
    </div>
  );
}

export default SeaweedFarmingCalculator;