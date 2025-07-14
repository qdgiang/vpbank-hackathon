import React, { createContext, useContext, useState } from 'react';

const BankContext = createContext();

export const useBank = () => useContext(BankContext);

export const BankProvider = ({ children }) => {
  const [isBankConnected, setIsBankConnected] = useState(false);
  const [bankInfo, setBankInfo] = useState(null);

  const connectBank = (bank) => {
    setIsBankConnected(true);
    setBankInfo(bank);
  };

  const disconnectBank = () => {
    setIsBankConnected(false);
    setBankInfo(null);
  };

  return (
    <BankContext.Provider value={{ isBankConnected, bankInfo, connectBank, disconnectBank }}>
      {children}
    </BankContext.Provider>
  );
}; 