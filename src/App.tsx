import { ChatInterface } from './ChatInterface';

function App() {
  console.log('App component rendering');

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <ChatInterface />
      </div>
    </main>
  );
}

export default App;
