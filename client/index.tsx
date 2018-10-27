import * as React from 'react';
import { render } from 'react-dom';
import { App } from './components/app/app';
import './styles.scss';
import './utils/strings';

render(<App />, document.getElementById('app'));