import { useState, useMemo } from 'react';
import LabelWithTooltip from './ui/labelWithTooltip';

// Calculate the current year dynamically
const CURRENT_YEAR = new Date().getFullYear();
const DEPRECIATION_AGE_THRESHOLD = 3; // Item must be this many years old or older

interface InvestmentItem {
  id: string;
  name: string;
  yearPurchased: number | ''; // Allow empty string for initial state
  costWhenBought: number;
  costNow: number;
  usefulLife: number; // Renamed from itemAge
  // Depreciation is calculated, not stored directly as user input
}

const formatCurrency = (value: number) => {
  // Handle NaN or non-finite values gracefully
  if (!Number.isFinite(value)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Calculates the current age of the item
const calculateCurrentAge = (yearPurchased: number | '', currentYear: number): number => {
  if (typeof yearPurchased !== 'number' || yearPurchased <= 0 || yearPurchased > currentYear) {
    return 0; // Or handle as invalid year
  }
  return currentYear - yearPurchased;
};

// Calculates depreciation based on the form's formula: Cost Now / Useful Life
const calculateDepreciation = (costNow: number, usefulLife: number): number => {
  if (usefulLife <= 0 || costNow < 0) { // Ensure useful life is positive and costNow isn't negative
    return 0; // Cannot calculate depreciation
  }
  // If costNow is 0 (might not have been asked yet), depreciation is 0
  if (costNow === 0) {
      return 0;
  }
  return Math.round(costNow / usefulLife);
};

const InvestmentItemsForm = () => {
  // Initial data reflecting the form (approximated from image)
  const [items, setItems] = useState<InvestmentItem[]>([
    {
      id: '1',
      name: 'Boat',
      yearPurchased: 2020, // Age in 2024 is 4 (>= 3)
      costWhenBought: 25000, // Faintly visible P 25, 000
      costNow: 20000,        // Faintly visible P 20, 000 -> leads to 4k depreciation
      usefulLife: 5,
    },
    {
      id: '2',
      name: 'Papag', // Corrected spelling?
      yearPurchased: 2021, // Age in 2024 is 3 (>= 3)
      costWhenBought: 500, // From image
      costNow: 0,         // Assume not asked yet or value is 0
      usefulLife: 1,
    },
    {
      id: '3',
      name: 'Trapal/tulda',
      yearPurchased: 2023, // Age in 2024 is 1 (< 3)
      costWhenBought: 4500, // From image? Looks like P 45/m? Assuming 100m = 4500? Need better data. Let's use 1000.
      costNow: 0,         // Not asked yet (age < 3)
      usefulLife: 2,
    }
  ]);

  const [newItem, setNewItem] = useState<Omit<InvestmentItem, 'id'>>({
    name: '',
    yearPurchased: '', // Start empty or with current year
    costWhenBought: 0,
    costNow: 0,
    usefulLife: 0,
  });
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Memoize calculations for display
  const processedItems = useMemo(() => {
    return items.map(item => {
      const currentAge = calculateCurrentAge(item.yearPurchased, CURRENT_YEAR);
      const shouldCalculateDep = currentAge >= DEPRECIATION_AGE_THRESHOLD && item.costNow > 0 && item.usefulLife > 0;
      const depreciation = shouldCalculateDep
        ? calculateDepreciation(item.costNow, item.usefulLife)
        : 0; // Store 0 if not applicable, display logic will handle N/A

      return {
        ...item,
        currentAge, // Add current age for display logic
        calculatedDepreciation: depreciation,
        isDepreciationApplicable: shouldCalculateDep
      };
    });
  }, [items]);

  const handleItemChange = (id: string, field: keyof InvestmentItem, value: string | number) => {
    // Ensure numeric fields are numbers, handle potential NaN
     let processedValue = value;
     if (field === 'yearPurchased' || field === 'costWhenBought' || field === 'costNow' || field === 'usefulLife') {
       processedValue = parseInt(value as string, 10);
       if (isNaN(processedValue)) {
         processedValue = 0; // Default to 0 if parsing fails
       }
       // Prevent negative numbers for costs and life
        if ((field === 'costWhenBought' || field === 'costNow' || field === 'usefulLife') && processedValue < 0) {
            processedValue = 0;
        }
        // Basic validation for year
        if (field === 'yearPurchased' && (processedValue < 1900 || processedValue > CURRENT_YEAR)) {
             processedValue = ''; // Or keep previous valid year? Empty might be better for user feedback
        }
     }


    setItems(prevItems => prevItems.map(item =>
      item.id === id ? { ...item, [field]: processedValue } : item
    ));
  };

 const handleNewItemChange = (field: keyof Omit<InvestmentItem, 'id'>, value: string | number) => {
    let processedValue = value;
    if (field === 'yearPurchased' || field === 'costWhenBought' || field === 'costNow' || field === 'usefulLife') {
      processedValue = parseInt(value as string, 10);
      if (isNaN(processedValue)) {
        processedValue = (field === 'yearPurchased') ? '' : 0; // Allow empty year initially, 0 for others
      }
       // Prevent negative numbers for costs and life
        if ((field === 'costWhenBought' || field === 'costNow' || field === 'usefulLife') && (typeof processedValue === 'number' && processedValue < 0)) {
            processedValue = 0;
        }
       // Basic validation for year
        if (field === 'yearPurchased' && typeof processedValue === 'number' && (processedValue < 1900 || processedValue > CURRENT_YEAR)) {
             processedValue = ''; // Reset if invalid range typed
        }
    }

    setNewItem(prev => ({ ...prev, [field]: processedValue }));
  };


  const addNewItem = () => {
    // Basic validation: Name and Year are required. Useful Life should be positive for depreciation.
    if (newItem.name && newItem.yearPurchased && typeof newItem.yearPurchased === 'number') {
      const id = Date.now().toString(); // Simple unique ID generator

      const itemToAdd: InvestmentItem = {
        ...newItem,
        id,
        yearPurchased: newItem.yearPurchased, // Already validated as number
        // Ensure costs/life are numbers, default if needed (though handlers should ensure this)
        costWhenBought: Number(newItem.costWhenBought) || 0,
        costNow: Number(newItem.costNow) || 0,
        usefulLife: Number(newItem.usefulLife) || 0,
      };

      setItems([...items, itemToAdd]);
      // Reset for next entry
      setNewItem({
        name: '',
        yearPurchased: '',
        costWhenBought: 0,
        costNow: 0,
        usefulLife: 0,
      });
      setIsAddingItem(false);
    } else {
      // Optional: Add some user feedback if validation fails
      alert("Please provide at least an Item Name and a valid Year Purchased.");
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Calculate Summaries based on processed items
  const totalInvestment = processedItems.reduce((sum, item) => sum + item.costWhenBought, 0);
  const totalCurrentValue = processedItems.reduce((sum, item) => sum + item.costNow, 0);
  const totalDepreciation = processedItems.reduce((sum, item) => sum + item.calculatedDepreciation, 0);
  const totalValueLoss = totalInvestment - totalCurrentValue; // Still potentially useful info

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 font-sans bg-teal-200 rounded-lg shadow space-y-8">
      {/* Form Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <h3 className="text-lg font-medium text-gray-700 border-b pb-2 mb-4">
          4.1 Investment Items (age is more than 1 year)
        </h3>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <LabelWithTooltip tooltip="Year purchased/constructed">
                    Year Purchased
                  </LabelWithTooltip>
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <LabelWithTooltip tooltip="Cost when bought">
                    Cost When Bought
                  </LabelWithTooltip>
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <LabelWithTooltip tooltip="Current value. Note: Ask this when item is 3 years old or more.">
                    Cost Now
                  </LabelWithTooltip>
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <LabelWithTooltip tooltip="Estimated useful life in years">
                    Life (Useful Years)
                  </LabelWithTooltip>
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <LabelWithTooltip tooltip={`Depreciation = Cost Now / Life. Calculated only if item age is ${DEPRECIATION_AGE_THRESHOLD} years or more.`}>
                    Depreciation
                  </LabelWithTooltip>
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedItems.map((item) => (
                <tr key={item.id}>
                  {/* Item Name */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      className="p-1 border border-gray-300 rounded w-full"
                    />
                  </td>
                  {/* Year Purchased */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="1900"
                      max={CURRENT_YEAR}
                      value={item.yearPurchased}
                      onChange={(e) => handleItemChange(item.id, 'yearPurchased', e.target.value)}
                      className="p-1 border border-gray-300 rounded w-24" // Fixed width
                      placeholder="YYYY"
                    />
                  </td>
                  {/* Cost When Bought */}
                  <td className="px-3 py-4 whitespace-nowrap">
                     <input
                      type="number"
                      min="0"
                      step="100" // Adjust step as needed
                      value={item.costWhenBought}
                      onChange={(e) => handleItemChange(item.id, 'costWhenBought', e.target.value)}
                      className="p-1 border border-gray-300 rounded w-28" // Fixed width
                      placeholder="e.g., 10000"
                    />
                  </td>
                  {/* Cost Now */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={item.costNow}
                      onChange={(e) => handleItemChange(item.id, 'costNow', e.target.value)}
                      className={`p-1 border border-gray-300 rounded w-28 ${item.currentAge < DEPRECIATION_AGE_THRESHOLD ? 'bg-gray-100' : ''}`} // Hint if too new
                      placeholder={item.currentAge < DEPRECIATION_AGE_THRESHOLD ? "(< 3 yrs old)" : "e.g., 8000"}
                      title={item.currentAge < DEPRECIATION_AGE_THRESHOLD ? "Cost Now typically asked for items 3+ years old" : ""}
                    />
                  </td>
                  {/* Useful Life */}
                  <td className="px-3 py-4 whitespace-nowrap">
                     <input
                      type="number"
                      min="0" // Useful life could theoretically be less than 1 year
                      step="1"
                      value={item.usefulLife}
                      onChange={(e) => handleItemChange(item.id, 'usefulLife', e.target.value)}
                      className="p-1 border border-gray-300 rounded w-20" // Fixed width
                      placeholder="Years"
                    />
                  </td>
                  {/* Depreciation (Calculated) */}
                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <div className={`p-2 rounded text-right ${item.isDepreciationApplicable ? 'bg-blue-50 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                       {item.isDepreciationApplicable ? formatCurrency(item.calculatedDepreciation) : 'N/A'}
                    </div>
                  </td>
                  {/* Actions */}
                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Remove this item"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}

              {/* Row for adding a new item */}
              {isAddingItem && (
                <tr>
                  {/* New Item Name */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => handleNewItemChange('name', e.target.value)}
                      placeholder="Item name"
                      className="p-1 border border-blue-300 rounded w-full"
                      autoFocus
                    />
                  </td>
                  {/* New Year Purchased */}
                  <td className="px-3 py-4 whitespace-nowrap">
                     <input
                      type="number"
                      min="1900"
                      max={CURRENT_YEAR}
                      value={newItem.yearPurchased}
                      onChange={(e) => handleNewItemChange('yearPurchased', e.target.value)}
                      className="p-1 border border-blue-300 rounded w-24"
                      placeholder="YYYY"
                    />
                  </td>
                   {/* New Cost When Bought */}
                  <td className="px-3 py-4 whitespace-nowrap">
                     <input
                      type="number"
                      min="0"
                      value={newItem.costWhenBought}
                      onChange={(e) => handleNewItemChange('costWhenBought', e.target.value)}
                      placeholder="Cost"
                      className="p-1 border border-blue-300 rounded w-28"
                    />
                  </td>
                   {/* New Cost Now */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      value={newItem.costNow}
                      onChange={(e) => handleNewItemChange('costNow', e.target.value)}
                      placeholder="Current cost"
                      className="p-1 border border-blue-300 rounded w-28"
                    />
                  </td>
                  {/* New Useful Life */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      value={newItem.usefulLife}
                      onChange={(e) => handleNewItemChange('usefulLife', e.target.value)}
                      placeholder="Years"
                      className="p-1 border border-blue-300 rounded w-20"
                    />
                  </td>
                  {/* New Depreciation Placeholder */}
                   <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="p-2 rounded bg-gray-100 text-gray-400">
                      (auto)
                    </div>
                  </td>
                  {/* New Item Actions */}
                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={addNewItem}
                      className="text-green-600 hover:text-green-900 p-1 mr-2"
                      title="Save this new item"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsAddingItem(false)}
                      className="text-gray-600 hover:text-gray-900 p-1"
                       title="Cancel adding item"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Item Button */}
        {!isAddingItem && (
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setIsAddingItem(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add New Investment Item
            </button>
          </div>
        )}

         <div className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-200">
          <p><strong className="font-medium">Notes:</strong></p>
          <ul className="list-disc list-inside ml-4">
            <li>Depreciation is calculated as <code className="bg-gray-100 px-1 rounded text-xs">Cost Now / Life</code>.</li>
            <li>Depreciation only applies if the item's age (currently {CURRENT_YEAR} - Year Purchased) is {DEPRECIATION_AGE_THRESHOLD} years or more.</li>
            <li>"Cost Now" is typically only requested for items meeting this age requirement.</li>
          </ul>
        </div>
      </div> {/* End Form Section */}


      {/* Summary Section */}
      <div className="bg-amber-50 p-6 rounded-lg shadow space-y-4">
        <h3 className="text-xl font-bold text-gray-800 border-b border-amber-200 pb-2">
          Investment Summary ({CURRENT_YEAR})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Original Investment */}
          <div className="p-4 bg-white rounded-lg shadow-sm border border-amber-200">
            <div className="text-gray-500 mb-2">Total Original Cost</div>
            <div className="text-2xl font-bold text-gray-800">
              {formatCurrency(totalInvestment)}
            </div>
          </div>
          {/* Current Total Value */}
          <div className="p-4 bg-green-50 rounded-lg shadow-sm border border-green-200">
            <div className="text-green-600 mb-2">Total Current Value</div>
            <div className="text-2xl font-bold text-green-800">
              {formatCurrency(totalCurrentValue)}
            </div>
             <p className="text-xs text-gray-500 mt-1">(Sum of 'Cost Now' entries)</p>
          </div>
          {/* Total Value Loss (Informational) */}
           <div className="p-4 bg-red-50 rounded-lg shadow-sm border border-red-200">
            <div className="text-red-600 mb-2">Value Difference</div>
            <div className="text-2xl font-bold text-red-800">
              {formatCurrency(totalValueLoss)}
            </div>
            <p className="text-xs text-gray-500 mt-1">(Original Cost - Current Value)</p>
          </div>
          {/* Total Calculated Annual Depreciation */}
          <div className="p-4 bg-blue-50 rounded-lg shadow-sm border border-blue-200">
            <div className="text-blue-600 mb-2">Total Annual Depreciation</div>
            <div className="text-2xl font-bold text-blue-800">
              {formatCurrency(totalDepreciation)}
            </div>
            <p className="text-xs text-gray-500 mt-1">(Sum for items {DEPRECIATION_AGE_THRESHOLD}+ years old)</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-gray-200 text-sm mt-4">
          <p className="mb-2 font-medium">Summary Statement:</p>
          <p>
            You have listed <strong>{processedItems.length} investment items</strong> with a total original
            cost of <strong>{formatCurrency(totalInvestment)}</strong>.
            The reported total current value ('Cost Now') is <strong>{formatCurrency(totalCurrentValue)}</strong>.
            The total calculated annual depreciation (for items {DEPRECIATION_AGE_THRESHOLD} years or older, using the formula <code className="text-xs">Cost Now / Life</code>)
             is <strong>{formatCurrency(totalDepreciation)}</strong>.
          </p>
        </div>
      </div> {/* End Summary Section */}

    </div>
  );
};

export default InvestmentItemsForm;