import { useState } from 'react';
import { formatNumber, CONFIG } from '../utils';

type IncomeUnit = 'month' | 'week' | 'day' | 'year' | 'everyXMonths'; 

type IncomeSource = {
  isSeaweed: boolean;
  unit: IncomeUnit;
  everyXValue?: number;
  numberOfDaysPerMonth: number;
  numberOfTimes: number;
  singleValueMode: boolean;
  amountMin: number;
  amountMax: number;
};

const emptySource = (): IncomeSource => ({
  isSeaweed: true,
  unit: 'month',
  numberOfDaysPerMonth: CONFIG.NUMBER_OF_DAYS_PER_MONTH,
  numberOfTimes: 1,
  singleValueMode: true,
  amountMin: 0,
  amountMax: 0,
});

const newMemberSources = () => [emptySource(), emptySource(), emptySource()];

const INCOME_SOURCE_MAP: { [key: number]: string; } = {
    1: 'Primary',
    2: 'Secondary',
    3: 'Tertiary'
};

const getMonthlyFactor = (src: IncomeSource) => {
  switch (src.unit) {
    case 'week':
      return CONFIG.NUMBER_OF_WEEKS_PER_MONTH;
    case 'month':
      return 1;
    case 'year':
      return 1 / 12;
    case 'day':
      return src.numberOfDaysPerMonth;
    case 'everyXMonths':
      return src.everyXValue ? 1 / src.everyXValue : 1;
    default:
      return 1;
  }
}

const generateFormulaString = (src: IncomeSource) => {
  const factor = getMonthlyFactor(src);

  // (Amount * Factor) * Times
  const monthlyMinBase = src.amountMin * factor;
  const monthlyMaxBase = src.singleValueMode ? monthlyMinBase : src.amountMax * factor;
  const monthlyMinFinal = monthlyMinBase * src.numberOfTimes;
  const monthlyMaxFinal = monthlyMaxBase * src.numberOfTimes;

  // --- Build the string components ---

  // 1. Amount Part
  const amountStr = src.singleValueMode
    ? `₱${formatNumber(src.amountMin)}`
    : src.amountMin === src.amountMax // Handle range where min/max are same
      ? `₱${formatNumber(src.amountMin)}`
      : `(₱${formatNumber(src.amountMin)} to ₱${formatNumber(src.amountMax)})`;
  
  // 2. Unit & Conversion Part
  let unitConversionStr = '';
  let isValidFactor = isFinite(factor) && factor >= 0; // Check for Infinity or NaN

  switch (src.unit) {
    case 'day':
      unitConversionStr = `per day × ${formatNumber(src.numberOfDaysPerMonth)} days/month`;
      break;
    case 'week':
      unitConversionStr = `per week × ${formatNumber(CONFIG.NUMBER_OF_WEEKS_PER_MONTH)} weeks/month`;
      break;
    case 'month':
      unitConversionStr = `per month`; // Factor is 1, no conversion shown
      break;
    case 'year':
      unitConversionStr = `per year ÷ 12 months/year`;
      break;
    case 'everyXMonths':
      if (src.everyXValue && src.everyXValue > 0) {
        unitConversionStr = `every ${src.everyXValue} months (avg monthly factor ≈ ${formatNumber(factor, 2)})`;
      } else {
        unitConversionStr = `every ? months (invalid interval)`;
        isValidFactor = false; // Mark as invalid calculation
      }
      break;
    default:
      unitConversionStr = 'unknown unit';
      isValidFactor = false;
  }

  // 3. Times Part
  // Only show multiplication if > 1, otherwise it's implicit * 1 time
  const timesStr = src.numberOfTimes > 1 ? `× ${src.numberOfTimes} times` : '';

  // 4. Result Part
  let monthlyResultStr = '';
  if (!isValidFactor) {
      monthlyResultStr = 'Invalid Calculation';
  } else {
      monthlyResultStr = monthlyMinFinal === monthlyMaxFinal
      ? `₱${formatNumber(monthlyMinFinal)}`
      : `₱${formatNumber(monthlyMinFinal)} - ₱${formatNumber(monthlyMaxFinal)}`;
  }

  // --- Combine the parts ---
  // Formula reflects: (Amount [Unit Conversion]) Times = Result
  let formula = `(${amountStr} ${unitConversionStr})`;

  if (timesStr) {
    formula += ` ${timesStr}`;
  }

  formula += ` = ${monthlyResultStr} / month`;

  return formula;
}

