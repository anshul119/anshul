import React, { Component } from 'react';
import { Element, Link } from 'react-scroll';

import styles from './style.scss';

const backgroundImg = require('../../assets/images/background.jpg');

const images = [
	require('../../assets/images/portfolio/tree.jpg'),
	require('../../assets/images/portfolio/street.jpg'),
	require('../../assets/images/portfolio/eibsee.jpg'),
	require('../../assets/images/portfolio/opera.jpg')
];

function HomePage() {
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
				<p class="block__text">
					My story started in Greece. I went there for a trip and so I
					brought a GoPro with myself. As small as it was, it suddenly
					amplified my world. The more shots I made, the more I saw
					the story unfolding in front of my eyes. I knew I had to
					create a video. While doing so, I enjoyed the process so
					much that I started spending time and money to learn how to
					shoot professional content.
				</p>
				<p class="block__text">
					Working on this skill brought me to awe-inspiring places,
					and time spent capturing beauty of this world taught me that
					art matters. Shooting seemed effortless. The question was
					how to show it to people. After hundreds of hours spend in
					creative process, I figured it out, and now I am ready to
					share my skill with you.
				</p>
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
				<a
					href="https://www.youtube.com/user/anshul1199"
					target="_blank"
					className="button"
				>
					Watch More
				</a>
			</Element>
			<Element className="block" name="photos">
				<h1 className="heading">Photos</h1>
				<div className="grid">
					{images.map(image => {
						return (
							<div className="grid__item--small">
								<img
									src={image}
									alt="anshul-sharma-photography-luxembourg"
								/>
							</div>
						);
					})}
				</div>
				<a
					href="https://www.instagram.com/allmadeofstarss/"
					target="_blank"
					className="button"
				>
					View More
				</a>
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
