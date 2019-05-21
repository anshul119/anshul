import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import { browserHistory } from 'react-router';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import HomePage from './home';
import Header from './header';
import styles from '../scss/app.scss';

library.add(faBars);

class App extends Component {
	render() {
		return (
			<Router>
				<div className="app">
					<Header />
					<Route name="home" exact path="/" component={HomePage} />
				</div>
			</Router>
		);
	}
}
export default App;
