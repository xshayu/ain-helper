// App.tsx
import { useState } from 'react';
import './App.css';
import SeaweedSchedule from './common/seaweedSchedule';
import SeaweedInputsForm from './common/seaweedFarmingInputs';
import InvestmentItemsForm from './common/investmentItems';
import AnnualIncomeCalculator from './common/annualIncome';
import HouseholdIncomeCalculator from './common/householdIncome';

const TABS = [
  { key: 'main', label: 'Home', component: () => (
    <section>
      <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
      <p className="max-w-prose">This web application streamlines the data entry process for fisheries-related forms.</p><br />
      <p className='max-w-prose italic text-teal-600 font-extrabold'>It's primarily meant for doing the repetitive calculations to save time 💚</p><br/>
      <p>Select a form from the tabs above to get started.</p>
    </section>
  )},
  { key: 'seaweed', label: 'Seaweed Production Schedule (Part 3)', component: SeaweedSchedule },
  { key: 'farmingInputs', label: 'Seaweed Farming Inputs (Part 4)', component: SeaweedInputsForm },
  { key: 'investmentItems', label: 'Investment items (4.1)', component: InvestmentItemsForm },
  { key: 'annIncome', label: 'Annual Income (Part 5 and 6)', component: AnnualIncomeCalculator },
  { key: 'householdMember', label: 'Household members earning (Part 10.1)', component: HouseholdIncomeCalculator }
] as const;

type Views = typeof TABS[number]['key'];

function App() {
  const [view, setView] = useState<Views>('main');
  const [resetCounter, setResetCounter] = useState(0);

  const reset = () => {
    setResetCounter(prevCounter => prevCounter + 1);
  };

  const CurrentComponent = TABS.find(tab => tab.key === view)?.component || (() => null);

  return (
    <main className="bg-emerald-100 min-h-screen px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-14 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-slate-900">Fisheries Forms</h1>

      {/* Select Dropdown */}
      <div className="mb-6">
        <select
          value={view}
          onChange={(e) => setView(e.target.value as Views)}
          className="px-4 py-2 border-2 border-teal-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {TABS.map((tab) => (
            <option key={tab.key} value={tab.key}>
              {tab.label}
            </option>
          ))}
        </select>
        <button onClick={reset} className="ml-2 px-4 py-2 bg-teal-200 rounded-md hover:bg-teal-300 transition-colors">
          Reset to original values
        </button>
      </div>

      <section>
        <CurrentComponent key={resetCounter} />
      </section>

    </main>
  );
}

export default App;