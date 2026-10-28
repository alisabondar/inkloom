import Link from 'next/link';
import type { TemplateCard } from '@/lib/db/queries';
import { MEDIUMS } from '@/lib/plan';
import styles from './site.module.css';

const mediumLabel = (id: string) => MEDIUMS.find((medium) => medium.id === id)?.label ?? id;


export function TemplateGrid({ templates, showPrivacy = false }: { templates: TemplateCard[]; showPrivacy?: boolean }) {
  return (
    <div className={styles.grid}>
      {templates.map((template) => (
        <Link key={template.id} href={`/t/${template.id}`} className={styles.card}>
          {template.conceptUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.cardImage} src={template.conceptUrl} alt={template.title} loading="lazy" />
          ) : (
            <div className={styles.cardPlaceholder}>image unavailable</div>
          )}
          <div className={styles.cardTitle}>{template.title}</div>
          <div className={styles.cardMeta}>
            {template.makerUsername && <span>@{template.makerUsername}</span>}
            <span>{mediumLabel(template.medium)}</span>
            <span>· {template.difficulty}</span>
            {showPrivacy && !template.is_public && <span className={styles.privateTag}>private</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}
