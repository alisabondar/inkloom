import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTemplate } from '../CreateTemplate';

const mockPush = vi.fn();
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    query: {},
    isReady: true,
  }),
}));

vi.mock('../../../components/Header', () => ({
  Header: ({ title }: { title: string }) => <header data-testid="header">{title}</header>,
}));

vi.mock('../../../components/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

global.fetch = vi.fn();

describe('CreateTemplate', () => {
  const fillRequiredFields = async (user: ReturnType<typeof userEvent.setup>) => {
    const visionOption = screen.getByText("I'll describe my vision").closest('div');
    fireEvent.click(visionOption!);

    const textarea = screen.getByPlaceholderText(/Describe your artistic vision/i);
    await user.type(textarea, 'Test description');

    fireEvent.change(screen.getByRole('combobox', { name: /Artistic Medium/i }), { target: { value: 'painting' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Difficulty Level/i }), { target: { value: 'beginner' } });
    await user.type(screen.getByPlaceholderText(/2 hours, 1 day, 3 weeks/i), '2 hours');
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
    global.alert = vi.fn();
  });

  describe('Initial Render', () => {
    it('should render all form elements, components, and option cards', () => {
      render(<CreateTemplate />);

      expect(screen.getByText('Create New Template')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter template title')).toBeInTheDocument();
      expect(screen.getByText('Artistic Medium')).toBeInTheDocument();
      expect(screen.getByText('Difficulty Level')).toBeInTheDocument();
      expect(screen.getByText('Estimated Duration')).toBeInTheDocument();

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();

      expect(screen.getByText('I have reference images')).toBeInTheDocument();
      expect(screen.getByText("I'll describe my vision")).toBeInTheDocument();
    });

    it('should have submit button disabled initially', () => {
      render(<CreateTemplate />);

      const submitButton = screen.getByRole('button', { name: 'Create Template' });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Submit Button State', () => {
    it('should keep submit button disabled until all required fields are filled', async () => {
      const user = userEvent.setup();
      render(<CreateTemplate />);

      const submitButton = screen.getByRole('button', { name: 'Create Template' });
      expect(submitButton).toBeDisabled();

      const visionOption = screen.getByText("I'll describe my vision").closest('div');
      fireEvent.click(visionOption!);
      expect(submitButton).toBeDisabled();

      const textarea = screen.getByPlaceholderText(/Describe your artistic vision/i);
      await user.type(textarea, 'A beautiful sunset');
      expect(submitButton).toBeDisabled();

      const mediumSelect = screen.getByRole('combobox', { name: /Artistic Medium/i });
      fireEvent.change(mediumSelect, { target: { value: 'painting' } });
      expect(submitButton).toBeDisabled();

      const difficultySelect = screen.getByRole('combobox', { name: /Difficulty Level/i });
      fireEvent.change(difficultySelect, { target: { value: 'beginner' } });
      expect(submitButton).toBeDisabled();

      const durationInput = screen.getByPlaceholderText(/2 hours, 1 day, 3 weeks/i);
      await user.type(durationInput, '2 hours');
      expect(submitButton).toBeEnabled();
    });

    it('should re-disable button when field is cleared', async () => {
      const user = userEvent.setup();
      render(<CreateTemplate />);

      await fillRequiredFields(user);

      const submitButton = screen.getByRole('button', { name: 'Create Template' });
      expect(submitButton).toBeEnabled();

      const textarea = screen.getByPlaceholderText(/Describe your artistic vision/i);
      await user.clear(textarea);
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Option Selection', () => {
    it('should expand vision option, hide images option, and allow textarea input', async () => {
      const user = userEvent.setup();
      render(<CreateTemplate />);

      const visionOption = screen.getByText("I'll describe my vision").closest('div');
      fireEvent.click(visionOption!);

      const textarea = screen.getByPlaceholderText(/Describe your artistic vision/i);
      expect(textarea).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('I have reference images')).not.toBeInTheDocument();
      });

      await user.type(textarea, 'A beautiful sunset over mountains');
      expect((textarea as HTMLTextAreaElement).value).toBe('A beautiful sunset over mountains');
    });
  });

  describe('Form Validation', () => {
    it('should show alert if vision description is empty', async () => {
      render(<CreateTemplate />);

      const visionOption = screen.getByText("I'll describe my vision").closest('div');
      fireEvent.click(visionOption!);

      const mediumSelect = screen.getByRole('combobox', { name: /Artistic Medium/i });
      const difficultySelect = screen.getByRole('combobox', { name: /Difficulty Level/i });
      const durationInput = screen.getByPlaceholderText(/2 hours, 1 day, 3 weeks/i);
      const submitButton = screen.getByRole('button', { name: 'Create Template' });

      fireEvent.change(mediumSelect, { target: { value: 'painting' } });
      fireEvent.change(difficultySelect, { target: { value: 'beginner' } });
      fireEvent.change(durationInput, { target: { value: '2 hours' } });

      fireEvent.click(submitButton);

      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Please fill in all required fields')
      );
    });
  });

  describe('Form Submission', () => {
    it('should successfully submit form and redirect on success', async () => {
      const user = userEvent.setup();

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            image: 'data:image/png;base64,test',
            image_url: 'https://test.url/image.png',
            generated_image_id: 'img-123',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            template: {
              id: 'template-123',
              title: 'Test Template',
            },
          }),
        });

      render(<CreateTemplate />);

      const titleInput = screen.getByPlaceholderText('Enter template title');
      await user.type(titleInput, 'Test Template');

      await fillRequiredFields(user);

      const submitButton = screen.getByRole('button', { name: 'Create Template' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/template-result?id=template-123');
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    image: 'test',
                    image_url: 'test.url',
                    generated_image_id: 'img-123',
                  }),
                }),
              100
            )
          )
      );

      render(<CreateTemplate />);

      await fillRequiredFields(user);

      const submitButton = screen.getByRole('button', { name: 'Create Template' });
      fireEvent.click(submitButton);

      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should handle generate API error', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'OpenAI API error',
        }),
      });

      render(<CreateTemplate />);

      await fillRequiredFields(user);

      const submitButton = screen.getByRole('button', { name: 'Create Template' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('OpenAI API error')).toBeInTheDocument();
      });
    });

    it('should handle save template API error', async () => {
      const user = userEvent.setup();

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            image: 'data:image/png;base64,test',
            image_url: 'https://test.url',
            generated_image_id: 'img-123',
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: 'Database error',
          }),
        });

      render(<CreateTemplate />);

      await fillRequiredFields(user);

      const submitButton = screen.getByRole('button', { name: 'Create Template' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Database error')).toBeInTheDocument();
      });
    });

    it('should call generate-template API with correct data', async () => {
      const user = userEvent.setup();

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            image: 'test',
            image_url: 'test.url',
            generated_image_id: 'img-123',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            template: { id: '123' },
          }),
        });

      render(<CreateTemplate />);

      const visionOption = screen.getByText("I'll describe my vision").closest('div');
      fireEvent.click(visionOption!);

      const titleInput = screen.getByPlaceholderText('Enter template title');
      await user.type(titleInput, 'Sunset Painting');

      const textarea = screen.getByPlaceholderText(/Describe your artistic vision/i);
      await user.type(textarea, 'Beautiful sunset');

      const mediumSelect = screen.getByRole('combobox', { name: /Artistic Medium/i });
      const difficultySelect = screen.getByRole('combobox', { name: /Difficulty Level/i });
      const durationInput = screen.getByPlaceholderText(/2 hours, 1 day, 3 weeks/i);

      fireEvent.change(mediumSelect, { target: { value: 'painting' } });
      fireEvent.change(difficultySelect, { target: { value: 'intermediate' } });
      fireEvent.change(durationInput, { target: { value: '3 hours' } });

      const submitButton = screen.getByRole('button', { name: 'Create Template' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/generate-template',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: 'Beautiful sunset',
              title: 'Sunset Painting',
              workMedium: 'painting',
              workDifficulty: 'intermediate',
              workDuration: '3 hours',
            }),
          })
        );
      });
    });
  });

  describe('Draft Button', () => {
    it('should render Save as Draft button', () => {
      render(<CreateTemplate />);

      expect(screen.getByRole('button', { name: 'Save as Draft' })).toBeInTheDocument();
    });

    it('should not submit form when Save as Draft is clicked', () => {
      render(<CreateTemplate />);

      const draftButton = screen.getByRole('button', { name: 'Save as Draft' });
      fireEvent.click(draftButton);

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
