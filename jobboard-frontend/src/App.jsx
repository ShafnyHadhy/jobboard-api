import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          {/* We will add a Navbar component here later */}
          <main className="flex-grow">
            <Routes>
              {/* <Route path="/" element={<Home />} /> */}
              {/* <Route path="/login" element={<Login />} /> */}
              {/* <Route path="/register" element={<Register />} /> */}
              <Route path="*" element={<div className="p-10 text-center text-xl">Building...</div>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;