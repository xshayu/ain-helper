import { useState } from 'react';
import './App.css';
import FisheriesForm from './common/fisheriestForm';

type Views = 'main' | 'Seaweed Production Schedule';

function App() {
  const [view, setView] = useState<Views>('main');

  return (
    <main className="bg-emerald-100 min-h-screen px-12 py-14 flex flex-col gap-4">
      <h1 className="text-2xl font-medium text-slate-900">
        Fisheries Forms
      </h1>
      <p>
        This web-app helps save time by streamlining
        the mundane process of filling out sheets.
      </p>
      <FisheriesForm />
    </main>
  )
}

export default App
