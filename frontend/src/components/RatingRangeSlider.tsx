import React, { useState, useCallback, useEffect, ChangeEvent } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import ToggleSwitch from './toggle-switch';

const Container = styled(motion.div)`
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  border-radius: 0.5rem;
  box-shadow: none;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ToggleLabel = styled.span`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
`;

const InputContainer = styled(motion.div)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 0.5rem 0;
  width: 100%;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(0, 0, 0, 0.15);
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-left: auto;
  flex-shrink: 0;
`;

const InputLabel = styled.label`
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.75rem;
  font-weight: 500;
  min-width: 32px;
  text-align: left;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: white;
  padding: 0.25rem 0.4rem;
  width: 60px;
  font-size: 0.8rem;
  font-weight: 500;
  outline: none;
  transition: all 0.15s ease;
  box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.05);
  text-align: center;
  height: 28px;

  &:hover {
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.08);
  }

  &:focus {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
    background: rgba(255, 255, 255, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  -moz-appearance: textfield;
`;

const ErrorText = styled.p`
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  min-height: 1rem;
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
`;

const ModeToggle = styled(motion.div)`
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.15rem;
  gap: 0.15rem;
  width: fit-content;
`;

const ModeButton = styled.button<{ $active: boolean }>`
  position: relative;
  border: none;
  background: transparent;
  color: ${props => props.$active ? 'white' : 'rgba(255, 255, 255, 0.7)'};
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  z-index: 1;
  transition: color 0.3s ease;
`;

interface RatingRangeSliderProps {
  min?: number;
  max?: number;
  step?: number;
  allowSingleValue?: boolean;
  onChange?: (range: { min: number; max: number }) => void;
  disabled?: boolean;
}

const RatingRangeSlider: React.FC<RatingRangeSliderProps> = ({
  min = 800,
  max = 3500,
  step = 100,
  allowSingleValue = true,
  onChange,
  disabled = false,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [range, setRange] = useState({ min, max });
  const [isSingleValue, setIsSingleValue] = useState(false);
  const [error, setError] = useState('');

  // Call onChange with initial values on mount
  useEffect(() => {
    if (onChange) {
      onChange({ min, max });
    }
  }, []); // Only run once on mount

  // Validate and update range
  const validateAndUpdate = useCallback((newMin: number, newMax: number) => {
    let validMin = Math.max(min, Math.min(max, newMin));
    let validMax = Math.max(min, Math.min(max, newMax));
    
    if (validMin > validMax) {
      validMax = validMin;
    }
    
    const newRange = { 
      min: validMin, 
      max: isSingleValue ? validMin : validMax 
    };
    
    setRange(newRange);
    
    if (onChange) {
      onChange(newRange);
    }
    
    return newRange;
  }, [isSingleValue, min, max, onChange]);

  // Handle input change
  const handleInputChange = useCallback((type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value, 10) || 0;
    
    if (isSingleValue) {
      validateAndUpdate(numValue, numValue);
    } else if (type === 'min') {
      validateAndUpdate(numValue, range.max);
    } else {
      validateAndUpdate(range.min, numValue);
    }
  }, [isSingleValue, range, validateAndUpdate]);
  
  // Handle blur to ensure values are within range
  const handleBlur = useCallback(() => {
    validateAndUpdate(range.min, range.max);
  }, [range, validateAndUpdate]);

  // Toggle between single value and range mode
  const toggleSingleValue = useCallback((newSingleValue: boolean) => {
    setIsSingleValue(newSingleValue);
    
    if (newSingleValue) {
      // Switch to single value mode - set both min and max to current min
      const newRange = {
        min: range.min,
        max: range.min
      };
      setRange(newRange);
      if (onChange) {
        onChange(newRange);
      }
    } else {
      // Switch to range mode - keep current min, set max to either the previous max or min + step
      const newRange = {
        min: range.min,
        max: Math.max(range.min + step, range.max)
      };
      setRange(newRange);
      if (onChange) {
        onChange(newRange);
      }
    }
  }, [range.min, range.max, step, onChange]);

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  } as const;

  return (
    <Container
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    >
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Title>Rating Range</Title>
          <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9em' }}>
            ({min} - {max})
          </span>
        </div>
        <ToggleSwitch 
          name="ratingRange"
          checked={isEnabled}
          onChange={() => setIsEnabled(!isEnabled)}
          disabled={disabled}
        />
      </Header>
      
      {isEnabled && (
        <InputContainer
          initial={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
          animate={{ 
            opacity: 1, 
            height: 'auto',
            marginTop: '1.5rem',
            marginBottom: '1rem',
            transition: { 
              opacity: { duration: 0.2 },
              height: { duration: 0.3, ease: "easeInOut" },
              margin: { duration: 0.3, ease: "easeInOut" }
            }
          }}
          exit={{ 
            opacity: 0, 
            height: 0, 
            marginTop: 0, 
            marginBottom: 0,
            transition: { 
              opacity: { duration: 0.1 },
              height: { duration: 0.2, ease: "easeInOut" },
              margin: { duration: 0.2, ease: "easeInOut" }
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {allowSingleValue && (
              <ModeToggle>
                <AnimatePresence mode="wait">
                  {!isSingleValue && (
                    <motion.div
                      key="active-bg"
                      layoutId="active-bg"
                      style={{
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        right: '50%',
                        bottom: '2px',
                        background: 'rgba(139, 92, 246, 0.3)',
                        borderRadius: '4px',
                        zIndex: 0,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                  {isSingleValue && (
                    <motion.div
                      key="active-bg-single"
                      layoutId="active-bg"
                      style={{
                        position: 'absolute',
                        top: '2px',
                        left: '50%',
                        right: '2px',
                        bottom: '2px',
                        background: 'rgba(139, 92, 246, 0.3)',
                        borderRadius: '4px',
                        zIndex: 0,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </AnimatePresence>
                <ModeButton
                  $active={!isSingleValue}
                  onClick={() => toggleSingleValue(false)}
                >
                  Range
                </ModeButton>
                <ModeButton
                  $active={isSingleValue}
                  onClick={() => toggleSingleValue(true)}
                >
                  Single
                </ModeButton>
              </ModeToggle>
            )}
            
            <InputWrapper>
              <InputLabel>{isSingleValue ? 'Rating:' : 'Min:'}</InputLabel>
              <Input
                type="number"
                min={min}
                max={max}
                step={step}
                value={range.min}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('min', e.target.value)
                }
                onBlur={handleBlur}
              />
              {!isSingleValue && (
                <>
                  <span style={{ color: 'rgba(255, 255, 255, 0.5)', margin: '0 0.25rem' }}>—</span>
                  <InputLabel>Max:</InputLabel>
                  <Input
                    type="number"
                    min={range.min}
                    max={max}
                    step={step}
                    value={range.max}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      handleInputChange('max', e.target.value)
                    }
                    onBlur={handleBlur}
                  />
                </>
              )}
            </InputWrapper>
          </div>
          
          
          {error && <ErrorText>{error}</ErrorText>}
        </InputContainer>
      )}
    </Container>
  );
};

export default RatingRangeSlider;
