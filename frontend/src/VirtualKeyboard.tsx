import React, { useState } from 'react';

interface VirtualKeyboardProps {
  onChange: (input: string) => void;
  input: string;
  language: string;
  onClose: () => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onChange, input, language, onClose }) => {
  const [isShifted, setIsShifted] = useState(false);

  const layouts: Record<string, { default: string[][]; shift: string[][] }> = {
    km: {
      default: [
        ["១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩", "០", "-", "="],
        ["ញ", "វ", "េ", "រ", "ត", "យ", "ុ", "ិ", "ោ", "ផ", "{bksp}"],
        ["ា", "ស", "ដ", "ថ", "ង", "ហ", "្", "ក", "ល", "{enter}"],
        ["{shift}", "ច", "ខ", "ប", "ន", "ម", ",", ".", "/", "{shift}"],
        ["{space}"]
      ],
      shift: [
        ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+"],
        ["៌", "ូ", "ើ", "ឿ", "ៀ", "ួ", "ំ", "ះ", "ោះ", "ភ", "{bksp}"],
        ["ាំ", "ី", "ឌ", "ធ", "អ", "រ", "្ត", "គ", "ឡ", "{enter}"],
        ["{shift}", "ឍ", "ឃ", "ភ", "ណ", "ញ", "<", ">", "?", "{shift}"],
        ["{space}"]
      ]
    },
    bna_ede: {
      default: [
        ["ƀ", "č", "ñ", "ł", "ă", "â", "ê", "ô", "ơ", "ư", "ơ̆", "ư̆"],
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "{bksp}"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l", "{enter}"],
        ["{shift}", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "{shift}"],
        ["{space}"]
      ],
      shift: [
        ["Ɓ", "Č", "Ñ", "Ł", "Ă", "Â", "Ê", "Ô", "Ơ", "Ư", "Ơ̆", "Ư̆"],
        ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+"],
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "{bksp}"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L", "{enter}"],
        ["{shift}", "Z", "X", "C", "V", "B", "N", "M", "<", ">", "?", "{shift}"],
        ["{space}"]
      ]
    },
    default: {
      default: [
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "{bksp}"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l", "{enter}"],
        ["{shift}", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "{shift}"],
        ["{space}"]
      ],
      shift: [
        ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+"],
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "{bksp}"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L", "{enter}"],
        ["{shift}", "Z", "X", "C", "V", "B", "N", "M", "<", ">", "?", "{shift}"],
        ["{space}"]
      ]
    }
  };

  const getActiveLayout = () => {
    let key = 'default';
    if (language === 'km') key = 'km';
    else if (language === 'bna' || language === 'ede') key = 'bna_ede';
    
    const layout = layouts[key];
    return isShifted ? layout.shift : layout.default;
  };

  const handleKeyClick = (key: string) => {
    if (key === '{shift}') {
      setIsShifted(!isShifted);
    } else if (key === '{bksp}') {
      onChange(input.slice(0, -1));
    } else if (key === '{enter}') {
      onChange(input + '\n');
    } else if (key === '{space}') {
      onChange(input + ' ');
    } else {
      onChange(input + key);
    }
  };

  const getKeyLabel = (key: string) => {
    if (key === '{shift}') return '⇧ Shift';
    if (key === '{bksp}') return '⌫ Xóa';
    if (key === '{enter}') return '↵ Enter';
    if (key === '{space}') return 'Khoảng cách (Space)';
    return key;
  };

  return (
    <div className="virtual-keyboard-container custom-kb">
      <div className="keyboard-header">
        <span className="kb-title">Bàn phím ảo ({language.toUpperCase()})</span>
        <button className="btn-close-kb" onClick={onClose} title="Đóng bàn phím">✕</button>
      </div>
      <div className="keyboard-grid">
        {getActiveLayout().map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.map((key, keyIndex) => (
              <button
                key={keyIndex}
                className={`kb-key ${key.startsWith('{') ? 'key-func' : ''} ${key === '{space}' ? 'key-space' : ''} ${(key === '{shift}' && isShifted) ? 'active' : ''}`}
                onClick={() => handleKeyClick(key)}
                type="button"
              >
                {getKeyLabel(key)}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualKeyboard;
