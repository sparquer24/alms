import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Select } from '../components/forms/elements/Select';

describe('License History - Weapons Endorsed Placeholder', () => {
  const sampleWeapons = [
    { value: '1', label: 'Pistol' },
    { value: '2', label: 'Rifle' },
    { value: '3', label: 'Revolver' },
  ];

  test('displays "Select the Endorsed Weapon" placeholder by default when weaponId is 0', () => {
    const mockOnChange = jest.fn();
    const weaponId = 0;

    render(
      <Select
        label="Weapon 1"
        name="weapon-0"
        value={weaponId && weaponId !== 0 ? String(weaponId) : ''}
        onChange={mockOnChange}
        options={sampleWeapons}
        placeholder="Select the Endorsed Weapon"
      />
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('');
    // The placeholder option is rendered and selected by default
    const placeholderOption = screen.getByText('Select the Endorsed Weapon') as HTMLOptionElement;
    expect(placeholderOption).toBeInTheDocument();
    expect(placeholderOption.selected).toBe(true);

    // No weapon option is automatically selected
    sampleWeapons.forEach(w => {
      const option = screen.getByText(w.label) as HTMLOptionElement;
      expect(option.selected).toBe(false);
    });
  });

  test('applies "Select the Endorsed Weapon" consistently across dynamically added weapons (Weapon 1, 2, 3)', () => {
    const mockOnChange = jest.fn();
    const weaponsState = [0, 0, 0]; // Simulates 3 weapon slots added dynamically

    const { container } = render(
      <div>
        {weaponsState.map((weaponId, widx) => (
          <Select
            key={widx}
            label={`Weapon ${widx + 1}`}
            name={`weapon-${widx}`}
            value={weaponId && weaponId !== 0 ? String(weaponId) : ''}
            onChange={mockOnChange}
            options={sampleWeapons}
            placeholder="Select the Endorsed Weapon"
          />
        ))}
      </div>
    );

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(selects).toHaveLength(3);

    selects.forEach((select, index) => {
      expect(select.value).toBe('');
      const options = select.querySelectorAll('option');
      // The first option should be the placeholder
      expect(options[0].textContent).toBe('Select the Endorsed Weapon');
      expect(options[0].selected).toBe(true);

      // Verify no weapon is selected by default
      sampleWeapons.forEach((_, optIndex) => {
        expect(options[optIndex + 1].selected).toBe(false);
      });
    });
  });

  test('updates value and displays selected weapon once chosen', () => {
    let currentWeaponId = 0;
    const mockOnChange = jest.fn((e) => {
      currentWeaponId = parseInt(e.target.value);
    });

    const { rerender } = render(
      <Select
        label="Weapon 1"
        name="weapon-0"
        value={currentWeaponId && currentWeaponId !== 0 ? String(currentWeaponId) : ''}
        onChange={mockOnChange}
        options={sampleWeapons}
        placeholder="Select the Endorsed Weapon"
      />
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('');

    // User chooses 'Pistol' (id: '1')
    fireEvent.change(select, { target: { value: '1' } });
    expect(mockOnChange).toHaveBeenCalled();

    // Rerender with updated value
    rerender(
      <Select
        label="Weapon 1"
        name="weapon-0"
        value={currentWeaponId && currentWeaponId !== 0 ? String(currentWeaponId) : ''}
        onChange={mockOnChange}
        options={sampleWeapons}
        placeholder="Select the Endorsed Weapon"
      />
    );

    expect(select.value).toBe('1');
    const pistolOption = screen.getByText('Pistol') as HTMLOptionElement;
    expect(pistolOption.selected).toBe(true);
  });
});
