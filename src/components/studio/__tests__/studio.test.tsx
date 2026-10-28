import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { PencilSlider, Chip, LayerCard, PaintTin, Button, Tape, Stepper, SnapSlider, nearestStop } from '@/components/studio';

describe('studio components', () => {
  it('PencilSlider renders a labelled range and calls onChange', () => {
    const onChange = vi.fn();
    render(<PencilSlider label="Detail" valueLabel="medium" min={0} max={10} value={4} onChange={onChange} />);
    const input = screen.getByLabelText('Detail');
    expect(input).toHaveAttribute('type', 'range');
    fireEvent.change(input, { target: { value: '7' } });
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it('Chip toggles aria-pressed', () => {
    function Harness() {
      const [on, setOn] = useState(false);
      return <Chip active={on} onClick={() => setOn(!on)}>Ink</Chip>;
    }
    render(<Harness />);
    const chip = screen.getByRole('button', { name: 'Ink' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('LayerCard calls onToggle and reflects aria-pressed', () => {
    const onToggle = vi.fn();
    const { rerender } = render(<LayerCard label="Line art" active={false} onToggle={onToggle} />);
    const btn = screen.getByRole('button', { name: /Line art/ });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
    rerender(<LayerCard label="Line art" active onToggle={onToggle} />);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('PaintTin renders named pan buttons', () => {
    const onSelect = vi.fn();
    render(<PaintTin label="12 pans" colors={[{ hex: '#ff0000', name: 'Cadmium red' }, { hex: '#0000ff', name: 'Ultramarine' }]} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ultramarine' }));
    expect(screen.getByRole('button', { name: 'Cadmium red' })).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledWith('#0000ff');
  });

  it('Button renders a link when href given', () => {
    render(<Button href="/create">Start</Button>);
    expect(screen.getByRole('link', { name: 'Start' })).toHaveAttribute('href', '/create');
  });

  it('Tape can be tinted and made small', () => {
    const { container } = render(<Tape color="#e7b45c" size="sm" />);
    const tape = container.querySelector('span')!;
    expect(tape.style.getPropertyValue('--studio-tape-color')).toBe('#e7b45c');
    expect(tape.className).toMatch(/tapeSm/);
  });

  it('Stepper moves through its options, stops at the ends, and supports arrow keys', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Stepper label="Grid" options={[0, 2, 4]} value={0} onChange={onChange} format={(v) => (v ? `${v}×${v}` : 'Off')} />);
    expect(screen.getByRole('group', { name: 'Grid' })).toHaveTextContent('Off');
    expect(screen.getByRole('button', { name: 'Decrease grid' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Increase grid' }));
    expect(onChange).toHaveBeenLastCalledWith(2);

    rerender(<Stepper label="Grid" options={[0, 2, 4]} value={4} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Increase grid' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('group', { name: 'Grid' }), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it('SnapSlider reports stop values and shows the nearest stop for in-between values', () => {
    const stops = [{ value: 0.2, label: 'Few' }, { value: 0.5, label: 'Some' }, { value: 0.9, label: 'Many' }];
    expect(nearestStop(stops, 0.62)).toBe(1);
    const onChange = vi.fn();
    render(<SnapSlider label="Line detail" stops={stops} value={0.62} onChange={onChange} />);
    const input = screen.getByLabelText('Line detail');
    expect(input).toHaveAttribute('aria-valuetext', 'Some');
    fireEvent.change(input, { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith(0.9);
  });
});
