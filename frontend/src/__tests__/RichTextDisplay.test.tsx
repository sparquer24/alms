import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RichTextDisplay } from '../components/RichTextDisplay';

describe('RichTextDisplay', () => {
  it('keeps the editor formatting', () => {
    const { container } = render(
      <RichTextDisplay content='<p>Forwarded to <strong>CP</strong></p><table><tbody><tr><td>FIR 12</td></tr></tbody></table>' />
    );
    expect(container.querySelector('strong')).toHaveTextContent('CP');
    expect(container.querySelector('td')).toHaveTextContent('FIR 12');
  });

  it('drops scripts and event handlers from stored remarks', () => {
    const { container } = render(
      <RichTextDisplay content={'<p>ok</p><script>window.hacked = 1</script><img src="x" onerror="window.hacked = 1"><a href="javascript:alert(1)">link</a>'} />
    );
    const html = container.innerHTML;
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('javascript:');
    expect(container).toHaveTextContent('ok');
  });

  it('shows a placeholder for empty remarks', () => {
    const { getByText } = render(<RichTextDisplay content='   ' />);
    expect(getByText('No content to display')).toBeInTheDocument();
  });
});
