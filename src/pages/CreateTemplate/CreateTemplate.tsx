import { useState } from "react";
import { useRouter } from "next/router";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import S from "./CreateTemplate.module.css";

export const CreateTemplate = () => {
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
        // Save template data to Supabase database
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
            source: visionDescription
          }),
        });

        const saveData = await saveResponse.json();

        if (!saveResponse.ok) {
          throw new Error(saveData.error || 'Failed to save template');
        }

        if (saveData.success && saveData.template) {
          // Redirect to result page with template ID
          router.push(`/TemplateView?id=${saveData.template.id}`);
        } else {
          throw new Error('Failed to save template to database');
        }
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
    <div className={S.container}>
      <Header title="Template Form" />

      <main className={`${S.templateForm} ${S.templateFormDark}`}>
        <div className={S.templateFormContent}>
          <h2 className={`${S.templateFormTitle} ${S.templateFormTitleDark}`}>
            Create New Template
          </h2>
          <p className={`${S.subheader} ${S.subheaderDark}`}>
            What would you like to create today?
          </p>
          <div className={`${S.formContainer} ${S.formContainerDark}`}>
            <form className={S.form} onSubmit={handleSubmit}>
              <div className={S.formField}>
                <label className={`${S.label} ${S.labelDark}`}>
                  Template Title
                </label>
                <input
                  type="text"
                  className={`${S.textInput} ${S.textInputDark}`}
                  placeholder="Enter template title"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                />
              </div>

              <div className={S.formField}>
                <label className={`${S.label} ${S.labelDark}`}>
                  Artistic Medium <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  className={`${S.dropdown} ${S.dropdownDark}`}
                  value={workMedium}
                  onChange={(e) => setWorkMedium(e.target.value)}
                  required
                >
                  <option value="">Select medium</option>
                  {/* dall-e */}
                  <option value="painting">Painting</option>
                  {/* pixelate */}
                  <option value="cross-stitch">Cross-Stitch</option>
                  {/* 3D options? */}
                  {/* <option value="embroidery">Embroidery</option> */}
                  {/* <option value="mixed-media">Mixed Media</option> */}
                </select>
              </div>

              <div className={S.formField}>
                <label className={`${S.label} ${S.labelDark}`}>
                  Difficulty Level <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  className={`${S.dropdown} ${S.dropdownDark}`}
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

              <div className={S.formField}>
                <label className={`${S.label} ${S.labelDark}`}>
                  Estimated Duration <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`${S.textInput} ${S.textInputDark}`}
                  placeholder="e.g., 2 hours, 1 day, 3 weeks"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(e.target.value)}
                  required
                />
              </div>

              <div className={S.formField}>
                <label className={`${S.label} ${S.labelDark}`}>
                  How would you like to start?
                </label>
                <div className={S.startOptions}>
                  {selectedOption !== 'vision' && (
                    <div
                      className={`${S.optionCard} ${S.optionCardDark} ${selectedOption === 'images' ? S.optionCardSelected : ''}`}
                      onClick={() => handleOptionSelect('images')}
                    >
                      <div className={S.optionIcon}>📷</div>
                      <div className={S.optionContent}>
                        <h3 className={`${S.optionTitle} ${S.optionTitleDark}`}>
                          I have reference images
                        </h3>
                        <p className={`${S.optionSubtext} ${S.optionSubtextDark}`}>
                          Upload photos, sketches, or artwork to create your template
                        </p>
                      </div>
                    </div>
                  )}
                  <div
                    className={`${S.optionCard} ${S.optionCardDark} ${selectedOption === 'vision' ? S.optionCardExpanded : ''} ${selectedOption === 'vision' ? S.optionCardSelected : ''}`}
                    onClick={() => handleOptionSelect('vision')}
                  >
                    <div className={S.optionIcon}>✨</div>
                    <div className={S.optionContent}>
                      <h3 className={`${S.optionTitle} ${S.optionTitleDark}`}>
                        I&apos;ll describe my vision
                      </h3>
                      <p className={`${S.optionSubtext} ${S.optionSubtextDark}`}>
                        Use AI to help generate template ideas from your description
                      </p>
                      {selectedOption === 'vision' && (
                        <div className={S.visionInputContainer}>
                          <textarea
                            className={`${S.visionTextarea} ${S.visionTextareaDark}`}
                            rows={6}
                            placeholder="Describe your artistic vision and what you want to create..."
                            value={visionDescription}
                            onChange={(e) => setVisionDescription(e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={S.buttonContainer}>
                <button
                  type="submit"
                  className={`${S.primaryButton} ${S.primaryButtonDark} ${isLoading ? S.buttonLoading : ''}`}
                  disabled={isLoading || !isFormValid}
                >
                  {isLoading ? 'Generating...' : 'Create Template'}
                </button>
                <button
                  type="button"
                  className={`${S.secondaryButton} ${S.secondaryButtonDark}`}
                >
                  Save as Draft
                </button>
              </div>

              {error && (
                <div className={`${S.errorMessage} ${S.errorMessageDark}`}>
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
