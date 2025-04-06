import React, { useState } from 'react';

const NUMBER_OF_WEEKS_PER_MONTH = 4.3;

// Format number: remove trailing .0, else show max 1 decimal place
const formatNumber = (num: number) => {
  const rounded = Math.round(num * 10) / 10;
  return rounded.toString().replace(/\.0$/, '');
};

// Small tooltip icon component
const LabelWithTooltip = ({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) => (
  <span className="flex items-center gap-1">
    {children}
    <span title={tooltip} className="cursor-help text-blue-500">
      ℹ️
    </span>
  </span>
);

const FisheriesForm = () => {
  const [activityName, setActivityName] = useState('');
  const [monthsMarked, setMonthsMarked] = useState(6);
  const [frequencyType, setFrequencyType] = useState<'perMonth' | 'perWeek' | 'everyXMonths' | 'everyXWeeks' | 'once'>('perMonth');
  const [frequencyValue, setFrequencyValue] = useState(1);
  const [everyXValue, setEveryXValue] = useState(2);
  const [timesPerSixMonths, setTimesPerSixMonths] = useState(0);
  const [useHourRange, setUseHourRange] = useState(false);
  const [hoursMin, setHoursMin] = useState(3);
  const [hoursMax, setHoursMax] = useState(3);

  const totalTimes = (() => {
    switch (frequencyType) {
      case 'once':
        return 1;
      case 'perMonth':
        return frequencyValue * monthsMarked;
      case 'perWeek':
        return frequencyValue * monthsMarked * NUMBER_OF_WEEKS_PER_MONTH;
      case 'everyXMonths':
        return Math.ceil(monthsMarked / (everyXValue || 1));
      case 'everyXWeeks':
        const weeksTotal = monthsMarked * NUMBER_OF_WEEKS_PER_MONTH;
        return Math.ceil(weeksTotal / (everyXValue || 1));
      default:
        return 0;
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
    <div className="max-w-4xl mx-auto p-6 font-sans">
      <h1 className="text-2xl font-bold mb-6 text-center">Fisheries Calculation Form</h1>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <LabelWithTooltip tooltip="Name of the activity you're calculating for">
            Activity Name
          </LabelWithTooltip>
          <input
            placeholder="e.g., Buy seedling"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          <LabelWithTooltip tooltip="How many months in the year you conduct this activity">
            Number of Months Marked (1–12)
          </LabelWithTooltip>
          <input
            type="number"
            placeholder="e.g., 6"
            min={1}
            max={12}
            value={monthsMarked}
            onChange={(e) => setMonthsMarked(+e.target.value)}
            className="border p-2 rounded w-full"
          />
        </label>

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
            <LabelWithTooltip tooltip="How many times during the frequency period (week or month)">
              Frequency Number
            </LabelWithTooltip>
            <input
              type="number"
              placeholder="e.g., 2"
              min={1}
              value={frequencyValue}
              onChange={(e) => setFrequencyValue(+e.target.value)}
              className="border p-2 rounded w-full"
            />
          </label>
        )}

        {frequencyType.startsWith('every') && (
          <label>
            <LabelWithTooltip tooltip={`Activity occurs every how many ${frequencyType === 'everyXWeeks' ? 'weeks' : 'months'} during marked period`}>
              Every how many {frequencyType === 'everyXWeeks' ? 'weeks' : 'months'}?
            </LabelWithTooltip>
            <input
              type="number"
              placeholder={`e.g., 2`}
              min={1}
              value={everyXValue}
              onChange={(e) => setEveryXValue(+e.target.value)}
              className="border p-2 rounded w-full"
            />
          </label>
        )}

        <label>
          <LabelWithTooltip tooltip="Occurences of this activity in 6 months (not used for calculation)">
            Number of Times in 6 Months (info only)
          </LabelWithTooltip>
          <input
            type="number"
            placeholder="Optional info e.g., 4"
            min={0}
            value={timesPerSixMonths}
            onChange={(e) => setTimesPerSixMonths(+e.target.value)}
            className="border p-2 rounded w-full"
          />
        </label>

        <div className="flex items-center gap-2 sm:col-span-2 mt-2">
          <input 
            type="checkbox" 
            checked={useHourRange}
            onChange={() => setUseHourRange(!useHourRange)}
          />
          <LabelWithTooltip tooltip="Use a minimum/maximum estimate instead of a fixed hours-per-activity">
            Use Min–Max Hours?
          </LabelWithTooltip>
        </div>

        {useHourRange ? (
          <>
            <label>
              <LabelWithTooltip tooltip="Minimum hours this activity usually takes per occurrence.">
                Minimum Hours per Activity
              </LabelWithTooltip>
              <input
                type="number"
                placeholder="e.g., 2"
                min={0}
                value={hoursMin}
                onChange={(e) => setHoursMin(+e.target.value)}
                className="border p-2 rounded w-full"
              />
            </label>
            <label>
              <LabelWithTooltip tooltip="Maximum hours this activity usually takes per occurrence.">
                Maximum Hours per Activity
              </LabelWithTooltip>
              <input
                type="number"
                placeholder="e.g., 4"
                min={0}
                value={hoursMax}
                onChange={(e) => setHoursMax(+e.target.value)}
                className="border p-2 rounded w-full"
              />
            </label>
          </>
        ) : (
          <label className="sm:col-span-2">
            <LabelWithTooltip tooltip="Estimated hours this activity takes per occurrence.">
              Hours per Activity
            </LabelWithTooltip>
            <input
              type="number"
              placeholder="e.g., 3"
              min={0}
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

      <div className="mt-6 p-4 border rounded bg-gray-100 space-y-2">
        <p>
          The activity "<strong>{activityName || '...'}</strong>" takes 
          <strong> {useHourRange ? `${formatNumber(totalHoursMin)} - ${formatNumber(totalHoursMax)}` : formatNumber(totalHoursMin)} hours</strong> over the course of the year.
          It is performed <strong>{frequencyDescription}</strong> during {monthsMarked} month(s). <br />
          So, total number of hours annually is approximately 
          <strong> {useHourRange ? `${formatNumber(totalHoursMin)} - ${formatNumber(totalHoursMax)}` : formatNumber(totalHoursMin)}</strong>.
        </p>
        <hr />
        <h2 className="font-semibold">Detailed Results:</h2>
        <p><strong>Total repetitions per year:</strong> {formatNumber(totalTimes)}</p>
        <p><strong>Total hours per year:</strong> {
          useHourRange
            ? `${formatNumber(totalHoursMin)} - ${formatNumber(totalHoursMax)}`
            : formatNumber(totalHoursMin)
        } hours</p>
      </div>
    </div>
  );
};

export default FisheriesForm;