import { Fragment, memo, useState } from 'react';
import { FaBaby, FaFilm, FaFolderOpen, FaMouse } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import useUserSettings from './hooks/useUserSettings';
import type { KeyBinding } from '../../common/types';
import { splitKeyboardKeys } from './util';
import { getModifier } from './hooks/useTimelineScroll';
import Kbd from './components/Kbd';
import mainApi from './mainApi';
import styles from './NoFileLoaded.module.css';


function Keys({ keys }: { keys: string | undefined }) {
  if (keys == null || keys === '') {
    return <kbd>UNBOUND</kbd>;
  }
  const split = splitKeyboardKeys(keys);
  return split.map((key, i) => (
    <Fragment key={key}><Kbd code={key} />{i < split.length - 1 && <span className={styles['keySeparator']}>{' + '}</span>}</Fragment>
  ));
}

function NoFileLoaded({ mifiLink, onClick, darkMode, keyBindingByAction }: {
  mifiLink: unknown,
  onClick: () => void,
  darkMode?: boolean,
  keyBindingByAction: Record<string, KeyBinding>,
}) {
  const { t } = useTranslation();
  const { simpleMode, segmentMouseModifierKey, toggleSimpleMode } = useUserSettings();
  const [dragging, setDragging] = useState(false);

  return (
    <section
      className={`${styles['emptyState']} no-user-select`}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      aria-label={t('Get started')}
    >
      <div className={`${styles['welcomeCard']} ${dragging ? styles['dragging'] : ''}`}>
        <div className={styles['brandMark']} aria-hidden="true"><FaFilm /></div>
        <div className={styles['intro']}>
          <div className={styles['eyebrow']}>{t('Video Cut')}</div>
          <h1>{t('A lighter way to cut video')}</h1>
          <p>{t('Choose moments from a long video, name each clip, and export them separately.')}</p>
        </div>

        <button className={styles['openButton']} type="button" onClick={onClick}>
          <FaFolderOpen aria-hidden="true" />
          {t('Open file')}
        </button>
        <p className={styles['dropHint']}>{t('Or drop a video file here')}</p>

        <div className={styles['workflow']} aria-label={t('Simple editing workflow')}>
          <div className={styles['workflowStep']}><span>01</span>{t('Choose moments')}</div>
          <span className={styles['workflowRule']} aria-hidden="true" />
          <div className={styles['workflowStep']}><span>02</span>{t('Name each clip')}</div>
          <span className={styles['workflowRule']} aria-hidden="true" />
          <div className={styles['workflowStep']}><span>03</span>{t('Export separately')}</div>
        </div>
      </div>

      <div className={styles['utilityRow']}>
        <div className={styles['shortcutHint']}>
          <span>{t('Set cut points')}</span>
          <span><Keys keys={keyBindingByAction['setCutStart']?.keys} /> <span className={styles['keySeparator']}>/</span> <Keys keys={keyBindingByAction['setCutEnd']?.keys} /></span>
          <span className={styles['hintDivider']} aria-hidden="true" />
          <span><kbd>{getModifier(segmentMouseModifierKey)}</kbd> + <FaMouse aria-hidden="true" /></span>
        </div>
        <button
          className={styles['modeButton']}
          type="button"
          onClick={toggleSimpleMode}
          aria-label={simpleMode ? t('Show advanced view') : t('Show simple view')}
          title={simpleMode ? t('Show advanced view') : t('Show simple view')}
        >
          <FaBaby aria-hidden="true" />
          {simpleMode ? t('Simple view') : t('Advanced view')}
        </button>
      </div>

      {mifiLink && typeof mifiLink === 'object' && 'loadUrl' in mifiLink && typeof mifiLink.loadUrl === 'string' && mifiLink.loadUrl ? (
        <div className={styles['communityLink']}>
          <iframe src={`${mifiLink.loadUrl}#dark=${darkMode ? 'true' : 'false'}`} title="iframe" />
          {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
          <div title={t('Open link in browser')} role="button" onClick={() => { if ('targetUrl' in mifiLink && typeof mifiLink.targetUrl === 'string') mainApi.openExternal(mifiLink.targetUrl); }} />
        </div>
      ) : undefined}
    </section>
  );
}

export default memo(NoFileLoaded);
