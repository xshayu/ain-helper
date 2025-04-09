// App.tsx
import { useState } from 'react';
import './App.css';
import SeaweedSchedule from './common/seaweedSchedule';
import SeaweedInputsForm from './common/seaweedFarmingInputs';
import SeaweedProductionForm from './common/seaweedProductionForm';
import AnnualIncomeCalculator from './common/annualIncome';
import HouseholdIncomeCalculator from './common/householdIncome';

type Views = 'main' | 'seaweed' | 'farmingInputs' | 'investmentItems' | 'seaweedProd' | 'annIncome' | 'seaweedMarket' | 'householdMember';

const TABS: { key: Views; label: string }[] = [
  { key: 'main', label: 'Home' },
  { key: 'seaweed', label: 'Seaweed Production Schedule (Part 3)' },
  { key: 'farmingInputs', label: 'Seaweed Farming Inputs (Part 4)' },
  { key: 'investmentItems', label: 'Investment items (4.1)' },
  { key: 'seaweedProd', label: 'Seaweed Farming Production (Part 5)' },
  { key: 'annIncome', label: 'Annual Income' },
  { key: 'seaweedMarket', label: 'Seaweed Farming Market (Part 6)' },
  { key: 'householdMember', label: 'Household members earning (Part 10.1)' }
];

function App() {
  const [view, setView] = useState<Views>('main');

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
      </div>

      {/* View switch */}
      {view === 'main' && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
          <p className="max-w-prose">This web application streamlines the data entry process for fisheries-related forms.</p><br />
          <p className='max-w-prose italic text-teal-600 font-extrabold'>It's primarily meant for doing the repetitive calculations to save time 💚</p><br/>
          <p>Select a form from the tabs above to get started.</p>
        </section>
      )}

      {view === 'seaweed' && (
        <section>
          <SeaweedSchedule />
        </section>
      )}

      {view === 'farmingInputs' && (
        <section>
          <SeaweedInputsForm />
        </section>
      )}

      {view === 'seaweedProd' && (
        <section>
          <SeaweedProductionForm />
        </section>
      )}

      {view === 'annIncome' && (
        <section>
          <AnnualIncomeCalculator />
        </section>
      )}

      {view === 'seaweedMarket' && (
        <section>

        </section>
      )}

      {view === 'householdMember' && (
        <section>
          <HouseholdIncomeCalculator />
        </section>
      )}

    </main>
  );
}

export default App;