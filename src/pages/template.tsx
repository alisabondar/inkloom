import { useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";

export default function Template() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [visionDescription, setVisionDescription] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [workMedium, setWorkMedium] = useState("");
  const [workDifficulty, setWorkDifficulty] = useState("");
  const [workDuration, setWorkDuration] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedOption !== 'vision' || !visionDescription.trim()) {
      alert('Please select "I\'ll describe my vision" and provide a description to create a template with AI.');
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
        // Save template data to localStorage and redirect to result page
        // REPLACE WITH DB SAVE
        const templateData = {
          title: templateTitle,
          workMedium,
          workDifficulty,
          workDuration,
          description: visionDescription,
          image: data.image,
          prompt: data.prompt
        };

        localStorage.setItem('generatedTemplate', JSON.stringify(templateData));
        router.push('/template-result');
      } else {
        throw new Error('No image generated');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      alert(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className={styles.container}>
      <header className={`${styles.header} ${styles.headerDark}`}>
        <div className={styles.headerContent}>
          <h1 className={`${styles.headerTitle} ${styles.headerTitleDark}`}>
            Template Form
          </h1>
        </div>
      </header>

      <main className={`${styles.templateForm} ${styles.templateFormDark}`}>
        <div className={styles.templateFormContent}>
          <h2 className={`${styles.templateFormTitle} ${styles.templateFormTitleDark}`}>
            Create New Template
          </h2>
          <p className={`${styles.subheader} ${styles.subheaderDark}`}>
            What would you like to create today?
          </p>
          <div className={`${styles.formContainer} ${styles.formContainerDark}`}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formField}>
                <label className={`${styles.label} ${styles.labelDark}`}>
                  Template Title
                </label>
                <input
                  type="text"
                  className={`${styles.textInput} ${styles.textInputDark}`}
                  placeholder="Enter template title"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                />
              </div>

              <div className={styles.formField}>
                <label className={`${styles.label} ${styles.labelDark}`}>
                  Artistic Medium
                </label>
                <select
                  className={`${styles.dropdown} ${styles.dropdownDark}`}
                  value={workMedium}
                  onChange={(e) => setWorkMedium(e.target.value)}
                >
                  <option value="">Select medium</option>
                  {/* dall-e */}
                  <option value="painting">Painting</option>
                  {/* pixelate */}
                  <option value="cross-stitch">Sculpture</option>
                  {/* 3D options? */}
                  {/* <option value="embroidery">Photography</option> */}
                  {/* <option value="mixed-media">Mixed Media</option> */}
                </select>
              </div>

              <div className={styles.formField}>
                <label className={`${styles.label} ${styles.labelDark}`}>
                  Difficulty Level
                </label>
                <select
                  className={`${styles.dropdown} ${styles.dropdownDark}`}
                  value={workDifficulty}
                  onChange={(e) => setWorkDifficulty(e.target.value)}
                >
                  <option value="">Select difficulty</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={`${styles.label} ${styles.labelDark}`}>
                  Estimated Duration
                </label>
                <input
                  type="text"
                  className={`${styles.textInput} ${styles.textInputDark}`}
                  placeholder="e.g., 2 hours, 1 day, 3 weeks"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(e.target.value)}
                />
              </div>

              <div className={styles.formField}>
                <label className={`${styles.label} ${styles.labelDark}`}>
                  How would you like to start?
                </label>
                <div className={styles.startOptions}>
                  {selectedOption !== 'vision' && (
                    <div
                      className={`${styles.optionCard} ${styles.optionCardDark} ${selectedOption === 'images' ? styles.optionCardSelected : ''}`}
                      onClick={() => handleOptionSelect('images')}
                    >
                      <div className={styles.optionIcon}>📷</div>
                      <div className={styles.optionContent}>
                        <h3 className={`${styles.optionTitle} ${styles.optionTitleDark}`}>
                          I have reference images
                        </h3>
                        <p className={`${styles.optionSubtext} ${styles.optionSubtextDark}`}>
                          Upload photos, sketches, or artwork to create your template
                        </p>
                      </div>
                    </div>
                  )}
                  <div
                    className={`${styles.optionCard} ${styles.optionCardDark} ${selectedOption === 'vision' ? styles.optionCardExpanded : ''} ${selectedOption === 'vision' ? styles.optionCardSelected : ''}`}
                    onClick={() => handleOptionSelect('vision')}
                  >
                    <div className={styles.optionIcon}>✨</div>
                    <div className={styles.optionContent}>
                      <h3 className={`${styles.optionTitle} ${styles.optionTitleDark}`}>
                        I&apos;ll describe my vision
                      </h3>
                      <p className={`${styles.optionSubtext} ${styles.optionSubtextDark}`}>
                        Use AI to help generate template ideas from your description
                      </p>
                      {selectedOption === 'vision' && (
                        <div className={styles.visionInputContainer}>
                          <textarea
                            className={`${styles.visionTextarea} ${styles.visionTextareaDark}`}
                            rows={6}
                            placeholder="Describe your artistic vision and what you want to create..."
                            value={visionDescription}
                            onChange={(e) => setVisionDescription(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.buttonContainer}>
                <button
                  type="submit"
                  className={`${styles.primaryButton} ${styles.primaryButtonDark} ${isLoading ? styles.buttonLoading : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Generating...' : 'Create Template'}
                </button>
                <button
                  type="button"
                  className={`${styles.secondaryButton} ${styles.secondaryButtonDark}`}
                >
                  Save as Draft
                </button>
              </div>

              {error && (
                <div className={`${styles.errorMessage} ${styles.errorMessageDark}`}>
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </main>

      <footer className={`${styles.footer} ${styles.footerDark}`}>
        <div className={styles.footerContent}>
          <p className={`${styles.footerText} ${styles.footerTextDark}`}>
            © 2024 Your Company. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
