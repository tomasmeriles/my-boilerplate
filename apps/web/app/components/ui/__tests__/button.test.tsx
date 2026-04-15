import { describe, it, expect } from 'vitest';
import { render, screen } from '~/test-utils';
import { Button } from '~/components/ui/button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: 'Click me' }),
    ).toBeInTheDocument();
  });

  it('is disabled when the disabled prop is set', () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('applies variant classes', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toMatch(/destructive/);
  });
});
