import React, { Component } from 'react';
import { Element, Link } from 'react-scroll';
import styles from './style.scss';

const backgroundImg = require('../../assets/images/background.jpg');

function HomePage(props) {
	return (
		<div>
			<Element
				className="landingblock"
				style={{ backgroundImage: `url(${backgroundImg})` }}
				name="home"
			>
				<Link
					className="landingblock__morelink"
					to="story"
					smooth={true}
				>
					<span className="landingblock__moretext">Scroll down</span>
					<span className="lnr icon lnr-arrow-down" />
				</Link>
			</Element>
			<Element className="block" name="story">
				<h1 className="heading">Story</h1>
				<p class="block__text">This is my lame story</p>
			</Element>
			<Element className="block" name="videos">
				<h1 className="heading">Videos</h1>
				<div className="grid">
					<div className="grid__item">
						<div className="video-container">
							<iframe
								width="853"
								height="480"
								src="https://www.youtube.com/embed/a9f6FtoeWT8?controls=0"
								frameborder="0"
								allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
							/>
						</div>
					</div>
					<div className="grid__item">
						<div className="video-container">
							<iframe
								width="853"
								height="480"
								src="https://www.youtube.com/embed/hX4hDvaZ44A"
								frameborder="0"
								allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
							/>
						</div>
					</div>
					<div className="grid__item ">
						<div className="video-container">
							<iframe
								width="853"
								height="480"
								src="https://www.youtube.com/embed/k9mzxzFmDTc"
								frameborder="0"
								allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
							/>
						</div>
					</div>
					<div className="grid__item ">
						<div className="video-container">
							<iframe
								width="853"
								height="480"
								src="https://www.youtube.com/embed/vQVVXOKTVCQ"
								frameborder="0"
								allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
							/>
						</div>
					</div>
				</div>
			</Element>
			<Element className="block" name="photos">
				<h1 className="heading">Photos</h1>
				<div className="grid">
					<div className="grid__item">
						<img src="" alt="" />
					</div>
					<div className="grid__item">
						<img src="" alt="" />
					</div>
					<div className="grid__item">
						<img src="" alt="" />
					</div>
					<div className="grid__item">
						<img src="" alt="" />
					</div>
				</div>
			</Element>
			<Element className="block" name="contact">
				<h1 className="heading">Contact</h1>
				<p className="block__text">Let's create art. Together.</p>
				<p class="block__herotext">getcreative@anshul.art</p>
			</Element>
		</div>
	);
}
export default HomePage;
