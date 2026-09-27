import type { CSSProperties, ReactNode } from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { IoIosSettings } from 'react-icons/io';
import { FaFilter, FaKeyboard, FaList, FaLock, FaMoon, FaSun, FaUnlock } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Button from './components/Button';
import Kbd from './components/Kbd';

import ExportModeButton from './components/ExportModeButton';

import { splitKeyboardKeys, withBlur } from './util';
import { primaryTextColor, controlsBackground, darkModeTransition } from './colors';
import useUserSettings from './hooks/useUserSettings';
import useActionTitle from './hooks/useActionTitle';
import styles from './TopMenu.module.css';
import OutDirSelector from './components/OutDirSelector';
import type { KeyBinding } from '../../common/types';

const { stat } = window.require('node:fs/promises');
const { webUtils } = window.require('electron');

const outFmtStyle = { maxWidth: 100 };
const exportModeStyle = { flexGrow: 0, flexBasis: 140 };
const commonShortcutActions = [
  { action: 'setCutStart', label: 'Set cut start to current position' },
  { action: 'setCutEnd', label: 'Set cut end to current position' },
  { action: 'togglePlayResetSpeed', label: 'Play/pause' },
  { action: 'goToTimecode', label: 'Seek to timecode' },
];

function TopMenu({
  filePath,
  fileFormat,
  changeEnabledStreamsFilter,
  applyEnabledStreamsFilter,
  enabledStreamsFilter,
  renderOutFmt,
  numStreamsToCopy,
  numStreamsTotal,
  setStreamsSelectorShown,
  toggleSettings,
  selectedSegments,
  isCustomFormatSelected,
  toggleDarkMode,
  keyBindingByAction,
}: {
  filePath: string | undefined,
  fileFormat: string | undefined,
  changeEnabledStreamsFilter: () => void,
  applyEnabledStreamsFilter: () => void,
  enabledStreamsFilter: string | undefined,
  renderOutFmt: (style: CSSProperties) => ReactNode,
  numStreamsToCopy: number,
  numStreamsTotal: number,
  setStreamsSelectorShown: (v: boolean) => void,
  toggleSettings: () => void,
  selectedSegments: unknown[],
  isCustomFormatSelected: boolean,
  toggleDarkMode: () => void,
  keyBindingByAction: Record<string, KeyBinding>,
}) {
  const { t } = useTranslation();
  const [shortcutsVisible, setShortcutsVisible] = useState(false);
  const { customOutDir, setCustomOutDir, simpleMode, outFormatLocked, setOutFormatLocked, darkMode } = useUserSettings();
  const actionTitle = useActionTitle();
  const workingDirButtonRef = useRef<HTMLButtonElement>(null);

  const DarkMode = darkMode ? FaSun : FaMoon;

  const onOutFormatLockedClick = useCallback(() => setOutFormatLocked((v) => (v ? undefined : fileFormat)), [fileFormat, setOutFormatLocked]);

  const showClearWorkingDirButton = !!customOutDir;

  function renderFormatLock() {
    const Icon = outFormatLocked ? FaLock : FaUnlock;
    return (
      <Button style={{ marginRight: '.7em' }}>
        <Icon onClick={onOutFormatLockedClick} title={t('Lock/unlock output format')} style={{ fontSize: '.8em', color: outFormatLocked ? primaryTextColor : undefined }} />
      </Button>
    );
  }

  // Convenience for drag and drop: https://github.com/mifi/lossless-cut/issues/2147
  useEffect(() => {
    async function onDrop(ev: DragEvent) {
      ev.preventDefault();
      if (!ev.dataTransfer) return;
      const paths = [...ev.dataTransfer.files].map((f) => webUtils.getPathForFile(f));
      const [firstPath] = paths;
      if (paths.length === 1 && firstPath && (await stat(firstPath)).isDirectory()) {
        setCustomOutDir(firstPath);
      }
    }
    const element = workingDirButtonRef.current;
    element?.addEventListener('drop', onDrop);
    return () => element?.removeEventListener('drop', onDrop);
  }, [setCustomOutDir]);

  return (
    <div
      className={`no-user-select ${styles['wrapper']}`}
      style={{ background: controlsBackground, transition: darkModeTransition, display: 'flex', alignItems: 'center', padding: '.3em .3em', gap: '.3em', justifyContent: 'space-between', flexWrap: 'wrap' }}
    >
      {filePath && (
        <>
          <Button onClick={withBlur(() => setStreamsSelectorShown(true))}>
            <FaList style={{ fontSize: '.7em', marginRight: '.5em' }} />
            {t('Tracks')} ({numStreamsToCopy}/{numStreamsTotal})
          </Button>

          {enabledStreamsFilter != null && (
            <Button
              onClick={withBlur(() => applyEnabledStreamsFilter())}
              title={actionTitle(t('Toggle tracks using current filter'), 'toggleStripCurrentFilter')}
            >
              <FaFilter
                style={{ fontSize: '.8em', verticalAlign: 'middle' }}
              />
            </Button>
          )}

          <Button
            onClick={changeEnabledStreamsFilter}
          >
            {enabledStreamsFilter == null && <FaFilter style={{ fontSize: '.7em', marginRight: '.4em' }} />}
            {t('Filter tracks')}
          </Button>
        </>
      )}

      <div style={{ flexGrow: 1 }} />

      <OutDirSelector>
        <Button
          ref={workingDirButtonRef}
          title={customOutDir}
          style={{ paddingLeft: showClearWorkingDirButton ? '.4em' : undefined }}
        >
          {customOutDir ? t('Working dir set') : t('Working dir unset')}
        </Button>
      </OutDirSelector>

      <Button
        onClick={() => setShortcutsVisible((visible) => !visible)}
        aria-expanded={shortcutsVisible}
        aria-controls="common-keyboard-shortcuts"
        aria-pressed={shortcutsVisible}
        title={t('Keyboard shortcuts')}
      >
        <FaKeyboard style={{ verticalAlign: 'middle', marginRight: '.35em' }} />
        {t('Keyboard shortcuts')}
      </Button>

      {shortcutsVisible && (
        <section id="common-keyboard-shortcuts" className={styles['shortcutsPopover']} aria-label={t('Common shortcuts')}>
          <h2 className={styles['shortcutsTitle']}>{t('Common shortcuts')}</h2>
          <dl className={styles['shortcutsList']}>
            {commonShortcutActions.map(({ action, label }) => {
              const binding = keyBindingByAction[action];
              return (
                <div className={styles['shortcutRow']} key={action}>
                  <dt>{t(label)}</dt>
                  <dd>
                    {binding?.keys ? splitKeyboardKeys(binding.keys).map((code) => (
                      <span className={styles['shortcutKey']} key={`${action}-${code}`}><Kbd code={code} /></span>
                    )) : t('Not set')}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      )}

      {renderOutFmt(outFmtStyle)}

      {!simpleMode && (isCustomFormatSelected || outFormatLocked) && renderFormatLock()}

      {filePath && (
        <ExportModeButton selectedSegments={selectedSegments} style={exportModeStyle} />
      )}

      {!simpleMode && (
        <Button onClick={toggleDarkMode} title={actionTitle(t('Toggle dark mode'), 'toggleDarkMode')}>
          <DarkMode style={{ verticalAlign: 'middle', fontSize: '.9em' }} />
        </Button>
      )}

      <Button onClick={toggleSettings} title={actionTitle(t('Settings'), 'toggleSettings')}>
        <IoIosSettings style={{ fontSize: '1em', verticalAlign: 'bottom' }} />
      </Button>
    </div>
  );
}

export default memo(TopMenu);
