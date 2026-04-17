import React from 'react';

interface GlassRadioGroupProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const GlassRadioGroup: React.FC<GlassRadioGroupProps> = ({
  value = 'icpc',
  onChange,
  className
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`glass-radio-wrapper ${className || ''}`}>
      <div className="glass-radio-group">
        <input
          type="radio"
          name="competition-type"
          id="type-icpc"
          value="icpc"
          checked={value === 'icpc'}
          onChange={handleChange}
        />
        <label htmlFor="type-icpc" className="text-center">
          ICPC
        </label>
        <input
          type="radio"
          name="competition-type"
          id="type-ioi"
          value="ioi"
          checked={value === 'ioi'}
          onChange={handleChange}
        />
        <label htmlFor="type-ioi" className="text-center">
          IOI
        </label>
        <input
          type="radio"
          name="competition-type"
          id="type-long"
          value="long"
          checked={value === 'long'}
          onChange={handleChange}
        />
        <label htmlFor="type-long" className="text-center">
          LONG
        </label>
        <div className="glass-glider" />
      </div>

      <style jsx>{`
        .glass-radio-wrapper {
          --bg: rgba(255, 255, 255, 0.06);
          --text: #e5e5e5;
          --border-radius: 8px;
        }

        .glass-radio-group {
          display: flex;
          position: relative;
          background: var(--bg);
          border-radius: var(--border-radius);
          backdrop-filter: blur(12px);
          box-shadow:
            inset 1px 1px 4px rgba(255, 255, 255, 0.1),
            inset -1px -1px 4px rgba(0, 0, 0, 0.2),
            0 2px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          width: 100%;
          margin: 0;
          height: 36px;
          padding: 1px;
        }

        .glass-radio-group input {
          display: none;
        }

        .glass-radio-group label {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 0;
          font-size: 13px;
          padding: 0 0.5rem;
          margin: 1px;
          cursor: pointer;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.2px;
          color: var(--text);
          position: relative;
          z-index: 2;
          transition: all 0.25s ease-in-out;
          height: 32px;
          border-radius: calc(var(--border-radius) - 1px);
        }

        .glass-radio-group label:hover {
          color: white;
        }

        .glass-radio-group input:checked + label {
          color: #fff;
        }

        .glass-glider {
          position: absolute;
          top: 1px;
          bottom: 1px;
          left: 1px;
          right: auto;
          width: calc(33.333% - 1px);
          border-radius: calc(var(--border-radius) - 1px);
          z-index: 1;
          transition:
            transform 0.4s cubic-bezier(0.37, 1.95, 0.66, 0.56),
            background 0.3s ease-in-out,
            box-shadow 0.3s ease-in-out;
        }

        /* ICPC - Gold */
        #type-icpc:checked ~ .glass-glider {
          transform: translateX(0%);
          background: linear-gradient(135deg, #FFD70055, #D4AF37);
          box-shadow:
            0 0 18px rgba(255, 215, 0, 0.5),
            0 0 10px rgba(255, 235, 150, 0.4) inset;
        }

        /* IOI - Red */
        #type-ioi:checked ~ .glass-glider {
          transform: translateX(100%);
          background: linear-gradient(135deg, #F4433655, #B71C1C);
          box-shadow:
            0 0 18px rgba(244, 67, 54, 0.5),
            0 0 10px rgba(255, 200, 200, 0.4) inset;
        }

        /* LONG - Green */
        #type-long:checked ~ .glass-glider {
          transform: translateX(calc(200% + 1px));
          background: linear-gradient(135deg, #4CAF5055, #2E7D32);
          box-shadow:
            0 0 18px rgba(76, 175, 80, 0.5),
            0 0 10px rgba(200, 255, 200, 0.4) inset;
        }
      `}</style>
    </div>
  );
}

// Add display name for better debugging
GlassRadioGroup.displayName = 'GlassRadioGroup';

export default GlassRadioGroup;
