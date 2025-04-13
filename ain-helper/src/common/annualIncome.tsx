import React, { useState, useCallback, useEffect } from 'react';
import LabelWithTooltip from './ui/labelWithTooltip'; // Assuming these UI components exist
import Section from './ui/sectionComponent';
import { formatNumber, CONFIG } from '../utils'; // Assuming utils exist

// Define the frequency type
type FrequencyType = 'perMonth' | 'perWeek' | 'everyXMonths' | 'everyXWeeks' | 'once' | 'perYear';

// Interface for SpeciesData (Input State) - No change needed here
interface SpeciesData {
  id: number;
  name: string;
  frequencyType: FrequencyType;
  frequencyValue: number;
  everyXValue: number;
  monthsMarked: number;
  freshVolume: number;
  freshPrice: number;
  freshWeightForDrying: number;
  driedVolume: number;
  driedPrice: number;
  consumedVolume: number;
  processedVolume: number;
}

// Interface for calculated data (Derived State) - Remove effective ratio
interface CalculatedSpeciesData extends SpeciesData {
  // effectiveFreshToDryRatio: number; // REMOVED
  totalHarvestVolume: number;
  freshRevenuePerCycle: number;
  driedRevenuePerCycle: number;
  totalRevenuePerCycle: number;
  salesPerYear: number;
  annualRevenue: number;
}

// Initial state - No change needed here
const initialSpeciesData: Omit<SpeciesData, 'id'> = {
  name: '',
  frequencyType: 'perYear',
  frequencyValue: 2,
  everyXValue: 1,
  monthsMarked: 12,
  freshVolume: 0,
  freshPrice: 0,
  freshWeightForDrying: 0,
  driedVolume: 0,
  driedPrice: 0,
  consumedVolume: 0,
  processedVolume: 0,
};

// Helper functions (parseRatio, calculateEffectiveRatio, calculateAnnualSales, getFrequencyDescription)
// remain the same as in the previous version.
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
  return Infinity;
};

const calculateAnnualSales = (species: Pick<SpeciesData, 'frequencyType' | 'frequencyValue' | 'everyXValue' | 'monthsMarked'>): number => {
  const { frequencyType, frequencyValue, everyXValue, monthsMarked } = species;
  const validMonths = Math.max(1, Math.min(12, monthsMarked || 12));
  const val = Math.max(1, frequencyValue || 1);
  const xVal = Math.max(1, everyXValue || 1);
  const weeksPerMonth = CONFIG?.NUMBER_OF_WEEKS_PER_MONTH ?? (52/12);

  switch (frequencyType) {
    case 'once': return 1;
    case 'perYear': return val;
    case 'perMonth': return val * validMonths;
    case 'perWeek': return val * validMonths * weeksPerMonth;
    case 'everyXMonths': return validMonths >= xVal ? Math.floor(validMonths / xVal) : 0;
    case 'everyXWeeks':
      const totalWeeksInMarkedMonths = validMonths * weeksPerMonth;
      return totalWeeksInMarkedMonths >= xVal ? Math.floor(totalWeeksInMarkedMonths / xVal) : 0;
    default: return 0;
  }
};

