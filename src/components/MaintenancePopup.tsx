"use client";

import { useState, useEffect } from "react";
import { X, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MaintenancePopup() {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const nowUTC = now.getTime();
      
      // 1:00 PM IST = 7:30 AM UTC (IST is UTC+5:30)
      // Get today's date in UTC
      const today = new Date(now.toISOString().split('T')[0] + 'T07:30:00Z');
      let targetUTC = today.getTime();
      
      // If 1 PM IST (7:30 AM UTC) has already passed today, set it for tomorrow
      if (targetUTC <= nowUTC) {
        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        targetUTC = tomorrow.getTime();
      }
      
      const difference = targetUTC - nowUTC;
      
      if (difference <= 0) {
        setTimeRemaining("00:00:00");
        return;
      }
      
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeRemaining(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    };

    // Calculate immediately
    calculateTimeRemaining();
    
    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 sm:p-8 relative animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-100 rounded-full p-4">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Website Under Maintenance
        </h2>
        <h2 className="text-xl font-bold text-gray-800 text-center mb-6">
          વેબસાઇટ જાળવણી હેઠળ છે
        </h2>

        {/* Message */}
        <div className="space-y-3 mb-6">
          <p className="text-gray-700 text-center">
            Our website is currently under maintenance. We will be back online after 1:00 PM IST.
          </p>
          <p className="text-gray-700 text-center text-sm">
            અમારી વેબસાઇટ હાલમાં જાળવણી હેઠળ છે. અમે IST ના 1:00 PM પછી ઓનલાઇન પાછા આવીશું.
          </p>
        </div>

        {/* Timer */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Time Remaining / બાકી સમય:</span>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 font-mono">
              {timeRemaining || "00:00:00"}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Hours : Minutes : Seconds
            </div>
            <div className="text-xs text-gray-600">
              કલાક : મિનિટ : સેકંડ
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => setIsVisible(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            I Understand / હું સમજી ગયો
          </Button>
        </div>
      </div>
    </div>
  );
}

