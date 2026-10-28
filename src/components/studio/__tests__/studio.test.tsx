import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { PencilSlider, Chip, LayerCard, PaintTin, Button, Tape } from '@/components/studio';

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
});
