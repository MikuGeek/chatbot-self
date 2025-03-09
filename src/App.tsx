import { ChatContainer } from '@/components/chat';

function App() {
  return (
    <main className="h-screen overflow-hidden bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="h-full container mx-auto px-4 py-4 flex items-center justify-center">
        <ChatContainer />
      </div>
    </main>
  );
}

export default App;
