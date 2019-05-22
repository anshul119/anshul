import React, { Component } from 'react';
import styles from './style.scss';

const backgroundImg = require('../../assets/images/background.jpg');

function HomePage(props) {
	return (
		<div>
			<div
				className="landingblock"
				style={{ backgroundImage: `url(${backgroundImg})` }}
			>
				<div className="landingblock__textblock">
					<p className="landingblock__herotext">Hello</p>
					<p className="landingblock__caption">
						This is Me being creative
					</p>
				</div>
			</div>
		</div>
	);
}
export default HomePage;
