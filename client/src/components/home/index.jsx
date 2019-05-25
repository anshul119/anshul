import React, { Component } from 'react';
import styles from './style.scss';

const backgroundImg = require('../../assets/images/background.jpg');

function HomePage(props) {
	return (
		<div>
			<section
				className="landingblock"
				style={{ backgroundImage: `url(${backgroundImg})` }}
			>
				<a className="landingblock__morelink">
					<span className="landingblock__moretext">Scroll down</span>
					<span className="lnr icon lnr-arrow-down" />
				</a>
			</section>
			<section className="block">
				<h1 className="block__heading">Story</h1>
				<p class="block__text">This is my lame story</p>
			</section>
			<section className="block">
				<h1 className="block__heading">Videos</h1>
			</section>
			<section className="block">
				<h1 className="block__heading">Photos</h1>
			</section>
			<section className="block">
				<h1 className="block__heading">Pricing</h1>
			</section>
			<section className="block">
				<h1 className="block__heading">Contact</h1>
				<p className="block__text">Let's create art. Together.</p>
				<p class="block__herotext">getcreative@anshul.art</p>
			</section>
		</div>
	);
}
export default HomePage;
