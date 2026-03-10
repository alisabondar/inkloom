'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { Template } from "@/lib/supabase";

function TemplateViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [templateData, setTemplateData] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = searchParams.get('id');

    if (!id) {
      setIsLoading(false);
      return;
    }

    const cached = typeof window !== 'undefined' ? sessionStorage.getItem(`template-${id}`) : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Template;
        setTemplateData(parsed);
        sessionStorage.removeItem(`template-${id}`);
      } catch {
        // Fall through to fetch
      }
      setIsLoading(false);
      return;
    }

    const fetchTemplate = async () => {
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

    fetchTemplate();
  }, [searchParams]);

  const handleCreateNew = () => {
    router.push('/create-template');
  };

  const handleDownloadImage = () => {
    if (templateData?.image_url) {
      const currentDate = new Date().toISOString().split('T')[0];
      const templateName = (templateData.title || `Template-${templateData.id}`)
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '');

      const link = document.createElement('a');
      link.href = templateData.image_url;
      link.download = `${currentDate}-${templateName}-reference.png`;
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
              <div className={styles.loadingSpinner} />
              <p className={`${styles.loadingText} ${styles.loadingTextDark}`}>Loading...</p>
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
      <main className={`${styles.templateForm} ${styles.templateFormDark}`}>
        <div className={styles.templateFormContent}>
          <div className={`${styles.resultContainer} ${styles.resultContainerDark}`}>
            <div className={styles.resultHeader}>
              <h2 className={`${styles.resultTitle} ${styles.resultTitleDark}`}>
                {templateData.title || `Template #${templateData.id}`}
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
              <p className={`${styles.descriptionText} ${styles.descriptionTextDark}`}>
                {templateData.source}
              </p>
            </div>

            <div className={styles.imageSection}>
              {templateData.image_url && (
                <div className={styles.imageContainer}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={templateData.image_url}
                    alt="Generated template reference"
                    className={styles.resultImage}
                  />
                </div>
              )}
            </div>

            <div className={styles.actionButtons}>
              <button
                onClick={handleDownloadImage}
                className={`${styles.downloadButton} ${styles.downloadButtonDark}`}
              >
                Download Image <span className={styles.downloadIcon}>📥</span>
              </button>
              <button
                onClick={handleCreateNew}
                className={`${styles.primaryButton} ${styles.primaryButtonDark}`}
              >
                New Template
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const loadingFallback = (
  <div className={styles.container}>
    <div className={`${styles.templateForm} ${styles.templateFormDark}`}>
      <div className={styles.templateFormContent}>
        <div className={`${styles.loadingContainer} ${styles.loadingContainerDark}`}>
          <div className={styles.loadingSpinner} />
          <p className={`${styles.loadingText} ${styles.loadingTextDark}`}>Loading...</p>
        </div>
      </div>
    </div>
  </div>
);

export default function TemplateViewPage() {
  return (
    <Suspense fallback={loadingFallback}>
      <TemplateViewContent />
    </Suspense>
  );
}
