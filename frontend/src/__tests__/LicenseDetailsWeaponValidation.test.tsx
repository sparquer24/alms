import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Select } from '../components/forms/elements/Select';
import { validateField, processFieldChange, processFieldBlur, validateForm } from '../utils/validation/engine';
import { FieldRule } from '../utils/validation/types';

describe('Weapon Selection Validation in License Details', () => {
  const weaponRule: FieldRule = {
    name: 'weaponSelection',
    type: 'custom',
    required: true,
    errorMessages: { required: 'Select weapon types is required.' },
    customValidator: (_, form) => {
      const d = form.licenseDetails?.[0];
      return (d?.requestedWeaponIds?.length > 0) ? '' : 'Select weapon types is required.';
    },
  };

  const rules: FieldRule[] = [weaponRule];

  describe('Validation Engine Rules', () => {
    test('returns required error when no weapons are selected', () => {
      const form = {
        licenseDetails: [{ requestedWeaponIds: [] }],
      };
      const error = validateField(weaponRule, '', form);
      expect(error).toBe('Select weapon types is required.');
    });

    test('returns required error when licenseDetails or requestedWeaponIds is undefined', () => {
      const form = {};
      const error = validateField(weaponRule, '', form);
      expect(error).toBe('Select weapon types is required.');
    });

    test('clears error immediately when at least one weapon is selected', () => {
      const form = {
        licenseDetails: [{ requestedWeaponIds: [1] }],
      };
      const result = processFieldChange(rules, 'weaponSelection', '', form);
      expect(result.error).toBe('');
    });

    test('handles multiple weapons correctly and remains valid', () => {
      const form = {
        licenseDetails: [{ requestedWeaponIds: [1, 2, 3] }],
      };
      const result = processFieldChange(rules, 'weaponSelection', '', form);
      expect(result.error).toBe('');

      const blurResult = processFieldBlur(rules, 'weaponSelection', '', form);
      expect(blurResult.error).toBe('');

      const formErrors = validateForm(rules, form);
      expect(formErrors.weaponSelection).toBeUndefined();
    });

    test('maintains proper validation when removing weapons down to none', () => {
      // 2 weapons -> valid
      const formWithTwo = {
        licenseDetails: [{ requestedWeaponIds: [1, 2] }],
      };
      expect(processFieldChange(rules, 'weaponSelection', '', formWithTwo).error).toBe('');

      // 1 weapon remaining -> valid
      const formWithOne = {
        licenseDetails: [{ requestedWeaponIds: [2] }],
      };
      expect(processFieldChange(rules, 'weaponSelection', '', formWithOne).error).toBe('');

      // 0 weapons remaining -> displays required-field error
      const formWithNone = {
        licenseDetails: [{ requestedWeaponIds: [] }],
      };
      expect(processFieldChange(rules, 'weaponSelection', '', formWithNone).error).toBe('Select weapon types is required.');
    });

    test('validateForm flags weaponSelection only when no weapon is selected', () => {
      const invalidForm = {
        licenseDetails: [{ requestedWeaponIds: [] }],
      };
      expect(validateForm(rules, invalidForm)).toEqual({
        weaponSelection: 'Select weapon types is required.',
      });

      const validForm = {
        licenseDetails: [{ requestedWeaponIds: [5] }],
      };
      expect(validateForm(rules, validForm)).toEqual({});
    });
  });

  describe('Select Component Error Rendering', () => {
    const mockOnChange = jest.fn();
    const mockOnBlur = jest.fn();
    const sampleOptions = [
      { value: '1', label: 'Rifle' },
      { value: '2', label: 'Pistol' },
    ];

    test('does not show required error on blur when required is false and error is empty', () => {
      render(
        <Select
          name="weaponSelection"
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          placeholder="Select weapon type to add"
          options={sampleOptions}
          error=""
        />
      );

      const selectElement = screen.getByRole('combobox');
      fireEvent.blur(selectElement);

      expect(mockOnBlur).toHaveBeenCalled();
      expect(screen.queryByText('Select weapon types is required.')).not.toBeInTheDocument();
    });

    test('displays external error when error prop is provided', () => {
      const { rerender } = render(
        <Select
          name="weaponSelection"
          value=""
          onChange={mockOnChange}
          placeholder="Select weapon type to add"
          options={sampleOptions}
          error="Select weapon types is required."
        />
      );

      expect(screen.getByText('Select weapon types is required.')).toBeInTheDocument();

      // When weapon is selected and parent clears error (error="")
      rerender(
        <Select
          name="weaponSelection"
          value=""
          onChange={mockOnChange}
          placeholder="Select weapon type to add"
          options={sampleOptions}
          error=""
        />
      );

      expect(screen.queryByText('Select weapon types is required.')).not.toBeInTheDocument();
    });

    test('error prop takes precedence over localError when error is empty string', () => {
      // Simulates a component where required is set or touched occurred,
      // but parent explicitly supplies error=""
      render(
        <Select
          name="weaponSelection"
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          placeholder="Select weapon type to add"
          options={sampleOptions}
          error=""
        />
      );

      const selectElement = screen.getByRole('combobox');
      fireEvent.blur(selectElement);

      // Even after blur, because error="" was passed, displayError is ""
      expect(screen.queryByText('Select weapon types is required.')).not.toBeInTheDocument();
    });
  });
});
