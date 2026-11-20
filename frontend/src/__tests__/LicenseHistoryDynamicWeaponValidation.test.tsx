import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Select } from '../components/forms/elements/Select';

// Extract the validation logic identical to LicenseHistory.tsx for unit testing
const validateLicenseHistory = (formData: any) => {
  const errors: Record<string, string> = {};
  const history = formData.licenseHistories?.[0];

  if (history && history.hasFamilyLicence) {
    if (!history.familyMemberName?.trim()) {
      errors.familyName = 'Family member name is required';
    }
    if (!history.familyLicenceNumber?.trim()) {
      errors.familyLicenseNumber = 'License number is required';
    }

    const hasWeapons = Array.isArray(history.familyWeaponsEndorsed) && history.familyWeaponsEndorsed.length > 0;
    const hasUnselectedWeapons = Boolean(
      history.hasUnselectedFamilyWeapons ||
      (Array.isArray(history.familyWeapons) && history.familyWeapons.some((w: any) => !w || w === 0 || isNaN(Number(w))))
    );

    if (!hasWeapons || hasUnselectedWeapons) {
      errors.familyWeapons = 'Please select a weapon.';
    }
  }

  return errors;
};

// Component mimicking the dynamic weapon endorsement section
const MockWeaponsEndorsedSection = ({
  availableWeapons = [
    { id: 1, name: 'Pistol' },
    { id: 2, name: 'Rifle' },
    { id: 3, name: 'Revolver' },
  ],
  onValidityChange,
}: {
  availableWeapons?: { id: number; name: string }[];
  onValidityChange?: (isValid: boolean) => void;
}) => {
  const [weaponsState, setWeaponsState] = useState<number[]>([0]);

  const hasUnselected = weaponsState.length === 0 || weaponsState.some(w => !w || w === 0);
  const isValid = !hasUnselected;

  React.useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  const addWeapon = () => {
    if (weaponsState.length >= availableWeapons.length) return;
    setWeaponsState(prev => [...prev, 0]);
  };

  const removeWeapon = (index: number) => {
    setWeaponsState(prev => {
      const remaining = prev.filter((_, wi) => wi !== index);
      return remaining.length > 0 ? remaining : [0];
    });
  };

  const handleWeaponChange = (index: number, val: string) => {
    const id = parseInt(val) || 0;
    setWeaponsState(prev => prev.map((w, wi) => (wi === index ? id : w)));
  };

  const isAddDisabled = weaponsState.length >= availableWeapons.length;

  return (
    <div>
      <div data-testid="form-valid-indicator">{isValid ? 'VALID' : 'INVALID'}</div>
      <button data-testid="save-draft-btn" disabled={!isValid}>
        Save to Draft
      </button>
      <button data-testid="next-step-btn" disabled={!isValid}>
        Next Step
      </button>

      {weaponsState.map((weaponId, widx) => (
        <div key={widx} data-testid={`weapon-row-${widx}`}>
          <Select
            label={`Weapon ${widx + 1}`}
            name={`weapon-${widx}`}
            value={weaponId && weaponId !== 0 ? String(weaponId) : ''}
            onChange={e => handleWeaponChange(widx, e.target.value)}
            options={availableWeapons
              .filter(w => !weaponsState.some((chosenId, wi) => chosenId === w.id && wi !== widx))
              .map(w => ({ value: String(w.id), label: w.name }))}
            placeholder="Select the Endorsed Weapon"
          />
          <button
            type="button"
            data-testid={`add-btn-${widx}`}
            disabled={isAddDisabled}
            onClick={addWeapon}
          >
            +
          </button>
          {(weaponId !== 0 || weaponsState.length > 1) && (
            <button
              type="button"
              data-testid={`remove-btn-${widx}`}
              onClick={() => removeWeapon(widx)}
            >
              -
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

describe('License History - Dynamic Weapon Validation & (+) Button Restriction', () => {
  describe('validateLicenseHistory function', () => {
    test('is invalid when Weapon 1 is unselected [0]', () => {
      const formData = {
        licenseHistories: [
          {
            hasFamilyLicence: true,
            familyMemberName: 'Suresh Kumar',
            familyLicenceNumber: 'ARM123',
            hasUnselectedFamilyWeapons: true,
            familyWeapons: [0],
            familyWeaponsEndorsed: [],
          },
        ],
      };
      const errors = validateLicenseHistory(formData);
      expect(errors.familyWeapons).toBe('Please select a weapon.');
    });

    test('is valid when Weapon 1 has a selection [1]', () => {
      const formData = {
        licenseHistories: [
          {
            hasFamilyLicence: true,
            familyMemberName: 'Suresh Kumar',
            familyLicenceNumber: 'ARM123',
            hasUnselectedFamilyWeapons: false,
            familyWeapons: [1],
            familyWeaponsEndorsed: ['Pistol'],
          },
        ],
      };
      const errors = validateLicenseHistory(formData);
      expect(errors.familyWeapons).toBeUndefined();
    });

    test('becomes invalid when Weapon 2 is added but unselected [1, 0]', () => {
      const formData = {
        licenseHistories: [
          {
            hasFamilyLicence: true,
            familyMemberName: 'Suresh Kumar',
            familyLicenceNumber: 'ARM123',
            hasUnselectedFamilyWeapons: true,
            familyWeapons: [1, 0],
            familyWeaponsEndorsed: ['Pistol'],
          },
        ],
      };
      const errors = validateLicenseHistory(formData);
      expect(errors.familyWeapons).toBe('Please select a weapon.');
    });

    test('becomes valid when Weapon 2 is also selected [1, 2]', () => {
      const formData = {
        licenseHistories: [
          {
            hasFamilyLicence: true,
            familyMemberName: 'Suresh Kumar',
            familyLicenceNumber: 'ARM123',
            hasUnselectedFamilyWeapons: false,
            familyWeapons: [1, 2],
            familyWeaponsEndorsed: ['Pistol', 'Rifle'],
          },
        ],
      };
      const errors = validateLicenseHistory(formData);
      expect(errors.familyWeapons).toBeUndefined();
    });
  });

  describe('UI Dynamic Workflow & Button Restriction', () => {
    test('disables Save to Draft and Next Step when newly added weapon is unselected', () => {
      render(<MockWeaponsEndorsedSection />);

      const saveDraftBtn = screen.getByTestId('save-draft-btn');
      const nextStepBtn = screen.getByTestId('next-step-btn');

      // Initially Weapon 1 is unselected -> buttons disabled
      expect(saveDraftBtn).toBeDisabled();
      expect(nextStepBtn).toBeDisabled();

      // Select Weapon 1 (Pistol)
      const select1 = screen.getAllByRole('combobox')[0];
      fireEvent.change(select1, { target: { value: '1' } });

      // Now valid -> buttons enabled
      expect(saveDraftBtn).not.toBeDisabled();
      expect(nextStepBtn).not.toBeDisabled();

      // Click (+) to add Weapon 2
      const addBtn0 = screen.getByTestId('add-btn-0');
      fireEvent.click(addBtn0);

      // Now 2 weapon dropdowns exist, Weapon 2 is unselected
      expect(screen.getAllByRole('combobox')).toHaveLength(2);
      expect(saveDraftBtn).toBeDisabled();
      expect(nextStepBtn).toBeDisabled();

      // Select Weapon 2 (Rifle)
      const select2 = screen.getAllByRole('combobox')[1];
      fireEvent.change(select2, { target: { value: '2' } });

      // Both selected -> buttons re-enabled
      expect(saveDraftBtn).not.toBeDisabled();
      expect(nextStepBtn).not.toBeDisabled();

      // Remove Weapon 2 using (-) button
      const removeBtn1 = screen.getByTestId('remove-btn-1');
      fireEvent.click(removeBtn1);

      // Back to 1 selected weapon -> buttons remain enabled
      expect(screen.getAllByRole('combobox')).toHaveLength(1);
      expect(saveDraftBtn).not.toBeDisabled();
      expect(nextStepBtn).not.toBeDisabled();
    });

    test('automatically disables (+) button once all available weapons have been added', () => {
      // 3 available weapons
      render(<MockWeaponsEndorsedSection />);

      // 1 weapon field: length 1 < 3 -> (+) enabled
      let addBtn = screen.getAllByText('+')[0];
      expect(addBtn).not.toBeDisabled();

      // Add 2nd weapon field: length 2 < 3 -> (+) enabled
      fireEvent.click(addBtn);
      expect(screen.getAllByRole('combobox')).toHaveLength(2);
      addBtn = screen.getAllByText('+')[0];
      expect(addBtn).not.toBeDisabled();

      // Add 3rd weapon field: length 3 === 3 -> (+) disabled
      fireEvent.click(addBtn);
      expect(screen.getAllByRole('combobox')).toHaveLength(3);
      const allAddBtns = screen.getAllByText('+');
      allAddBtns.forEach(btn => {
        expect(btn).toBeDisabled();
      });

      // Attempting to click disabled (+) does not add a 4th field
      fireEvent.click(allAddBtns[0]);
      expect(screen.getAllByRole('combobox')).toHaveLength(3);

      // Remove one field -> length becomes 2 < 3 -> (+) is re-enabled
      const removeBtn = screen.getByTestId('remove-btn-2');
      fireEvent.click(removeBtn);
      expect(screen.getAllByRole('combobox')).toHaveLength(2);
      expect(screen.getAllByText('+')[0]).not.toBeDisabled();
    });
  });
});
