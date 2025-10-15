import { useState } from "react";
import styles from "../styles/Home.module.css";

export default function Template() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [visionDescription, setVisionDescription] = useState("");

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
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
            Share your artistic knowledge by creating a template for other artists to learn from.
          </p>
          <div className={`${styles.formContainer} ${styles.formContainerDark}`}>
            <form className={styles.form}>
              <div className={styles.formField}>
                <label className={`${styles.label} ${styles.labelDark}`}>
                  Template Title
                </label>
                <input
                  type="text"
                  className={`${styles.textInput} ${styles.textInputDark}`}
                  placeholder="Enter template title"
                />
              </div>

              <div className={styles.formField}>
                <label className={`${styles.label} ${styles.labelDark}`}>
                  Artistic Medium
                </label>
                <select className={`${styles.dropdown} ${styles.dropdownDark}`}>
                  <option value="">Select medium</option>
                  <option value="painting">Painting</option>
                  <option value="drawing">Drawing</option>
                  <option value="sculpture">Sculpture</option>
                  <option value="digital">Digital Art</option>
                  <option value="photography">Photography</option>
                  <option value="mixed-media">Mixed Media</option>
                </select>
              </div>


              <div className={styles.formField}>
                <label className={`${styles.label} ${styles.labelDark}`}>
                  Difficulty Level
                </label>
                <select className={`${styles.dropdown} ${styles.dropdownDark}`}>
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
                  className={`${styles.primaryButton} ${styles.primaryButtonDark}`}
                >
                  Create Template
                </button>
                <button
                  type="button"
                  className={`${styles.secondaryButton} ${styles.secondaryButtonDark}`}
                >
                  Save as Draft
                </button>
              </div>
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
