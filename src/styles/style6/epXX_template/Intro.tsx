/**
 * EPISODE TEMPLATE — a chapter or intro is ~10 lines: the engine draws everything from the world and the script.
 * Register it in an entry (src/entries/…) as an IntroComposition (or a Composition with the chapter's length).
 */
import React from 'react';
import {Atlas} from '../../../engine';
import {WORLD} from './world';
import {SCRIPT} from './script';

const Chapter: React.FC = () => <Atlas world={WORLD} script={SCRIPT} />;
export default Chapter;