const HouseholdIncomeTable = () => {
  // Start with just one member (Participant)
  const [members, setMembers] = useState<IncomeSource[][]>([newMemberSources()]);
  const [activeMemberIndex, setActiveMemberIndex] = useState(0);
  
  // Add a new member
  const addMember = () => {
    setMembers(prev => [...prev, newMemberSources()]);
    setActiveMemberIndex(members.length); // Auto-select the new member
  };
  
  // Remove a member
  const removeMember = (index: number) => {
    if (members.length <= 1) return; // Keep at least one member
    
    setMembers(prev => prev.filter((_, i) => i !== index));
    // Adjust active index if needed
    if (activeMemberIndex >= index && activeMemberIndex > 0) {
      setActiveMemberIndex(activeMemberIndex - 1);
    }
  };
  
  // Navigate to next member
  const nextMember = () => {
    if (activeMemberIndex < members.length - 1) {
      setActiveMemberIndex(activeMemberIndex + 1);
    }
  };
  
  // Navigate to previous member
  const prevMember = () => {
    if (activeMemberIndex > 0) {
      setActiveMemberIndex(activeMemberIndex - 1);
    }
  };

  const handleSourceChange = (
    memberIdx: number,
    sourceIdx: number,
    updater: (src: IncomeSource) => IncomeSource
  ) => {
    setMembers(prev =>
      prev.map((mem, i) =>
        i === memberIdx
          ? mem.map((src, j) => (j === sourceIdx ? updater(src) : src))
          : mem
      )
    );
  };

  // Calculate totals
  let totalHousehold = 0;
  let totalSeaweed = 0;
  let totalHouseholdMin = 0;
  let totalHouseholdMax = 0;
  let totalSeaweedMin = 0;
  let totalSeaweedMax = 0;

  const memberSums = members.map((sources) => {
    let memberMin = 0;
    let memberMax = 0;
    let seaweedMin = 0;
    let seaweedMax = 0;

    sources.forEach((src) => {
      const factor = getMonthlyFactor(src);

      const amtMin = src.amountMin * factor * src.numberOfTimes;
      const amtMax = src.singleValueMode ? amtMin : src.amountMax * factor * src.numberOfTimes;

      memberMin += amtMin;
      memberMax += amtMax;

      if (src.isSeaweed) {
        seaweedMin += amtMin;
        seaweedMax += amtMax;
      }
    });

    const memberAvg = (memberMin + memberMax) / 2;
    const seaweedAvg = (seaweedMin + seaweedMax) / 2;

    totalHousehold += memberAvg;
    totalSeaweed += seaweedAvg;

    totalHouseholdMin += memberMin;
    totalHouseholdMax += memberMax;
    totalSeaweedMin += seaweedMin;
    totalSeaweedMax += seaweedMax;

    return { memberAvg, seaweedAvg, memberMin, memberMax, seaweedMin, seaweedMax };
  });

  const percentHousehold = totalHousehold === 0 ? 0 : (totalSeaweed / totalHousehold) * 100;

  const percentMin =
    totalHouseholdMin === 0 ? 0 : (totalSeaweedMin / totalHouseholdMin) * 100;
  const percentMax =
    totalHouseholdMax === 0 ? 0 : (totalSeaweedMax / totalHouseholdMax) * 100;

  // Get the member name based on index
  const getMemberName = (index: number) => {
    if (index === 0) return "Participant";
    return `Member ${index}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 font-sans space-y-8 bg-teal-200 rounded-lg shadow">

      {/* Member navigation controls */}
      <div className="flex items-center justify-between bg-teal-100 p-3 rounded-lg">
        <div className="flex items-center">
          <button 
            onClick={prevMember} 
            disabled={activeMemberIndex === 0}
            className={`p-2 rounded-lg mr-2 ${activeMemberIndex === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}
          >
            ← Previous
          </button>
          
          <select 
            value={activeMemberIndex}
            onChange={(e) => setActiveMemberIndex(parseInt(e.target.value))}
            className="p-2 border border-gray-300 rounded bg-white text-gray-700"
          >
            {members.map((_, index) => (
              <option key={index} value={index}>
                {getMemberName(index)}
              </option>
            ))}
          </select>
          
          <button 
            onClick={nextMember} 
            disabled={activeMemberIndex === members.length - 1}
            className={`p-2 rounded-lg ml-2 ${activeMemberIndex === members.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}
          >
            Next →
          </button>
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={addMember}
            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg mr-2"
          >
            + Add Member
          </button>
          
          {members.length > 1 && (
            <button 
              onClick={() => removeMember(activeMemberIndex)}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
            >
              - Remove
            </button>
          )}
        </div>
      </div>
      
      {/* Current member's income sources */}
      <div className="bg-teal-50 rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">{getMemberName(activeMemberIndex)}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {members[activeMemberIndex].map((src, sourceIdx) => (
            <div 
              key={sourceIdx} 
              className={`rounded-lg p-4 ${
                src.isSeaweed 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-700">{INCOME_SOURCE_MAP[sourceIdx + 1]}</h4>
                <div className="flex items-center">
                  <input
                    id={`seaweed-${activeMemberIndex}-${sourceIdx}`}
                    type="checkbox"
                    checked={src.isSeaweed}
                    onChange={() =>
                      handleSourceChange(activeMemberIndex, sourceIdx, (old) => ({
                        ...old,
                        isSeaweed: !old.isSeaweed,
                      }))
                    }
                    className="mr-2 h-4 w-4 text-green-600"
                  />
                  <label 
                    htmlFor={`seaweed-${activeMemberIndex}-${sourceIdx}`}
                    className="text-sm text-gray-600"
                  >
                    Seaweed-related
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <select
                  className="w-full p-2 border border-gray-300 rounded bg-white text-gray-700 text-sm"
                  value={src.unit}
                  onChange={(e) =>
                    handleSourceChange(activeMemberIndex, sourceIdx, (old) => ({
                      ...old,
                      unit: e.target.value as IncomeUnit,
                    }))
                  }
                >
                  <option value="month">per Month</option>
                  <option value="week">per Week</option>
                  <option value="day">per Day</option>
                  <option value="year">per Year</option>
                  <option value="everyXMonths">every X Months</option>
                </select>
              </div>

              {src.unit === 'day' && (
                <div className="mb-3 flex items-center gap-2">
                  <label htmlFor={`daysPerMonth-${activeMemberIndex}-${sourceIdx}`} className="text-xs text-gray-600 whitespace-nowrap">Days per month</label>
                  <input
                    type="number"
                    min={1}
                    value={src.numberOfDaysPerMonth}
                    onChange={(e) =>
                      handleSourceChange(activeMemberIndex, sourceIdx, (old) => ({
                        ...old,
                        numberOfDaysPerMonth: +e.target.value || 0,
                      }))
                    }
                    placeholder="Days per month"
                    className="w-full p-2 border border-gray-300 rounded bg-white text-gray-700 text-sm"
                  />
                </div>
              )}

              {src.unit === 'everyXMonths' && (
                <div className="mb-3 flex items-center gap-2">
                  <label htmlFor={`numberOfTimes-${activeMemberIndex}-${sourceIdx}`} className="text-xs text-gray-600 whitespace-nowrap">where X is </label>
                  <input
                    type="number"
                    min={1}
                    value={src.everyXValue || ''}
                    onChange={(e) =>
                      handleSourceChange(activeMemberIndex, sourceIdx, (old) => ({
                        ...old,
                        everyXValue: +e.target.value || 0,
                      }))
                    }
                    placeholder="Value of X"
                    className="w-full p-2 border border-gray-300 rounded bg-white text-gray-700 text-sm"
                  />
                </div>
              )}
              
              <div className="flex items-center mb-3">
                <input
                  id={`range-${activeMemberIndex}-${sourceIdx}`}
                  type="checkbox"
                  checked={!src.singleValueMode}
                  onChange={() =>
                    handleSourceChange(activeMemberIndex, sourceIdx, (old) => ({
                      ...old,
                      singleValueMode: !old.singleValueMode,
                      amountMax: old.singleValueMode ? old.amountMin : old.amountMax,
                    }))
                  }
                  className="mr-2 h-4 w-4 text-blue-600"
                />
                <label 
                  htmlFor={`range-${activeMemberIndex}-${sourceIdx}`}
                  className="text-sm text-gray-600"
                >
                  Set min-max?
                </label>
              </div>

              {src.singleValueMode ? (
                <div className="mb-1">
                  <div className="flex items-center">
                    <span className="mr-2 text-lg font-medium">₱</span>
                    <input
                      type="number"
                      min={0}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-gray-800"
                      value={src.amountMin || ''}
                      onChange={(e) =>
                        handleSourceChange(activeMemberIndex, sourceIdx, (old) => ({
                          ...old,
                          amountMin: +e.target.value || 0,
                          amountMax: +e.target.value || 0,
                        }))
                      }
                      placeholder="Income amount"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="mr-2 text-lg font-medium">₱</span>
                    <input
                      type="number"
                      min={0}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-gray-800"
                      value={src.amountMin || ''}
                      onChange={(e) =>
                        handleSourceChange(activeMemberIndex, sourceIdx, (old) => ({
                          ...old,
                          amountMin: +e.target.value || 0,
                        }))
                      }
                      placeholder="Minimum income"
                    />
                    <span className="text-xs pl-2">(Min)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 text-lg font-medium">₱</span>
                    <input
                      type="number"
                      min={0}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-gray-800"
                      value={src.amountMax || ''}
                      onChange={(e) =>
                        handleSourceChange(activeMemberIndex, sourceIdx, (old) => ({
                          ...old,
                          amountMax: +e.target.value || 0,
                        }))
                      }
                      placeholder="Maximum income"
                    />
                    <span className="text-xs pl-2">(Max)</span>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <div className="flex items-center mb-3">
                  <input
                    id={`onetime-${activeMemberIndex}-${sourceIdx}`}
                    type="checkbox"
                    checked={src.numberOfTimes === 1}
                    onChange={(e) =>
                      handleSourceChange(activeMemberIndex, sourceIdx, (old) => ({
                        ...old,
                        numberOfTimes: e.target.checked ? 1 : 2
                      }))
                    }
                    className="mr-2 h-4 w-4 text-blue-600"
                  />
                  <label 
                    htmlFor={`onetime-${activeMemberIndex}-${sourceIdx}`}
                    className="text-sm text-gray-600"
                  >
                    This payment gets made just once per {src.unit === 'everyXMonths' ? `${src.everyXValue || '?'} months` : src.unit}
                  </label>
                </div>

                {src.numberOfTimes > 1 && (
                  <div className="mt-2 flex items-center">
                    <input
                      type="number"
                      min={2}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-gray-800"
                      value={src.numberOfTimes}
                      onChange={(e) =>
                        handleSourceChange(activeMemberIndex, sourceIdx, (old) => ({
                          ...old,
                          numberOfTimes: Math.max(2, +e.target.value || 2)
                        }))
                      }
                    />
                    <span className="text-sm text-gray-600 ml-2">times</span>
                  </div>
                )}
              </div>

              {/* --- FORMULA DISPLAY --- */}
              <div className="mt-auto pt-3 border-t border-gray-200"> {/* Pushes to bottom */}
                  <p className="text-xs text-gray-500 italic leading-tight">
                      <span className="font-medium not-italic text-gray-600">Est. Monthly:</span> {generateFormulaString(src)}
                  </p>
              </div>

            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-teal-100 rounded-lg flex justify-between items-center">
          <div className="text-gray-700">
            <div className="flex items-baseline">
              <span className="font-semibold mr-2">Member Total:</span>
              {memberSums[activeMemberIndex].memberMin === memberSums[activeMemberIndex].memberMax ? (
          `₱${formatNumber(memberSums[activeMemberIndex].memberMin)}`
              ) : (
          <>
            <span>₱{formatNumber(memberSums[activeMemberIndex].memberAvg)}</span>
            <span className="text-xs text-gray-600 ml-2">
              (Min ₱{formatNumber(memberSums[activeMemberIndex].memberMin)} - Max ₱{formatNumber(memberSums[activeMemberIndex].memberMax)})
            </span>
          </>
              )}
            </div>
          </div>
          {memberSums[activeMemberIndex].seaweedMin > 0 && (
            <div className="text-green-700">
              <div className="flex items-baseline">
          <span className="font-semibold mr-2">Seaweed Income:</span>
          {memberSums[activeMemberIndex].seaweedMin === memberSums[activeMemberIndex].seaweedMax ? (
            `₱${formatNumber(memberSums[activeMemberIndex].seaweedMin)}`
          ) : (
            <>
              <span>₱{formatNumber(memberSums[activeMemberIndex].seaweedAvg)}</span>
              <span className="text-xs opacity-75 ml-2">
                (Min ₱{formatNumber(memberSums[activeMemberIndex].seaweedMin)} - Max ₱{formatNumber(memberSums[activeMemberIndex].seaweedMax)})
              </span>
            </>
          )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* All members summary (small cards) */}
      {members.length > 1 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">All Members</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {members.map((_, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border shadow-sm cursor-pointer ${
                  index === activeMemberIndex 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-white border-gray-200 hover:bg-teal-50'
                }`}
                onClick={() => setActiveMemberIndex(index)}
              >
                <div className="font-medium">{getMemberName(index)}</div>
                <div className="text-gray-700 text-sm mt-1">
                  Total: ₱{memberSums[index].memberMin === memberSums[index].memberMax
                    ? formatNumber(memberSums[index].memberMin)
                    : `${formatNumber(memberSums[index].memberAvg)} (Min ₱${formatNumber(memberSums[index].memberMin)} - Max ₱${formatNumber(memberSums[index].memberMax)})`}
                </div>
                {memberSums[index].seaweedMin > 0 && (
                  <div className="text-green-600 text-sm mt-1">
                    Seaweed: ₱{memberSums[index].seaweedMin === memberSums[index].seaweedMax
                      ? formatNumber(memberSums[index].seaweedMin)
                      : `${formatNumber(memberSums[index].seaweedAvg)} (Min ₱${formatNumber(memberSums[index].seaweedMin)} - Max ₱${formatNumber(memberSums[index].seaweedMax)})`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Household Summary */}
      <div className="mt-8 p-6 border rounded-lg bg-amber-50 shadow">
        <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-amber-200">Household Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-amber-200">
        <div className="text-gray-500 mb-1">Total Monthly Income</div>
        <div className="text-2xl font-bold text-gray-800">
          ₱{formatNumber(totalHousehold)}
        </div>
        {totalHouseholdMin !== totalHouseholdMax && (
          <div className="text-sm text-gray-500 mt-1">
            Range: ₱{formatNumber(totalHouseholdMin)} - ₱{formatNumber(totalHouseholdMax)}
          </div>
        )}
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
        <div className="text-green-600 mb-1">Seaweed Income</div>
        <div className="text-2xl font-bold text-green-800">
          ₱{formatNumber(totalSeaweed)}
        </div>
        {totalSeaweedMin !== totalSeaweedMax && (
          <div className="text-sm text-green-600 mt-1">
            Range: ₱{formatNumber(totalSeaweedMin)} - ₱{formatNumber(totalSeaweedMax)}
          </div>
        )}
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
        <div className="text-blue-600 mb-1">Seaweed Income Percentage</div>
        <div className="text-2xl font-bold text-blue-800">
          {formatNumber(percentHousehold)}%
        </div>
        {percentMin !== percentMax && (
          <div className="text-sm text-blue-600 mt-1">
            Range: {formatNumber(percentMin)}% - {formatNumber(percentMax)}%
          </div>
        )}
          </div>
        </div>
        
        <div className="mt-4 bg-white p-4 rounded-lg text-sm text-gray-600 border border-gray-200">
          <p className="mb-2 font-medium">Calculation Summary:</p>
          <ul className="space-y-2">
        <li>
          Average household monthly income: <strong>₱{formatNumber(totalHousehold)}</strong>
          {totalHouseholdMin !== totalHouseholdMax && (
            <span className="text-gray-500"> (Range: ₱{formatNumber(totalHouseholdMin)} - ₱{formatNumber(totalHouseholdMax)})</span>
          )}
        </li>
        <li>
          Average income from seaweed: <strong>₱{formatNumber(totalSeaweed)}</strong>
          {totalSeaweedMin !== totalSeaweedMax && (
            <span className="text-gray-500"> (Range: ₱{formatNumber(totalSeaweedMin)} - ₱{formatNumber(totalSeaweedMax)})</span>
          )}
        </li>
        <li>
          Average % from seaweed: <strong>{formatNumber(percentHousehold)}%</strong>
          {percentMin !== percentMax && (
            <span className="text-gray-500"> (Range: {formatNumber(percentMin)}% - {formatNumber(percentMax)}%)</span>
          )}
        </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HouseholdIncomeTable;