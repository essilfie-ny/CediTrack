import React, { createContext, useState, useEffect, useContext } from 'react';
import { get } from '../api/client';
import { AuthContext } from './AuthContext';

export const AppContext = createContext();

export const CURRENCIES = [
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', locale: 'en-GH' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
];

export const AppProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('ceditrack_currency') || 'GHS';
  });

  const setCurrency = (code) => {
    setCurrencyState(code);
    localStorage.setItem('ceditrack_currency', code);
  };

  const fetchAccounts = async () => {
    try {
      const { data } = await get('/accounts');
      setAccounts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await get('/categories');
      setCategories(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAccounts();
      fetchCategories();
    }
  }, [isAuthenticated]);

  const refreshAccounts = () => fetchAccounts();
  const refreshCategories = () => fetchCategories();

  const formatAmount = (pesewas, forceCurrency) => {
    const activeCode = forceCurrency || currency;
    const currObj = CURRENCIES.find(c => c.code === activeCode) || CURRENCIES[0];
    const amount = (pesewas || 0) / 100;

    try {
      return `${currObj.symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } catch (_err) {
      return `${currObj.symbol} ${amount.toFixed(2)}`;
    }
  };

  return (
    <AppContext.Provider value={{ 
      accounts, 
      categories, 
      currency, 
      setCurrency, 
      CURRENCIES, 
      refreshAccounts, 
      refreshCategories, 
      formatAmount 
    }}>
      {children}
    </AppContext.Provider>
  );
};
