import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";

export default function TemplateResult() {
  const router = useRouter();
  const [templateData, setTemplateData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      const { id } = router.query;

      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/get-template?id=${id}`);
        const data = await response.json();

        if (data.success && data.template) {
          setTemplateData(data.template);
        } else {
          console.error('Failed to load template:', data.error);
        }
      } catch (error) {
        console.error('Error loading template:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (router.isReady) {
      fetchTemplate();
    }
  }, [router.isReady, router.query]);

  const handleCreateNew = () => {
    router.push('/template');
  };

  const handleDownloadImage = () => {
    if (templateData?.image_url) {
      const link = document.createElement('a');
      link.href = templateData.image_url;
      link.download = `${templateData.title || templateData.medium || 'template'}-reference.png`;
      link.target = '_blank';
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
                  {templateData.medium}
                </span>
                <span className={`${styles.metaTag} ${styles.metaTagDark}`}>
                  {templateData.difficulty}
                </span>
                <span className={`${styles.metaTag} ${styles.metaTagDark}`}>
                  {templateData.duration}
                </span>
              </div>
            </div>

            <div className={styles.imageSection}>
              <h3 className={`${styles.sectionTitle} ${styles.sectionTitleDark}`}>
                Generated Reference Image
              </h3>
              {templateData.image_url && (
                <div className={styles.imageContainer}>
                  <img
                    src={templateData.image_url}
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
                {templateData.source}
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
