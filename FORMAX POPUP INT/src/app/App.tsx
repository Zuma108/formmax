import { useState } from "react";
import FormAnalysisPopup from "./components/FormAnalysisPopup";

export default function App() {
  const [showPopup, setShowPopup] = useState(true);

  return (
    <div className="size-full flex items-center justify-center bg-gray-900/40 min-h-screen">
      {showPopup && (
        <div className="animate-in slide-in-from-bottom duration-300">
          <FormAnalysisPopup onClose={() => setShowPopup(false)} />
        </div>
      )}
      {!showPopup && (
        <button
          onClick={() => setShowPopup(true)}
          className="px-6 py-3 bg-white rounded-full text-black"
          style={{ fontWeight: 600 }}
        >
          Show Analysis
        </button>
      )}
    </div>
  );
}
