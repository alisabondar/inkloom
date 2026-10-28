import Link from 'next/link';
import { Button, HandNote, Tape } from '@/components/studio';
import { TemplateGrid } from '@/components/site/TemplateGrid';
import { listPublicTemplates } from '@/lib/db/queries';
import { MEDIUMS } from '@/lib/plan';
import styles from './page.module.css';

const STEPS = [
  { title: 'Describe it', text: 'A few words or a reference photo. Pick the medium you work in.' },
  { title: 'Pick a concept', text: 'Four colour concepts to choose from — or use your own photo.' },
  { title: 'Tune the template', text: 'Line art, values, palette and numbers that redraw as you drag.' },
  { title: 'Print & paint', text: 'A print pack with your template, colour mixes and steps.' },
];

export default async function Home() {
  const recent = await listPublicTemplates({ limit: 8 }).catch(() => []);

  return (
    <>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>psst — no sketching skills needed ↓</p>
          <h1 className={styles.title}>Every piece starts with a <em>good plan.</em></h1>
          <p className={styles.lede}>
            Describe an idea and Inkloom lays out the line art, values, palette, and steps on your table.
          </p>
          <form action="/create" className={styles.prompt}>
            <label htmlFor="idea" className="sr-only">Your idea</label>
            <input id="idea" name="idea" className={styles.promptInput} placeholder="A fox curled up in a teacup, autumn leaves…" autoComplete="off" />
            <Button type="submit">Start a piece →</Button>
          </form>
          <div className={styles.mediums}>
            {MEDIUMS.map((medium) => (
              <Link key={medium.id} href={`/create?medium=${medium.id}`} className={styles.medium}>{medium.label}</Link>
            ))}
          </div>
        </div>

        <div className={styles.table} aria-hidden="true">
          <div className={styles.sheet} style={{ '--r': '-5deg', '--d': '0.1s', left: '0%', top: '6%', width: '58%', height: 280 } as React.CSSProperties}>
            <Tape className={styles.tape} size="sm" color="#e7b45c" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/meadow.png" alt="" />
            <span className={styles.caption}>line art · v2</span>
          </div>
          <div className={styles.sheet} style={{ '--r': '4deg', '--d': '0.3s', right: '0%', top: '14%', width: '50%', height: 250 } as React.CSSProperties}>
            <Tape className={styles.tape} angle={5} size="sm" color="#7fb9a8" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landscape-painting.png" alt="" />
            <span className={styles.caption}>concept ✓</span>
          </div>
          <div className={styles.sheet} style={{ '--r': '-1.5deg', '--d': '0.5s', left: '26%', top: '66%', width: '44%', paddingBottom: 34 } as React.CSSProperties}>
            <div className={styles.swatches}>
              <span style={{ background: '#e7b45c' }} /><span style={{ background: '#7a9a5a' }} /><span style={{ background: '#3e5f45' }} /><span style={{ background: '#9db7c9' }} /><span style={{ background: '#d97b4a' }} />
            </div>
            <span className={styles.caption}>palette — 5 mixes</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.steps}>
          {STEPS.map((step, index) => (
            <div key={step.title} className={styles.step}>
              <div className={styles.stepNum}>{index + 1}.</div>
              <div className={styles.stepTitle}>{step.title}</div>
              <p className={styles.stepText}>{step.text}</p>
            </div>
          ))}
        </div>

        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Fresh off the table</h2>
          <Link href="/gallery" className={styles.sectionLink}>Browse the gallery →</Link>
        </div>
        {recent.length ? (
          <TemplateGrid templates={recent} />
        ) : (
          <HandNote>The gallery is empty so far — be the first to share a piece.</HandNote>
        )}
      </section>
    </>
  );
}
