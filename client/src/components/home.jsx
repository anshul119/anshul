import React, { Component } from 'react';
import styles from '../scss/home.scss';

const backgroundImg = require('../assets/images/background.jpg');

class HomePage extends Component {
	render() {
		return (
			<div className="landingblock">
				<div className="landingblock__textblock">
					<p className="landingblock__herotext">Hello</p>
					<p className="landingblock__caption">
						This is Me being creative
					</p>
				</div>
				<img className="landingblock__image" src={backgroundImg} />
			</div>
		);
	}
}
export default HomePage;
