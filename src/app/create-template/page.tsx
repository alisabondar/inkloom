'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.css";

export default function CreateTemplatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<string>('vision');
  const [visionDescription, setVisionDescription] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [workMedium, setWorkMedium] = useState("");
  const [workDifficulty, setWorkDifficulty] = useState("");
  const [workDuration, setWorkDuration] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareInGallery, setShareInGallery] = useState(false);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const isFormValid =
    selectedOption === 'vision' &&
    visionDescription.trim() !== '' &&
    workMedium !== '' &&
    workDifficulty !== '' &&
    workDuration.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedOption !== 'vision') {
      alert('Please select "I\'ll describe my vision" to create a template with AI.');
      return;
    }

    if (!visionDescription.trim() || !workMedium || !workDifficulty || !workDuration.trim()) {
      alert('Please fill in all required fields: Vision Description, Artistic Medium, Difficulty Level, and Estimated Duration.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: visionDescription,
          title: templateTitle,
          workMedium,
          workDifficulty,
          workDuration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate template');
      }

      if (data.success && data.image) {
        const saveResponse = await fetch('/api/save-template', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: templateTitle,
            medium: workMedium,
            difficulty: workDifficulty,
            duration: workDuration,
            generated_image_id: data.generated_image_id,
            image_url: data.image_url,
            source: visionDescription,
            public: shareInGallery,
            user_id: user?.id
          }),
        });

        const saveData = await saveResponse.json();

        if (!saveResponse.ok) {
          throw new Error(saveData.error || 'Failed to save template');
        }

        if (saveData.success && saveData.template) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`template-${saveData.template.id}`, JSON.stringify(saveData.template));
          }
          router.push(`/template-view?id=${saveData.template.id}`);
          return;
        } else {
          throw new Error('Failed to save template to database');
        }
      } else {
        throw new Error('No image generated');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
      alert(`Error: ${msg}`);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Generating your template...</p>
          <p className={styles.loadingSubtext}>This can take a moment while the image model draws your reference.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.templateForm}>
        <div className={styles.templateFormContent}>
            <div className={styles.formContainer}>
              <div className={styles.formHeader}>
              <p className={styles.subheader}>
                Describe your idea and choose a few project details.
              </p>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formFields}>
              <div className={styles.formField}>
                <label className={styles.label} htmlFor="template-title">
                  Template Title
                </label>
                <input
                  id="template-title"
                  type="text"
                  className={styles.textInput}
                  placeholder="Moonlit Garden Arch"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="work-medium">
                  Artistic Medium <span className={styles.required}>*</span>
                </label>
                <select
                  id="work-medium"
                  className={styles.dropdown}
                  value={workMedium}
                  onChange={(e) => setWorkMedium(e.target.value)}
                  required
                >
                  <option value="">Select medium</option>
                  <option value="painting">Painting</option>
                  <option value="cross-stitch">Cross-Stitch</option>
                  <option value="embroidery">Embroidery</option>
                  <option value="watercolor">Watercolor</option>
                  <option value="ink">Ink</option>
                  <option value="digital-art">Digital Art</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="work-difficulty">
                  Difficulty Level <span className={styles.required}>*</span>
                </label>
                <select
                  id="work-difficulty"
                  className={styles.dropdown}
                  value={workDifficulty}
                  onChange={(e) => setWorkDifficulty(e.target.value)}
                  required
                >
                  <option value="">Select difficulty</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="work-duration">
                  Estimated Duration <span className={styles.required}>*</span>
                </label>
                <input
                  id="work-duration"
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g., 2 hours, 1 day, 3 weeks"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(e.target.value)}
                  required
                />
              </div>

              <div className={`${styles.formField} ${styles.formFieldStartOptions}`}>
                <label className={styles.label}>
                  How would you like to start?
                </label>
                <div className={styles.startOptions}>
                      <button
                        type="button"
                        className={`${styles.optionCard} ${selectedOption === 'vision' ? styles.optionCardSelected : ''}`}
                        onClick={() => handleOptionSelect('vision')}
                        aria-pressed={selectedOption === 'vision'}
                      >
                        <div className={styles.optionContent}>
                          <div className={styles.optionHeader}>
                            <h3 className={styles.optionTitle}>
                              Describe my vision
                            </h3>
                          </div>
                          <p className={styles.optionSubtext}>
                            Generate a template from your written idea.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        className={`${styles.optionCard} ${styles.optionCardDisabled}`}
                        disabled
                        title="Image-to-image support is planned for V2."
                      >
                        <div className={styles.optionContent}>
                          <div className={styles.optionHeader}>
                            <h3 className={styles.optionTitle}>
                              Upload reference images
                            </h3>
                            <span className={styles.comingSoon}>V2</span>
                          </div>
                          <p className={styles.optionSubtext}>
                            Planned next: attach photos, sketches, or artwork.
                          </p>
                        </div>
                      </button>
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="vision-description">
                  Vision Description <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="vision-description"
                  className={styles.visionTextareaFull}
                  placeholder="Describe the composition, subject, mood, and any constraints. Example: a cozy bookshelf with trailing plants and a small sleeping cat, beginner-friendly, clean outlines."
                  value={visionDescription}
                  onChange={(e) => setVisionDescription(e.target.value)}
                  required
                />
              </div>
              </div>

              <div className={styles.checkboxField}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={shareInGallery}
                    onChange={(e) => setShareInGallery(e.target.checked)}
                    className={styles.checkbox}
                  />
                  Share this template within the public gallery?
                </label>
              </div>

              <div className={styles.buttonContainer}>
                <button
                  type="submit"
                  className={`${styles.primaryButton} ${isLoading ? styles.buttonLoading : ''}`}
                  disabled={isLoading || !isFormValid}
                >
                  {isLoading ? 'Generating...' : 'Create Template'}
                </button>
              </div>

              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
