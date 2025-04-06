// App.tsx
import { useState } from 'react';
import './App.css';
import FisheriesForm from './common/fisheriestForm';

type Views = 'main' | 'seaweed';

const TABS: { key: Views; label: string }[] = [
  { key: 'main', label: 'Home' },
  { key: 'seaweed', label: 'Seaweed Production Schedule' },
];

function App() {
  const [view, setView] = useState<Views>('main');

  return (
    <main className="bg-emerald-100 min-h-screen px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-14 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-slate-900">Fisheries Forms</h1>

      {/* Tabs */}
      <nav className="flex border-b border-gray-300 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`px-4 py-2 -mb-px cursor-pointer font-medium ${
              view === tab.key
                ? 'border-b-2 border-emerald-600 text-emerald-800'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* View switch */}
      {view === 'main' && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
          <p className="max-w-prose">This web application streamlines the data entry process for fisheries-related forms, helping reduce manual effort, improve accuracy and, most-importantly, <b>save time</b>.</p>
          <p>Select a form from the tabs above to get started.</p>
        </section>
      )}

      {view === 'seaweed' && (
        <section>
          <FisheriesForm />
        </section>
      )}
    </main>
  );
}

export default App;