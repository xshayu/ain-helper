import { useState } from 'react';
import LabelWithTooltip from './labelWithTooltip';

const NUMBER_OF_WEEKS_PER_MONTH = 4.33;

const formatNumber = (num: number) => {
  const rounded = Math.round(num * 10) / 10;
  return rounded.toString().replace(/\.0$/, '');
};

const SeaweedSchedule = () => {
  const [activityName, setActivityName] = useState('');
  const [monthsMarked, setMonthsMarked] = useState(6);
  const [frequencyType, setFrequencyType] = useState<
    'perMonth' | 'perWeek' | 'everyXMonths' | 'everyXWeeks' | 'once'
  >('perMonth');
  const [frequencyValue, setFrequencyValue] = useState(1);
  const [everyXValue, setEveryXValue] = useState(2);
  const [timesPerSixMonths, setTimesPerSixMonths] = useState(0);
  const [useHourRange, setUseHourRange] = useState(false);
  const [hoursMin, setHoursMin] = useState(3);
  const [hoursMax, setHoursMax] = useState(3);

  const totalTimes = (() => {
    switch (frequencyType) {
      case 'once': return 1;
      case 'perMonth': return frequencyValue * monthsMarked;
      case 'perWeek': return frequencyValue * monthsMarked * NUMBER_OF_WEEKS_PER_MONTH;
      case 'everyXMonths': return Math.ceil(monthsMarked / everyXValue);
      case 'everyXWeeks': {
        const totalWeeks = monthsMarked * NUMBER_OF_WEEKS_PER_MONTH;
        return Math.ceil(totalWeeks / everyXValue);
      }
      default: return 0;
    }
  })();

  const totalHoursMin = totalTimes * hoursMin;
  const totalHoursMax = totalTimes * hoursMax;

  const frequencyDescription = 
    frequencyType === 'once'
      ? 'once'
      : frequencyType.startsWith('every') 
        ? `every ${everyXValue} ${frequencyType === 'everyXWeeks' ? 'weeks' : 'months'}`
        : `${frequencyValue} times per ${frequencyType === 'perWeek' ? 'week' : 'month'}`;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 font-sans bg-teal-200 rounded-lg shadow space-y-8">
      {/* Form Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <h3 className="text-lg font-medium text-gray-700 border-b pb-2 mb-4">
          Activity Configuration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <LabelWithTooltip tooltip="Name this activity">
                Activity Name
              </LabelWithTooltip>
              <input
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-white"
                placeholder="e.g., Buy seedlings"
              />
            </div>

            <div>
              <LabelWithTooltip tooltip="How frequently the activity repeats during those months">
                Frequency Type
              </LabelWithTooltip>
              <select
                value={frequencyType}
                onChange={(e) => setFrequencyType(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded bg-white text-gray-700"
              >
                <option value="once">Once</option>
                <option value="perMonth">Times per Month</option>
                <option value="perWeek">Times per Week</option>
                <option value="everyXMonths">Every X Months</option>
                <option value="everyXWeeks">Every X Weeks</option>
              </select>
            </div>

            {(frequencyType === 'perMonth' || frequencyType === 'perWeek') && (
              <div>
                <LabelWithTooltip tooltip="How many times within the frequency period (week or month)">
                  Frequency Number
                </LabelWithTooltip>
                <input
                  type="number"
                  min={1}
                  value={frequencyValue}
                  onChange={(e) => setFrequencyValue(+e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded bg-white"
                  placeholder="e.g., 2"
                />
              </div>
            )}

            {frequencyType.startsWith('every') && (
              <div>
                <LabelWithTooltip tooltip={`Occurs every how many ${frequencyType === 'everyXWeeks' ? 'weeks' : 'months'}`}>
                  Interval
                </LabelWithTooltip>
                <input
                  type="number"
                  min={1}
                  value={everyXValue}
                  onChange={(e) => setEveryXValue(+e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded bg-white"
                  placeholder="e.g., 2"
                />
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <LabelWithTooltip tooltip="How many months in the year you conduct this activity">
                Months Marked (1-12)
              </LabelWithTooltip>
              <input
                type="number"
                min={1}
                max={12}
                value={monthsMarked}
                onChange={(e) => setMonthsMarked(+e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-white"
                placeholder="e.g., 6"
              />
            </div>

            <div>
              <LabelWithTooltip tooltip="Optional info only, not included in calculations">
                Times in 6 Months (optional)
              </LabelWithTooltip>
              <input
                type="number"
                min={0}
                value={timesPerSixMonths}
                onChange={(e) => setTimesPerSixMonths(+e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-white"
                placeholder="e.g., 5"
              />
            </div>

            {useHourRange ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <LabelWithTooltip tooltip="Minimum hours per event">
                    Min Hours
                  </LabelWithTooltip>
                  <input
                    type="number"
                    min={0}
                    value={hoursMin}
                    onChange={(e) => setHoursMin(+e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded bg-white"
                    placeholder="e.g., 2"
                  />
                </div>
                <div>
                  <LabelWithTooltip tooltip="Maximum hours per event">
                    Max Hours
                  </LabelWithTooltip>
                  <input
                    type="number"
                    min={0}
                    value={hoursMax}
                    onChange={(e) => setHoursMax(+e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded bg-white"
                    placeholder="e.g., 4"
                  />
                </div>
              </div>
            ) : (
              <div>
                <LabelWithTooltip tooltip="Estimated hours per event">
                  Hours per Activity
                </LabelWithTooltip>
                <input
                  type="number"
                  min={0}
                  value={hoursMin}
                  onChange={(e) => {
                    setHoursMin(+e.target.value);
                    setHoursMax(+e.target.value);
                  }}
                  className="w-full p-2 border border-gray-300 rounded bg-white"
                  placeholder="e.g., 3"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useHourRange}
                onChange={() => setUseHourRange(!useHourRange)}
                className="h-4 w-4 text-green-600"
              />
              <LabelWithTooltip tooltip="Use a min–max range instead of one fixed hour estimate?">
                Set Min-Max Hour?
              </LabelWithTooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-amber-50 p-6 rounded-lg shadow space-y-4">
        <h3 className="text-xl font-bold text-gray-800 border-b border-amber-200 pb-2">
          Annual Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg shadow-sm border border-amber-200">
            <div className="text-gray-500 mb-2">Total Hours</div>
            <div className="text-2xl font-bold text-gray-800">
              {useHourRange
                ? `${formatNumber(totalHoursMin)} - ${formatNumber(totalHoursMax)}`
                : formatNumber(totalHoursMin)}
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg shadow-sm border border-green-200">
            <div className="text-green-600 mb-2">Frequency</div>
            <div className="text-lg text-green-800 font-medium">
              {frequencyDescription}
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg shadow-sm border border-blue-200">
            <div className="text-blue-600 mb-2">Duration</div>
            <div className="text-lg text-blue-800 font-medium">
              {monthsMarked} month(s)/year
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-gray-200 text-sm">
          <p className="mb-2 font-medium">Summary Statement:</p>
          <p>
            The activity "<strong>{activityName || 'Unnamed Activity'}</strong>" 
            requires <strong>{useHourRange ? 
              `${formatNumber(totalHoursMin)} - ${formatNumber(totalHoursMax)}` : 
              formatNumber(totalHoursMin)} hours</strong> annually. 
            It occurs <strong>{frequencyDescription}</strong> over 
            <strong> {monthsMarked} month(s)</strong> each year.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SeaweedSchedule;