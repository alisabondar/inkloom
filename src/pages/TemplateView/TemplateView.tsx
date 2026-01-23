import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import S from "./TemplateView.module.css";
import { Template } from "@/lib/supabase";

export const TemplateView = () => {
  const router = useRouter();
  const [templateData, setTemplateData] = useState<Template | null>(null);
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
    router.push('/CreateTemplate');
  };

  const handleDownloadImage = () => {
    if (templateData?.image_url) {
      const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const templateName = (templateData.title || 'Untitled-Template')
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-zA-Z0-9-]/g, ''); // Remove special characters

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
      <div className={S.container}>
        <div className={`${S.templateForm} ${S.templateFormDark}`}>
          <div className={S.templateFormContent}>
            <div className={`${S.loadingContainer} ${S.loadingContainerDark}`}>
              <div className={S.loadingSpinner}></div>
              <p className={`${S.loadingText} ${S.loadingTextDark}`}>
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
      <div className={S.container}>
        <div className={`${S.templateForm} ${S.templateFormDark}`}>
          <div className={S.templateFormContent}>
            <div className={`${S.errorContainer} ${S.errorContainerDark}`}>
              <h2 className={`${S.errorTitle} ${S.errorTitleDark}`}>
                No Template Found
              </h2>
              <p className={`${S.errorText} ${S.errorTextDark}`}>
                It looks like no template data was found. Please go back and create a new template.
              </p>
              <button
                onClick={handleCreateNew}
                className={`${S.primaryButton} ${S.primaryButtonDark}`}
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
    <div className={S.container}>
      <Header title="Your Template" />

      <main className={`${S.templateForm} ${S.templateFormDark}`}>
        <div className={S.templateFormContent}>
          <div className={`${S.resultContainer} ${S.resultContainerDark}`}>
            <div className={S.resultHeader}>
              <h2 className={`${S.resultTitle} ${S.resultTitleDark}`}>
                {templateData.title || 'My Template'}
              </h2>
              <div className={S.templateMeta}>
                <span className={`${S.metaTag} ${S.metaTagDark}`}>
                  {templateData.medium}
                </span>
                <span className={`${S.metaTag} ${S.metaTagDark}`}>
                  {templateData.difficulty}
                </span>
                <span className={`${S.metaTag} ${S.metaTagDark}`}>
                  {templateData.duration}
                </span>
              </div>
            </div>

            <div className={S.imageSection}>
              <h3 className={`${S.sectionTitle} ${S.sectionTitleDark}`}>
                Generated Reference Image
              </h3>
              {templateData.image_url && (
                <div className={S.imageContainer}>
                  <Image
                    src={templateData.image_url}
                    alt="Generated template reference"
                    width={800}
                    height={800}
                    className={S.resultImage}
                    priority
                  />
                  <button
                    onClick={handleDownloadImage}
                    className={`${S.downloadButton} ${S.downloadButtonDark}`}
                  >
                    📥 Download Image
                  </button>
                </div>
              )}
            </div>

            <div className={S.descriptionSection}>
              <h3 className={`${S.sectionTitle} ${S.sectionTitleDark}`}>
                Your Vision
              </h3>
              <p className={`${S.descriptionText} ${S.descriptionTextDark}`}>
                {templateData.source}
              </p>
            </div>

            <div className={S.actionButtons}>
              <button
                onClick={handleCreateNew}
                className={`${S.primaryButton} ${S.primaryButtonDark}`}
              >
                Create Another Template
              </button>
              <button
                onClick={() => router.push('/')}
                className={`${S.secondaryButton} ${S.secondaryButtonDark}`}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