const getFrequencyDescription = (species: Pick<SpeciesData, 'frequencyType' | 'frequencyValue' | 'everyXValue' | 'monthsMarked'>): string => {
    const { frequencyType, frequencyValue, everyXValue, monthsMarked } = species;
    const val = frequencyValue || 1;
    const xVal = everyXValue || 1;
    const months = monthsMarked || 12;
    const monthText = `${months} ${months === 1 ? 'mo' : 'mos'}`;

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

  // State for Frequency Modal
  const [isFrequencyModalOpen, setIsFrequencyModalOpen] = useState(false);
  const [editingFrequencySpeciesId, setEditingFrequencySpeciesId] = useState<number | null>(null);
  const [modalFrequency, setModalFrequency] = useState<Pick<SpeciesData, 'frequencyType' | 'frequencyValue' | 'everyXValue' | 'monthsMarked'>>({
    frequencyType: 'perYear', frequencyValue: 2, everyXValue: 1, monthsMarked: 12,
  });

  // State for Dried Volume Helper Modal
  const [isDriedVolumeModalOpen, setIsDriedVolumeModalOpen] = useState(false);
  const [editingDriedVolumeSpeciesId, setEditingDriedVolumeSpeciesId] = useState<number | null>(null);
  const [modalRatioInput, setModalRatioInput] = useState<string>('5');

  const addSpecies = () => {
    setSpeciesData(currentData => [
        ...currentData,
        { ...initialSpeciesData, id: Date.now() + currentData.length }
    ]);
  };

  const removeSpecies = (idToRemove: number) => {
    if (speciesData.length > 1) {
      setSpeciesData(currentData => currentData.filter(species => species.id !== idToRemove));
    }
  };

  // --- Update Handler (remains the same) ---
  const updateSpeciesField = useCallback((idToUpdate: number, field: keyof SpeciesData, value: string | number) => {
    setSpeciesData(currentData =>
      currentData.map(species => {
        if (species.id !== idToUpdate) {
          return species;
        }
        const updatedSpecies = { ...species };
        switch (field) {
          case 'frequencyType': updatedSpecies.frequencyType = value as FrequencyType; break;
          case 'frequencyValue': case 'everyXValue': case 'monthsMarked':
            let numValFreq = parseInt(String(value), 10) || 0;
            if (field === 'monthsMarked') numValFreq = Math.max(1, Math.min(12, numValFreq));
            else numValFreq = Math.max(1, numValFreq);
            updatedSpecies[field] = numValFreq;
            break;
          case 'freshVolume': case 'freshPrice': case 'freshWeightForDrying':
          case 'driedVolume': case 'driedPrice': case 'consumedVolume': case 'processedVolume':
            updatedSpecies[field] = parseFloat(String(value)) || 0;
            break;
          case 'name': updatedSpecies.name = String(value); break;
          default: break;
        }
        return updatedSpecies;
      })
    );
  }, []);

  // --- Frequency Modal Handlers (remain the same) ---
  const openFrequencyModal = (id: number) => {
    const speciesToEdit = speciesData.find(s => s.id === id);
    if (speciesToEdit) {
      setEditingFrequencySpeciesId(id);
      setModalFrequency({
        frequencyType: speciesToEdit.frequencyType,
        frequencyValue: speciesToEdit.frequencyValue,
        everyXValue: speciesToEdit.everyXValue,
        monthsMarked: speciesToEdit.monthsMarked,
      });
      setIsFrequencyModalOpen(true);
    }
  };
  const closeFrequencyModal = useCallback(() => {
    setIsFrequencyModalOpen(false);
    setEditingFrequencySpeciesId(null);
  }, []);
  const handleModalFrequencyChange = (field: keyof typeof modalFrequency, value: string | number) => {
    setModalFrequency(prev => { /* logic unchanged */
        const updated = { ...prev };
        if (field === 'frequencyType') {
            updated.frequencyType = value as FrequencyType;
        } else {
            let numValue = parseInt(String(value), 10) || 0;
            if (field === 'monthsMarked') numValue = Math.max(1, Math.min(12, numValue));
            else numValue = Math.max(1, numValue);
            updated[field] = numValue;
        }
        return updated;
    });
  };
   const saveFrequencyChanges = () => { /* logic unchanged */
    if (editingFrequencySpeciesId !== null) {
      updateSpeciesField(editingFrequencySpeciesId, 'frequencyType', modalFrequency.frequencyType);
      updateSpeciesField(editingFrequencySpeciesId, 'frequencyValue', modalFrequency.frequencyValue);
      updateSpeciesField(editingFrequencySpeciesId, 'everyXValue', modalFrequency.everyXValue);
      updateSpeciesField(editingFrequencySpeciesId, 'monthsMarked', modalFrequency.monthsMarked);
    }
    closeFrequencyModal();
  };

  // --- Dried Volume Modal Handlers (remain the same) ---
   const openDriedVolumeModal = (id: number) => {
     const speciesToEdit = speciesData.find(s => s.id === id);
     if (speciesToEdit) {
       setEditingDriedVolumeSpeciesId(id);
       // Calculate effective ratio just for pre-filling the modal
       const currentRatio = (speciesToEdit.driedVolume > 0 && speciesToEdit.freshWeightForDrying >= 0)
           ? speciesToEdit.freshWeightForDrying / speciesToEdit.driedVolume
           : Infinity;
       setModalRatioInput(isFinite(currentRatio) ? formatNumber(currentRatio, 1) : '5');
       setIsDriedVolumeModalOpen(true);
     }
   };
   const closeDriedVolumeModal = useCallback(() => {
    setIsDriedVolumeModalOpen(false);
    setEditingDriedVolumeSpeciesId(null);
   }, []);
   const handleModalRatioInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       setModalRatioInput(e.target.value);
   };
   const saveDriedVolumeFromRatio = () => { /* logic unchanged */
       if (editingDriedVolumeSpeciesId === null) return;
       const speciesToUpdate = speciesData.find(s => s.id === editingDriedVolumeSpeciesId);
       if (!speciesToUpdate) return;
       const ratio = parseRatio(modalRatioInput);
       if (isFinite(ratio) && ratio > 0) {
           const calculatedDriedVolume = speciesToUpdate.freshWeightForDrying / ratio;
           updateSpeciesField(editingDriedVolumeSpeciesId, 'driedVolume', formatNumber(calculatedDriedVolume, 2));
       } else {
           console.warn("Invalid ratio entered in modal:", modalRatioInput);
       }
       closeDriedVolumeModal();
   };


  // --- Calculation Function ---
  const calculateTotals = (): { calculatedData: CalculatedSpeciesData[], totalAnnualIncome: number } => {
    let totalAnnualIncome = 0;

    const calculatedData: CalculatedSpeciesData[] = speciesData.map(species => {
      const salesPerYear = calculateAnnualSales(species);

      // Calculate Total Harvest Volume based on inputs
      const totalHarvestVolume = species.freshVolume + species.freshWeightForDrying + species.consumedVolume + species.processedVolume;

      // Calculate revenues based on current volumes and prices
      const freshRevenuePerCycle = species.freshVolume * species.freshPrice;
      const driedRevenuePerCycle = species.driedVolume * species.driedPrice;
      const totalRevenuePerCycle = freshRevenuePerCycle + driedRevenuePerCycle;
      const annualRevenue = totalRevenuePerCycle * salesPerYear;

      totalAnnualIncome += annualRevenue;

      return {
        ...species,
        // effectiveFreshToDryRatio, // REMOVED
        totalHarvestVolume,
        freshRevenuePerCycle,
        driedRevenuePerCycle,
        totalRevenuePerCycle,
        salesPerYear,
        annualRevenue
      };
    });

    return { calculatedData, totalAnnualIncome };
  };

  const { calculatedData, totalAnnualIncome } = calculateTotals();

  // Generic input handlers (remain the same)
   const handleNumericInputChange = (id: number, field: keyof SpeciesData, e: React.ChangeEvent<HTMLInputElement>) => {
      updateSpeciesField(id, field, e.target.value);
  };
   const handleTextInputChange = (id: number, field: keyof SpeciesData, e: React.ChangeEvent<HTMLInputElement>) => {
       updateSpeciesField(id, field, e.target.value);
   };

   // --- UseEffect for Escape key handling (remains the same) ---
   useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
          if (isFrequencyModalOpen) closeFrequencyModal();
          if (isDriedVolumeModalOpen) closeDriedVolumeModal();
      }
    };
    if (isFrequencyModalOpen || isDriedVolumeModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFrequencyModalOpen, isDriedVolumeModalOpen, closeFrequencyModal, closeDriedVolumeModal]);


  // --- Render JSX ---
  return (
    <div className="max-w-full mx-auto p-4 font-sans">
      <h1 className="text-xl font-bold mb-6 text-center text-teal-800">Seaweed Farming Income Calculator</h1>

      {/* Part 5: Production Data Table - UPDATED STRUCTURE */}
      <Section title="PART 5: Seaweed Farming Production Data">
        <div className="overflow-x-auto">
          {/* Apply small text size to table for compactness */}
          <table className="min-w-full border-collapse border text-xs">
            <thead className="bg-teal-50">
              <tr>
                {/* UPDATED Headers & Order */}
                <th className="border p-1.5 align-bottom"><LabelWithTooltip tooltip="Name of the seaweed species">Species</LabelWithTooltip></th>
                <th className="border p-1.5 align-bottom">
                  <LabelWithTooltip tooltip="Frequency of sales per year. Click 'Edit' to configure details.">
                    Sales Frequency (per Year)
                  </LabelWithTooltip>
                </th>
                <th className="border p-1.5 align-bottom">
                    <LabelWithTooltip tooltip="Volume (kg) and Price (₱/kg) of FRESH seaweed SOLD per cycle.">
                        Fresh Sold (kg / ₱)
                    </LabelWithTooltip>
                </th>
                <th className="border p-1.5 align-bottom">
                    <LabelWithTooltip tooltip="Volume (kg) and Price (₱/kg) of DRIED seaweed SOLD per cycle. Click 'Calc' to determine Volume from Fresh Wt. & Ratio.">
                        Dried Sold (kg / ₱)
                    </LabelWithTooltip>
                </th>
                <th className="border p-1.5 align-bottom"><LabelWithTooltip tooltip="Initial FRESH weight allocated for drying per cycle (kg)">Fresh Wt. for Drying (kg)</LabelWithTooltip></th>
                <th className="border p-1.5 align-bottom"><LabelWithTooltip tooltip="Volume eaten/consumed per cycle (kg). Optional.">Consumed (kg)</LabelWithTooltip></th>
                <th className="border p-1.5 align-bottom"><LabelWithTooltip tooltip="Volume processed into other products per cycle (kg). Optional.">Processed (kg)</LabelWithTooltip></th>
                <th className="border p-1.5 align-bottom bg-gray-50">
                  <LabelWithTooltip tooltip="Calculated total FRESH weight harvested per cycle = Sold Fresh + Fresh Wt. for Drying + Consumed + Processed">
                     Total Harvest (kg/cycle)
                  </LabelWithTooltip>
                </th>
                <th className="border p-1.5 align-bottom">Actions</th>
              </tr>
            </thead>
            <tbody>
              {calculatedData.map((species) => (
                <tr key={species.id}>
                  {/* Species Name */}
                  <td className="border p-1.5 align-middle">
                    <input type="text" className="w-full p-1 border rounded min-w-[120px]" placeholder="e.g., Kappaphycus" value={species.name} onChange={(e) => handleTextInputChange(species.id, 'name', e)} />
                  </td>
                  {/* Frequency */}
                  <td className="border p-1.5 text-center align-middle">
                    <div className='flex flex-col items-center gap-0.5'> {/* Reduced gap */}
                      <span className="whitespace-nowrap">{getFrequencyDescription(species)}</span>
                      <span className='font-semibold'>(~{formatNumber(species.salesPerYear, 1)}/yr)</span>
                      <button type="button" onClick={() => openFrequencyModal(species.id)} className="mt-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded border border-blue-300 text-[10px]"> {/* Smaller button */}
                          Edit Freq.
                      </button>
                    </div>
                  </td>
                  {/* Combined Fresh Vol/Price Cell */}
                  <td className="border p-1.5 align-middle">
                     <div className="flex flex-col space-y-1"> {/* Stack items vertically */}
                         {/* Fresh Volume Input */}
                         <div className="flex items-center">
                             <span className="w-6 text-gray-500 mr-1">kg:</span>
                             <input
                                type="number" min="0" step="any"
                                className="w-20 p-1 border rounded"
                                value={species.freshVolume}
                                onChange={(e) => handleNumericInputChange(species.id, 'freshVolume', e)}
                                aria-label="Fresh Volume Sold (kg)"
                             />
                         </div>
                          {/* Fresh Price Input */}
                         <div className="flex items-center">
                            <span className="w-6 text-gray-500 mr-1">₱:</span>
                            <input
                                type="number" min="0" step="any"
                                className="w-20 p-1 border rounded"
                                value={species.freshPrice}
                                onChange={(e) => handleNumericInputChange(species.id, 'freshPrice', e)}
                                aria-label="Fresh Price (per kg)"
                            />
                         </div>
                     </div>
                  </td>
                   {/* Combined Dried Vol/Price Cell */}
                  <td className="border p-1.5 align-middle">
                     <div className="flex flex-col space-y-1"> {/* Stack items vertically */}
                         {/* Dried Volume Input with Calc Button */}
                         <div className="flex items-center">
                              <span className="w-6 text-gray-500 mr-1">kg:</span>
                              <div className="flex items-center space-x-1">
                                 <input
                                     type="number" min="0" step="any"
                                     className="w-16 p-1 border rounded" /* Slightly narrower */
                                     value={species.driedVolume}
                                     onChange={(e) => handleNumericInputChange(species.id, 'driedVolume', e)}
                                     aria-label="Dried Volume Sold (kg)"
                                 />
                                 <button
                                     type="button"
                                     onClick={() => openDriedVolumeModal(species.id)}
                                     className="px-1 py-0.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded border border-indigo-300 text-[10px]" /* Smaller */
                                     title="Calculate Dried Volume from Ratio"
                                 >
                                     Calc
                                 </button>
                             </div>
                         </div>
                         {/* Dried Price Input */}
                         <div className="flex items-center">
                             <span className="w-6 text-gray-500 mr-1">₱:</span>
                             <input
                                 type="number" min="0" step="any"
                                 className="w-20 p-1 border rounded"
                                 value={species.driedPrice}
                                 onChange={(e) => handleNumericInputChange(species.id, 'driedPrice', e)}
                                 aria-label="Dried Price (per kg)"
                             />
                         </div>
                     </div>
                  </td>
                  {/* Fresh Wt. for Drying */}
                  <td className="border p-1.5 align-middle">
                     <input type="number" min="0" step="any" className="w-20 p-1 border rounded" value={species.freshWeightForDrying} onChange={(e) => handleNumericInputChange(species.id, 'freshWeightForDrying', e)} />
                  </td>
                  {/* Consumed */}
                  <td className="border p-1.5 align-middle">
                     <input type="number" min="0" step="any" className="w-20 p-1 border rounded" value={species.consumedVolume} onChange={(e) => handleNumericInputChange(species.id, 'consumedVolume', e)} />
                  </td>
                  {/* Processed */}
                  <td className="border p-1.5 align-middle">
                     <input type="number" min="0" step="any" className="w-20 p-1 border rounded" value={species.processedVolume} onChange={(e) => handleNumericInputChange(species.id, 'processedVolume', e)} />
                  </td>
                   {/* Total Harvest (Calculated) */}
                  <td className="border p-1.5 text-right bg-gray-100 align-middle font-medium">
                      {formatNumber(species.totalHarvestVolume, 1)}
                  </td>
                  {/* Actions */}
                  <td className="border p-1.5 text-center align-middle">
                    <button type="button" onClick={() => removeSpecies(species.id)} className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed" disabled={speciesData.length === 1} aria-label={`Remove ${species.name || 'species'}`}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                 {/* UPDATE colspan (Now 9 columns) */}
                <td colSpan={9} className="border p-2"> {/* Adjusted colspan */}
                  <button type="button" onClick={addSpecies} className="flex items-center text-green-600 hover:text-green-800 font-medium text-sm"> {/* Slightly smaller text */}
                    <span className="mr-1 text-lg">➕</span> Add Species
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>

      {/* --- Frequency Editor Modal (remains the same) --- */}
      {isFrequencyModalOpen && editingFrequencySpeciesId !== null && (
         <div className="fixed inset-0 bg-black/30 flex justify-center items-center p-4 z-50" onClick={closeFrequencyModal}>
             <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                  <h3 id="frequency-modal-title" className="text-lg font-medium mb-4 text-gray-800">
                      Edit Sales Frequency for {speciesData.find(s => s.id === editingFrequencySpeciesId)?.name || 'Species'}
                  </h3>
                  <div className="space-y-4">
                     {/* Months Marked */}
                     <div>
                        <LabelWithTooltip tooltip="Over how many months *in total per year* do sales typically occur?">Active Months per Year (1-12)</LabelWithTooltip>
                        <input type="number" min="1" max="12" step="1" value={modalFrequency.monthsMarked} onChange={(e) => handleModalFrequencyChange('monthsMarked', e.target.value)} className="w-full p-2 border border-gray-300 rounded bg-white"/>
                     </div>
                    {/* Frequency Type */}
                    <div>
                        <LabelWithTooltip tooltip="Select how sales frequency is measured *during* the active months.">Frequency Type</LabelWithTooltip>
                        <select value={modalFrequency.frequencyType} onChange={(e) => handleModalFrequencyChange('frequencyType', e.target.value)} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-700">
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
                            <LabelWithTooltip tooltip={`How many times per ${modalFrequency.frequencyType === 'perWeek' ? 'week' : (modalFrequency.frequencyType === 'perMonth' ? 'month' : 'year')}?`}>Times</LabelWithTooltip>
                            <input type="number" min="1" step="1" value={modalFrequency.frequencyValue} onChange={(e) => handleModalFrequencyChange('frequencyValue', e.target.value)} className="w-full p-2 border border-gray-300 rounded bg-white"/>
                        </div>
                    )}
                    {(modalFrequency.frequencyType === 'everyXMonths' || modalFrequency.frequencyType === 'everyXWeeks') && (
                        <div>
                            <LabelWithTooltip tooltip={`Sales occur every how many ${modalFrequency.frequencyType === 'everyXWeeks' ? 'weeks' : 'months'} (during active months)?`}>Interval (X)</LabelWithTooltip>
                            <input type="number" min="1" step="1" value={modalFrequency.everyXValue} onChange={(e) => handleModalFrequencyChange('everyXValue', e.target.value)} className="w-full p-2 border border-gray-300 rounded bg-white"/>
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
                    <button type="button" onClick={closeFrequencyModal} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
                    <button type="button" onClick={saveFrequencyChanges} className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">Save Frequency</button>
                  </div>
             </div>
         </div>
      )}

       {/* --- Dried Volume Helper Modal (remains the same) --- */}
       {isDriedVolumeModalOpen && editingDriedVolumeSpeciesId !== null && (
           <div className="fixed inset-0 bg-black/30 flex justify-center items-center p-4 z-50" onClick={closeDriedVolumeModal} role="dialog" aria-modal="true" aria-labelledby="dried-volume-modal-title">
             <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
               <h3 id="dried-volume-modal-title" className="text-lg font-medium mb-4 text-gray-800">Calculate Dried Volume</h3>
                {(() => {
                    const species = speciesData.find(s => s.id === editingDriedVolumeSpeciesId);
                    const currentFreshForDrying = species?.freshWeightForDrying ?? 0;
                    return (
                       <div className="space-y-4">
                         <div>
                             <LabelWithTooltip tooltip="The fresh weight you entered that was set aside for drying.">Fresh Wt. for Drying (kg)</LabelWithTooltip>
                             <input type="number" readOnly value={formatNumber(currentFreshForDrying, 1)} className="w-full p-2 border border-gray-300 rounded bg-gray-100"/>
                         </div>
                         <div>
                           <LabelWithTooltip tooltip="Enter the ratio of FRESH weight to DRIED weight (e.g., '5' for 5:1, or '7:1').">Fresh : Dry Ratio</LabelWithTooltip>
                           <input type="text" placeholder="e.g., 5 or 7:1" value={modalRatioInput} onChange={handleModalRatioInputChange} className="w-full p-2 border border-gray-300 rounded bg-white" autoFocus/>
                         </div>
                         <div className="mt-4 p-2 bg-indigo-50 rounded border border-indigo-200 text-sm">
                             Calculated Dried Volume: <span className='font-semibold'>
                                 {(() => {
                                     const ratio = parseRatio(modalRatioInput);
                                     if (isFinite(ratio) && ratio > 0 && currentFreshForDrying > 0) {
                                         return `${formatNumber(currentFreshForDrying / ratio, 2)} kg`;
                                     } else if (currentFreshForDrying <= 0) {
                                         return 'Enter Fresh Wt. first';
                                     } else {
                                         return 'Invalid Ratio';
                                     }
                                 })()}
                             </span>
                         </div>
                       </div>
                    );
                })()}
               <div className="mt-6 flex justify-end space-x-3">
                 <button type="button" onClick={closeDriedVolumeModal} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
                 <button type="button" onClick={saveDriedVolumeFromRatio} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Update Dried Volume</button>
               </div>
             </div>
           </div>
       )}


      {/* --- Annual Income Calculation Section (remains the same structure) --- */}
       <Section title="Annual Income Calculation">
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
             <h3 className="font-semibold mb-2">Calculation Logic:</h3>
             <p>Total Harvest (per cycle) = Sold Fresh + Fresh Wt. for Drying + Consumed + Processed</p>
             <p>Revenue per Sale = (Fresh Vol Sold × Fresh Price) + (Dried Vol Sold × Dried Price)</p>
             <p>Annual Income = Revenue per Sale × Calculated Annual Sales (from Frequency)</p>
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
                <th className="border p-2"><LabelWithTooltip tooltip="Total DRIED sold/yr = Dried Vol per Sale × Sales/yr">Total Volume (kg/yr)</LabelWithTooltip></th>
                <th className="border p-2">Total Revenue (₱/yr)</th>
                <th className="border p-2">Avg Price (₱/kg)</th>
                <th className="border p-2"><LabelWithTooltip tooltip="Total FRESH sold/yr = Fresh Vol per Sale × Sales/yr">Total Volume (kg/yr)</LabelWithTooltip></th>
                <th className="border p-2">Total Revenue (₱/yr)</th>
              </tr>
            </thead>
            <tbody>
              {calculatedData.map((species) => {
                const driedVolumePerYear = species.driedVolume * species.salesPerYear;
                const freshVolumePerYear = species.freshVolume * species.salesPerYear;
                const driedRevenuePerYear = species.driedRevenuePerCycle * species.salesPerYear;
                const freshRevenuePerYear = species.freshRevenuePerCycle * species.salesPerYear;
                const driedVolText = `${formatNumber(driedVolumePerYear, 1)} kg`;
                const freshVolText = `${formatNumber(freshVolumePerYear, 1)} kg`;

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

       {/* --- Marketing Section (PART 6 - Single Sale Cycle) (remains the same structure) --- */}
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
                    {/* Adjust rowSpan based on whether Fresh row will be shown */}
                    <td className="border p-2 align-top" rowSpan={species.freshVolume > 0 ? 2 : 1}>{species.name || `Species ${species.id}`}</td>
                    <td className="border p-2 font-medium text-center align-middle">D</td>
                    <td className="border p-2 text-right align-middle">{formatNumber(species.driedVolume, 1)} kg</td>
                    <td className="border p-2 text-right align-middle">₱{formatNumber(species.driedPrice)}</td>
                    <td className="border p-2 text-right font-semibold align-middle">₱{formatNumber(species.driedRevenuePerCycle)}</td>
                  </tr>
                  {/* Fresh Row (Only show if fresh volume > 0) */}
                   {species.freshVolume > 0 && (
                     <tr className={species.freshVolume > 0 ? "" : "opacity-50"}>
                        {/* No Species Name needed if using rowSpan above */}
                        <td className="border p-2 font-medium text-center align-middle">F</td>
                        <td className="border p-2 text-right align-middle">{formatNumber(species.freshVolume, 1)} kg</td>
                        <td className="border p-2 text-right align-middle">₱{formatNumber(species.freshPrice)}</td>
                        <td className="border p-2 text-right font-semibold align-middle">₱{formatNumber(species.freshRevenuePerCycle)}</td>
                     </tr>
                   )}
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

      {/* --- Summary Card (remains the same structure) --- */}
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
                <div className="text-xs text-gray-500 mt-1">(Income per Cycle × Sales per Year, summed)</div>
                </div>
            </div>
         </div>
        <ul className="space-y-1 text-sm mt-4 list-disc pl-5 text-gray-700">
           <li><span className="font-medium">Total Harvest (per cycle)</span> is calculated based on inputs in Part 5.</li>
           <li><span className="font-medium">Income per Sale Cycle</span> = (Fresh Vol Sold × Fresh Price) + (Dried Vol Sold × Dried Price).</li>
          <li><span className="font-medium">Annual Income</span> = Income per Sale Cycle × (Calculated Annual Sales based on Frequency Settings).</li>
          <li>Enter <span className='font-semibold'>Fresh Wt. for Drying</span> (initial fresh weight).</li>
           <li>Enter <span className='font-semibold'>Dried Vol Sold</span> directly, or use the <span className='font-semibold'>'Calc'</span> button to determine it from the Fresh Wt. for Drying and a Fresh:Dry Ratio.</li>
          <li>Use the <span className='font-semibold'>'Edit Freq.'</span> button to set how often sales occur per year.</li>
        </ul>
      </div>

    </div>
  );
}

export default SeaweedFarmingCalculator;