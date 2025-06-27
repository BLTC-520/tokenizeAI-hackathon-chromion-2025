
import React, { useState, useEffect } from 'react';

const ChainlinkUpkeepWidget = () => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      
      const minutesLeft = 59 - minutes;
      const secondsLeft = 59 - seconds;
      
      return `${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
      <div className="text-center">
        <p className="text-white/80 text-sm font-bold">Next Upkeep In:</p>
        <p className="text-white text-3xl font-bold">{timeLeft}</p>
      </div>
      <p className="text-xs text-white/60 mt-2 text-center font-bold">Chainlink Automation clears expired tokens hourly.</p>
    </div>
  );
};

export default ChainlinkUpkeepWidget;
