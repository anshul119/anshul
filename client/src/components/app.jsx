import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import { browserHistory } from 'react-router';
import HomePage from 'components/home';
import Header from 'components/header';

import styles from '../scss/app.scss';

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
