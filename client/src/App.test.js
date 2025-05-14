import { render, screen } from '@testing-library/react';
import App from './App';


// dummy tests
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/S'inscrire/i);
  expect(linkElement).toBeInTheDocument();
});
