import React, { useState, useRef, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import '../../styles/components/MultiSelect.css';

const MultiSelect = ({ options, value, onChange, placeholder = 'Select...', isDisabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

    const sanitizedOptions = options.filter(option => 
      option.value.includes('https://github.com/ONSdigital')
    );
    options = sanitizedOptions;
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputClick = () => {
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleOptionClick = (option) => {
    const isSelected = value.some(v => v.value === option.value);
    let newValue;
    if (isSelected) {
      newValue = value.filter(v => v.value !== option.value);
    } else {
      newValue = [...value, option];
    }
    onChange(newValue);
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const handleRemoveValue = (optionValue, e) => {
    e.stopPropagation();
    const newValue = value.filter(v => v.value !== optionValue);
    onChange(newValue);
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="multi-select" ref={containerRef}>
      <div className="multi-select-control" onClick={handleInputClick}>
        <div className="multi-select-values">
          {value.map((v) => (
            <div key={v.value} className="multi-select-value">
              {v.label}
              <button onClick={(e) => handleRemoveValue(v.value, e)}>
                <IoClose size={14} />
              </button>
            </div>
          ))}
          <input
            ref={inputRef}
            className="multi-select-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={value.length === 0 ? placeholder : ''}
            disabled={isDisabled}
          />
        </div>
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <div className="multi-select-dropdown">
          {filteredOptions.map((option) => (
            <div
              key={option.label + option.value}
              className={`multi-select-option ${
                value.some(v => v.value === option.value) ? 'selected' : ''
              }`}
              onClick={() => handleOptionClick(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelect; 