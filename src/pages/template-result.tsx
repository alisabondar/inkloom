import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";

export default function TemplateResult() {
  const router = useRouter();
  const [templateData, setTemplateData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get the template data from localStorage (passed from the form)
    const savedTemplate = localStorage.getItem('generatedTemplate');
    if (savedTemplate) {
      setTemplateData(JSON.parse(savedTemplate));
    }
    setIsLoading(false);
  }, []);

  const handleCreateNew = () => {
    // Clear the saved template data
    localStorage.removeItem('generatedTemplate');
    router.push('/template');
  };

  const handleDownloadImage = () => {
    if (templateData?.image) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${templateData.image}`;
      link.download = `${templateData.title || 'template'}-reference.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={`${styles.templateForm} ${styles.templateFormDark}`}>
          <div className={styles.templateFormContent}>
            <div className={`${styles.loadingContainer} ${styles.loadingContainerDark}`}>
              <div className={styles.loadingSpinner}></div>
              <p className={`${styles.loadingText} ${styles.loadingTextDark}`}>
                Loading your template...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!templateData) {
    return (
      <div className={styles.container}>
        <div className={`${styles.templateForm} ${styles.templateFormDark}`}>
          <div className={styles.templateFormContent}>
            <div className={`${styles.errorContainer} ${styles.errorContainerDark}`}>
              <h2 className={`${styles.errorTitle} ${styles.errorTitleDark}`}>
                No Template Found
              </h2>
              <p className={`${styles.errorText} ${styles.errorTextDark}`}>
                It looks like no template data was found. Please go back and create a new template.
              </p>
              <button
                onClick={handleCreateNew}
                className={`${styles.primaryButton} ${styles.primaryButtonDark}`}
              >
                Create New Template
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={`${styles.header} ${styles.headerDark}`}>
        <div className={styles.headerContent}>
          <h1 className={`${styles.headerTitle} ${styles.headerTitleDark}`}>
            Your Template
          </h1>
        </div>
      </header>

      <main className={`${styles.templateForm} ${styles.templateFormDark}`}>
        <div className={styles.templateFormContent}>
          <div className={`${styles.resultContainer} ${styles.resultContainerDark}`}>
            <div className={styles.resultHeader}>
              <h2 className={`${styles.resultTitle} ${styles.resultTitleDark}`}>
                {templateData.title || 'My Template'}
              </h2>
              <div className={styles.templateMeta}>
                <span className={`${styles.metaTag} ${styles.metaTagDark}`}>
                  {templateData.workMedium}
                </span>
                <span className={`${styles.metaTag} ${styles.metaTagDark}`}>
                  {templateData.workDifficulty}
                </span>
                <span className={`${styles.metaTag} ${styles.metaTagDark}`}>
                  {templateData.workDuration}
                </span>
              </div>
            </div>

            <div className={styles.imageSection}>
              <h3 className={`${styles.sectionTitle} ${styles.sectionTitleDark}`}>
                Generated Reference Image
              </h3>
              {templateData.image && (
                <div className={styles.imageContainer}>
                  <img
                    src={`data:image/png;base64,${templateData.image}`}
                    alt="Generated template reference"
                    className={styles.resultImage}
                  />
                  <button
                    onClick={handleDownloadImage}
                    className={`${styles.downloadButton} ${styles.downloadButtonDark}`}
                  >
                    📥 Download Image
                  </button>
                </div>
              )}
            </div>

            <div className={styles.descriptionSection}>
              <h3 className={`${styles.sectionTitle} ${styles.sectionTitleDark}`}>
                Your Vision
              </h3>
              <p className={`${styles.descriptionText} ${styles.descriptionTextDark}`}>
                {templateData.description}
              </p>
            </div>

            <div className={styles.actionButtons}>
              <button
                onClick={handleCreateNew}
                className={`${styles.primaryButton} ${styles.primaryButtonDark}`}
              >
                Create Another Template
              </button>
              <button
                onClick={() => router.push('/')}
                className={`${styles.secondaryButton} ${styles.secondaryButtonDark}`}
              >
                Back to Home
              </button>
            </div>
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
