import { PrimeReactProvider } from "primereact/api";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import { Home } from "./pages/Home";
import { Room } from "./pages/Room";
import "primereact/resources/themes/soho-light/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "./App.css";

function App() {
  return (
    <PrimeReactProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:pin" element={<Room />} />
            <Route path="*" element={<Home />} /> {/* Ruta de fallback */}
          </Routes>
        </Router>
      </SocketProvider>
    </PrimeReactProvider>
  );
}

export default App;
