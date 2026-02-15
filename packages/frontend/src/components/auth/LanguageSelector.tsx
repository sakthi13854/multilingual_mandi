import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SUPPORTED_LANGUAGES } from '../../types/auth';

interface LanguageSelectorProps {
  currentLanguage?: string;
  onLanguageChange?: (language: string) => void;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  className = '',
}) => {
  const { user, updateLanguagePreference } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLanguage = currentLanguage || user?.preferredLanguage || 'en';

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    
    // If there's an external handler, use it
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
      return;
    }

    // If user is authenticated, update their preference
    if (user) {
      setIsUpdating(true);
      setError(null);
      
      try {
        const result = await updateLanguagePreference(newLanguage);
        
        if (!result.success) {
          setError(result.error || 'Failed to update language preference');
          // Reset the select to the previous value
          e.target.value = selectedLanguage;
        }
      } catch (error) {
        setError('An unexpected error occurred');
        e.target.value = selectedLanguage;
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedLanguage}
        onChange={handleLanguageChange}
        disabled={isUpdating}
        className={`appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        title="Select your preferred language"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name} ({lang.nativeName})
          </option>
        ))}
      </select>
      
      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Loading indicator */}
      {isUpdating && (
        <div className="absolute inset-y-0 right-8 flex items-center">
          <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm z-10">
          {error}
        </div>
      )}
    </div>
  );
};

// Compact version for headers/navbars
export const CompactLanguageSelector: React.FC<LanguageSelectorProps> = (props) => {
  const selectedLanguage = props.currentLanguage || 'en';

  return (
    <div className="relative">
      <select
        value={selectedLanguage}
        onChange={(e) => props.onLanguageChange?.(e.target.value)}
        className="appearance-none bg-transparent border-none text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none cursor-pointer pr-6"
        title="Select language"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
      
      <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};