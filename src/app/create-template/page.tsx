'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

function isImageFile(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type);
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [visionDescription, setVisionDescription] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [workMedium, setWorkMedium] = useState("");
  const [workDifficulty, setWorkDifficulty] = useState("");
  const [workDuration, setWorkDuration] = useState("");
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareInGallery, setShareInGallery] = useState(false);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    if (option === 'images') {
      setImageError(null);
    }
  };

  useEffect(() => {
    if (selectedOption === 'images' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [selectedOption]);

  const addImageFiles = (files: FileList | null) => {
    if (!files?.length) return;
    setImageError(null);
    const validFiles: File[] = [];
    const invalidNames: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (isImageFile(file)) {
        validFiles.push(file);
      } else {
        invalidNames.push(file.name);
      }
    }
    if (invalidNames.length > 0) {
      setImageError(`Skipped non-image files: ${invalidNames.join(', ')}. Please upload images only (JPEG, PNG, GIF, WebP, SVG).`);
    }
    setReferenceImages((prev) => [...prev, ...validFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addImageFiles(e.target.files);
    e.target.value = '';
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    addImageFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
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
            public: shareInGallery
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
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.templateForm}>
        <div className={styles.templateFormContent}>
          <div className={styles.formContainer}>
            <p className={`${styles.subheader} beauFont`}>
              What would you like to create today?
            </p>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formFields}>
              <div className={styles.formField}>
                <label className={styles.label}>
                  Template Title
                </label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Enter template title"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.label}>
                  Artistic Medium <span style={{ color: '#fca5a5' }}>*</span>
                </label>
                <select
                  className={styles.dropdown}
                  value={workMedium}
                  onChange={(e) => setWorkMedium(e.target.value)}
                  required
                >
                  <option value="">Select medium</option>
                  <option value="painting">Painting</option>
                  <option value="cross-stitch">Cross-Stitch</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.label}>
                  Difficulty Level <span style={{ color: '#fca5a5' }}>*</span>
                </label>
                <select
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
                <label className={styles.label}>
                  Estimated Duration <span style={{ color: '#fca5a5' }}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g., 2 hours, 1 day, 3 weeks"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(e.target.value)}
                  required
                />
              </div>

              <div className={`${styles.formField} ${styles.formFieldStartOptions} ${selectedOption === 'vision' || selectedOption === 'images' ? styles.formFieldVisionActive : ''}`}>
                <label className={styles.label}>
                  How would you like to start?
                </label>
                <div className={`${styles.startOptions} ${selectedOption === 'vision' || selectedOption === 'images' ? styles.startOptionsExpanded : ''}`}>
                  {selectedOption === 'vision' ? (
                    <div className={styles.imageOptionContainer}>
                      <button
                        type="button"
                        className={styles.backToOptions}
                        onClick={() => setSelectedOption(null)}
                      >
                        ← Back to options
                      </button>
                      <textarea
                        className={styles.visionTextareaFull}
                        placeholder="Describe your artistic vision and what you want to create..."
                        value={visionDescription}
                        onChange={(e) => setVisionDescription(e.target.value)}
                        required
                      />
                    </div>
                  ) : selectedOption === 'images' ? (
                    <div className={styles.imageOptionContainer}>
                      <button
                        type="button"
                        className={styles.backToOptions}
                        onClick={() => setSelectedOption(null)}
                      >
                        ← Back to options
                      </button>
                      <div
                        className={`${styles.imageDropZone} ${isDragOver ? styles.imageDropZoneActive : ''}`}
                        onClick={handleDropZoneClick}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                        multiple
                        className={styles.hiddenFileInput}
                        onChange={handleFileChange}
                      />
                      <span className={styles.dropZoneIcon}>📷</span>
                      <p className={styles.dropZoneText}>
                        {referenceImages.length > 0
                          ? `${referenceImages.length} image${referenceImages.length === 1 ? '' : 's'} selected`
                          : 'Drop images here or click to browse'}
                      </p>
                      {referenceImages.length > 0 && (
                        <div className={styles.imagePreviewList}>
                          {referenceImages.map((file, i) => (
                            <div key={i} className={styles.imagePreviewItem}>
                              <span className={styles.imagePreviewName}>{file.name}</span>
                              <button
                                type="button"
                                className={styles.imagePreviewRemove}
                                onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {imageError && <p className={styles.imageError}>{imageError}</p>}
                    </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={styles.optionCardDisabledWrapper}
                        title="COMING SOON!"
                      >
                      <div
                        className={`${styles.optionCard} ${styles.optionCardDisabled}`}
                      >
                        <div className={styles.optionContent}>
                          <div className={styles.optionHeader}>
                            <span className={styles.optionIcon}>📷</span>
                            <h3 className={styles.optionTitle}>
                              I have reference images
                            </h3>
                          </div>
                          <p className={styles.optionSubtext}>
                            Upload photos, sketches, or artwork to create your template
                          </p>
                        </div>
                      </div>
                      </div>
                      <div
                        className={`${styles.optionCard} ${selectedOption === 'vision' ? styles.optionCardSelected : ''}`}
                        onClick={() => handleOptionSelect('vision')}
                      >
                        <div className={styles.optionContent}>
                          <div className={styles.optionHeader}>
                            <span className={styles.optionIcon}>✨</span>
                            <h3 className={styles.optionTitle}>
                              I&apos;ll describe my vision
                            </h3>
                          </div>
                          <p className={styles.optionSubtext}>
                            Use AI to help generate template ideas from your description
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
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
                <button
                  type="button"
                  className={styles.secondaryButton}
                >
                  Save as Draft
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
