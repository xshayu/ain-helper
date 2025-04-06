import React, { useState } from 'react';

const NUMBER_OF_WEEKS_PER_MONTH = 4.33;

// Format helper
const formatNumber = (num: number) => {
  const rounded = Math.round(num * 10) / 10;
  return rounded.toString().replace(/\.0$/, '');
};

// Tooltip component
export const LabelWithTooltip = ({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) => {
  return (
    <span className="relative inline-flex items-center gap-1 group">
      {children}
      <span
        tabIndex={0}
        className="text-blue-500 cursor-help focus:outline-none"
      >
        ℹ️
      </span>
      <div
        className="absolute z-10 bottom-full mb-1 w-52 p-2 text-sm text-white bg-gray-700 rounded shadow-lg
                   opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100
                   transition-opacity pointer-events-none"
      >
        {tooltip}
      </div>
    </span>
  );
};

const FisheriesForm = () => {
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

  // Calculation with your form insight considered
  const totalTimes = (() => {
    switch (frequencyType) {
      case 'once': return 1;
      case 'perMonth': return frequencyValue * monthsMarked;
      case 'perWeek': return frequencyValue * monthsMarked * NUMBER_OF_WEEKS_PER_MONTH;
      case 'everyXMonths':
        return monthsMarked; // Simplify: run once per marked month
      case 'everyXWeeks':
        const totalWeeks = monthsMarked * NUMBER_OF_WEEKS_PER_MONTH;
        return Math.ceil(totalWeeks / (everyXValue || 1));
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 font-sans">
      <h2 className="text-2xl font-medium mb-6 text-center">Seaweed Production Schedule</h2>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">

        {/* Frequency First */}
        <label>
          <LabelWithTooltip tooltip="How frequently the activity repeats during those months">
            Frequency Type
          </LabelWithTooltip>
          <select
            value={frequencyType}
            onChange={(e) => setFrequencyType(e.target.value as any)}
            className="border p-2 rounded w-full"
          >
            <option value="once">Once</option>
            <option value="perMonth">Times per Month</option>
            <option value="perWeek">Times per Week</option>
            <option value="everyXMonths">Every X Months</option>
            <option value="everyXWeeks">Every X Weeks</option>
          </select>
        </label>

        {frequencyType !== 'once' && !frequencyType.startsWith('every') && (
          <label>
            <LabelWithTooltip tooltip="How many times within the frequency period (week or month)">
              Frequency Number
            </LabelWithTooltip>
            <input
              type="number" placeholder="e.g., 2" min={1}
              value={frequencyValue}
              onChange={(e) => setFrequencyValue(+e.target.value)}
              className="border p-2 rounded w-full"
            />
          </label>
        )}

        {frequencyType.startsWith('every') && (
          <label>
            <LabelWithTooltip tooltip={`Occurs every how many ${frequencyType === 'everyXWeeks' ? 'weeks' : 'months'}`}>
              Every how many {frequencyType === 'everyXWeeks' ? 'weeks' : 'months'}?
            </LabelWithTooltip>
            <input
              type="number" placeholder="e.g., 2" min={1}
              value={everyXValue}
              onChange={(e) => setEveryXValue(+e.target.value)}
              className="border p-2 rounded w-full"
            />
          </label>
        )}

        <label>
          <LabelWithTooltip tooltip="How many months in the year you conduct this activity">
            Number of Months Marked (1-12)
          </LabelWithTooltip>
          <input
            type="number" placeholder="e.g., 6" min={1} max={12}
            value={monthsMarked}
            onChange={(e) => setMonthsMarked(+e.target.value)}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          <LabelWithTooltip tooltip="Optional info only, not included in calculations">
            Number of Times in 6 Months (optional)
          </LabelWithTooltip>
          <input
            type="number" placeholder="e.g., 5" min={0}
            value={timesPerSixMonths}
            onChange={(e) => setTimesPerSixMonths(+e.target.value)}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          <LabelWithTooltip tooltip="Name this activity">
            Activity Name
          </LabelWithTooltip>
          <input
            placeholder="e.g., Buy seedlings"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </label>

        <div className="flex items-center gap-2 sm:col-span-2 mt-2">
          <input 
            type="checkbox" checked={useHourRange}
            onChange={() => setUseHourRange(!useHourRange)}
          />
          <LabelWithTooltip tooltip="Use a min-to-max range instead of one fixed hour estimate?">
            Use Min–Max Hours?
          </LabelWithTooltip>
        </div>

        {useHourRange ? (
          <>
            <label>
              <LabelWithTooltip tooltip="Minimum hours per event">
                Minimum Hours per Activity
              </LabelWithTooltip>
              <input
                type="number" placeholder="e.g., 2" min={0}
                value={hoursMin}
                onChange={(e) => setHoursMin(+e.target.value)}
                className="border p-2 rounded w-full"
              />
            </label>
            <label>
              <LabelWithTooltip tooltip="Maximum hours per event">
                Maximum Hours per Activity
              </LabelWithTooltip>
              <input
                type="number" placeholder="e.g., 4" min={0}
                value={hoursMax}
                onChange={(e) => setHoursMax(+e.target.value)}
                className="border p-2 rounded w-full"
              />
            </label>
          </>
        ) : (
          <label className="sm:col-span-2">
            <LabelWithTooltip tooltip="Estimated hours per event">
              Hours per Activity
            </LabelWithTooltip>
            <input
              type="number" placeholder="e.g., 3" min={0}
              value={hoursMin}
              onChange={(e) => {
                setHoursMin(+e.target.value);
                setHoursMax(+e.target.value);
              }}
              className="border p-2 rounded w-full"
            />
          </label>
        )}
      </div>

      <div className="mt-6 p-4 border rounded bg-teal-100 space-y-2">
        <div className="flex justify-end items-center">
          <div className="text-right">
            <div className="uppercase text-xs text-gray-500">Total Hours / Year</div>
            <div className="text-3xl font-bold">
              {useHourRange
                ? `${formatNumber(totalHoursMin)} - ${formatNumber(totalHoursMax)}`
                : formatNumber(totalHoursMin)}
            </div>
          </div>
        </div>
        <hr />
        <h3 className="italic text-xs text-teal-500 font-bold text-right">
          If this (👇) is correct, this (👆) is.
        </h3>
        <p>
          The activity "<strong>{activityName || '...'}</strong>" takes
          <strong> {useHourRange ? `${formatNumber(totalHoursMin)} - ${formatNumber(totalHoursMax)}` : formatNumber(totalHoursMin)} hours</strong> in a year.
          It is performed <strong>{frequencyDescription}</strong> and done {monthsMarked} month(s) of the year.<br/>
          Estimated total hours annually: <strong>{useHourRange ? `${formatNumber(totalHoursMin)} - ${formatNumber(totalHoursMax)}` : formatNumber(totalHoursMin)}</strong>.
        </p>
      </div>
    </div>
  );
};

export default FisheriesForm;