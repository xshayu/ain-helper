import { useState } from 'react';

const WEEKS_PER_MONTH = 4.33;

type IncomeSource = {
  isSeaweed: boolean;
  unit: 'month' | 'week';
  singleValueMode: boolean;
  amountMin: number;
  amountMax: number;
};

const emptySource = (): IncomeSource => ({
  isSeaweed: true,
  unit: 'month',
  singleValueMode: true,
  amountMin: 0,
  amountMax: 0,
});

const newMemberSources = () => [emptySource(), emptySource(), emptySource()];

const format = (val: number) =>
  (Math.round(val * 100) / 100).toString().replace(/\.00$/, '');

const INCOME_SOURCE_MAP: { [key: number]: string; } = {
    1: 'Primary',
    2: 'Secondary',
    3: 'Tertiary'
};

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
      const factor = src.unit === 'week' ? WEEKS_PER_MONTH : 1;

      const amtMin = src.amountMin * factor;
      const amtMax = src.amountMax * factor;

      memberMin += amtMin;
      memberMax += amtMax;

      if (src.isSeaweed) {
        seaweedMin += amtMin;
        seaweedMax += amtMax;
      }
    });

    totalHouseholdMin += memberMin;
    totalHouseholdMax += memberMax;
    totalSeaweedMin += seaweedMin;
    totalSeaweedMax += seaweedMax;

    return { memberMin, memberMax, seaweedMin, seaweedMax };
  });

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
                      unit: e.target.value as 'month' | 'week',
                    }))
                  }
                >
                  <option value="month">per Month</option>
                  <option value="week">per Week</option>
                </select>
              </div>

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
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-teal-100 rounded-lg flex justify-between items-center">
          <div className="text-gray-700">
            <span className="font-semibold mr-2">Member Total:</span>
            {memberSums[activeMemberIndex].memberMin === memberSums[activeMemberIndex].memberMax
              ? `₱${format(memberSums[activeMemberIndex].memberMin)}`
              : `₱${format(memberSums[activeMemberIndex].memberMin)} - ₱${format(memberSums[activeMemberIndex].memberMax)}`}
          </div>
          {memberSums[activeMemberIndex].seaweedMin > 0 && (
            <div className="text-green-700 text-sm">
              <span className="font-semibold mr-2">Seaweed Income:</span>
              {memberSums[activeMemberIndex].seaweedMin === memberSums[activeMemberIndex].seaweedMax
                ? `₱${format(memberSums[activeMemberIndex].seaweedMin)}`
                : `₱${format(memberSums[activeMemberIndex].seaweedMin)} - ₱${format(memberSums[activeMemberIndex].seaweedMax)}`}
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
                    ? format(memberSums[index].memberMin)
                    : `${format(memberSums[index].memberMin)} - ${format(memberSums[index].memberMax)}`}
                </div>
                {memberSums[index].seaweedMin > 0 && (
                  <div className="text-green-600 text-sm mt-1">
                    Seaweed: ₱{memberSums[index].seaweedMin === memberSums[index].seaweedMax
                      ? format(memberSums[index].seaweedMin)
                      : `${format(memberSums[index].seaweedMin)} - ${format(memberSums[index].seaweedMax)}`}
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
              {totalHouseholdMin === totalHouseholdMax
                ? `₱${format(totalHouseholdMin)}`
                : `₱${format(totalHouseholdMin)} - ₱${format(totalHouseholdMax)}`}
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
            <div className="text-green-600 mb-1">Seaweed Income</div>
            <div className="text-2xl font-bold text-green-800">
              {totalSeaweedMin === totalSeaweedMax
                ? `₱${format(totalSeaweedMin)}`
                : `₱${format(totalSeaweedMin)} - ₱${format(totalSeaweedMax)}`}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
            <div className="text-blue-600 mb-1">Seaweed Income Percentage</div>
            <div className="text-2xl font-bold text-blue-800">
              {percentMin === percentMax
                ? `${format(percentMin)}%`
                : `${format(percentMin)}% - ${format(percentMax)}%`}
            </div>
          </div>
        </div>
        
        <div className="mt-4 bg-white p-4 rounded-lg text-sm text-gray-600 border border-gray-200">
          <p className="mb-2 font-medium">Calculation Summary:</p>
          <ul className="space-y-2">
            <li>
              TOTAL household <strong>monthly</strong> income (₱) = <strong>
                {totalHouseholdMin === totalHouseholdMax
                  ? format(totalHouseholdMin)
                  : `${format(totalHouseholdMin)} - ${format(totalHouseholdMax)}`}
              </strong>
            </li>
            <li>
              Income derived from seaweed farming (₱) = <strong>
                {totalSeaweedMin === totalSeaweedMax
                  ? format(totalSeaweedMin)
                  : `${format(totalSeaweedMin)} - ${format(totalSeaweedMax)}`}
              </strong>
            </li>
            <li>
              % of total income derived from seaweed = <strong>
                {percentMin === percentMax
                  ? format(percentMin)
                  : `${format(percentMin)} - ${format(percentMax)}`}
                %</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HouseholdIncomeTable;