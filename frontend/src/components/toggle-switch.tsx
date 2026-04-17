import React from 'react';
import styled from 'styled-components';

interface ToggleSwitchProps {
  name?: string;
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
}

const SwitchContainer = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
`;

const Slider = styled.span<{ disabled?: boolean }>`
  position: absolute;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.disabled ? '#374151' : '#4B5563'};
  transition: .4s;
  border-radius: 24px;
  opacity: ${props => props.disabled ? 0.5 : 1};

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: ${props => props.disabled ? '#9CA3AF' : 'white'};
    transition: .4s;
    border-radius: 50%;
  }
`;

const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + ${Slider} {
    background-color: #8b5cf6;
  }

  &:checked + ${Slider}:before {
    transform: translateX(20px);
  }
`;

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  name = 'toggle', 
  checked = false, 
  onChange,
  className = '',
  disabled = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange && !disabled) {
      onChange(e);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <SwitchContainer>
        <HiddenCheckbox 
          id={name}
          name={name}
          checked={checked}
          onChange={handleChange}
          aria-label={name}
          disabled={disabled}
        />
        <Slider disabled={disabled} />
      </SwitchContainer>
    </div>
  );
};

export default ToggleSwitch;
