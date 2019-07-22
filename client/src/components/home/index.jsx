import React, { Component } from 'react';
import { Element, Link } from 'react-scroll';
import Instafeed from 'instafeed.js';

import styles from './style.scss';

const backgroundImg = require('assets/images/background.jpg');
const videosServiceBackground = require('assets/images/videosservicebg.jpg');
const photosServiceBackground = require('assets/images/photosservicebg.jpg');
const messengerIcon = require('assets/logos/fbm.png');

class HomePage extends Component {
	state = {
		videos: []
	};

	componentDidMount() {
		const feed = new Instafeed({
			get: 'user',
			userId: '233983513',
			limit: 4,
			resolution: 'standard_resolution',
			template: `<div class="grid__item--small">
							<a href="{{link}}" target="_blank">
								<img
									src={{image}}
									alt="anshul-sharma-photography-luxembourg"
								/>
							</a>
						</div>`,
			accessToken: '233983513.1677ed0.5702f2e695994cec91254b447a7f06cb'
		});
		feed.run();
	}

	render() {
		const { videos } = this.state;
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
						<span className="landingblock__moretext">
							Scroll down
						</span>
						<span className="lnr icon lnr-arrow-down" />
					</Link>
				</Element>
				<Element className="block" name="story">
					<h1 className="heading">Story</h1>
					<p class="block__text">
						My story started in Greece. I went there for a trip and
						so I brought a GoPro with myself. As small as it was, it
						suddenly amplified my world. The more shots I made, the
						more I saw the story unfolding in front of my eyes. I
						knew I had to create a video. While doing so, I enjoyed
						the process so much that I started spending time and
						money to learn how to shoot professional content.
					</p>
					<p class="block__text">
						Working on this skill brought me to awe-inspiring
						places, and time spent capturing beauty of this world
						taught me that art matters. Shooting seemed effortless.
						The question was how to show it to people. After
						hundreds of hours spend in creative process, I figured
						it out, and now I am ready to share my skill with you.
					</p>
				</Element>
				<Element className="block" name="videos">
					<h1 className="heading">Videos</h1>
					<div className="grid">
						<div className="grid__item">
							<div className="video-container">
								<div
									class="youtube-player"
									data-id="a9f6FtoeWT8"
								/>
							</div>
						</div>
						<div className="grid__item">
							<div className="video-container">
								<div
									class="youtube-player"
									data-id="kBIPsRs5dC4"
								/>
							</div>
						</div>
						<div className="grid__item ">
							<div className="video-container">
								<div
									class="youtube-player"
									data-id="k9mzxzFmDTc"
								/>
							</div>
						</div>
						<div className="grid__item ">
							<div className="video-container">
								<div
									class="youtube-player"
									data-id="hX4hDvaZ44A"
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
					<div id="instafeed" className="grid" />
					<a
						href="https://www.instagram.com/visualsofanshul/"
						target="_blank"
						className="button"
					>
						View More
					</a>
				</Element>
				<Element className="block" name="services">
					<h1 className="heading">Services</h1>
					<div className="grid">
						<div
							className="service grid__item"
							style={{
								backgroundImage: `linear-gradient(
									rgba(0, 0, 0, 0.5),
									rgba(0, 0, 0, 0.5)
								  ), url(${videosServiceBackground})`
							}}
						>
							<h1 className="service__heading">
								Video Production
							</h1>
							<p className="service__desc">
								From pre-production, shooting, and
								post-processing to color correction, grading
								and, sound design. I have got you covered.
								Combining creativity with your business, I take
								your videos from ideas to epic reality.
							</p>
							<div className="mask" />
						</div>
						<div
							className="service grid__item"
							style={{
								backgroundImage: `linear-gradient(
									rgba(0, 0, 0, 0.5),
									rgba(0, 0, 0, 0.5)
								  ), url(${photosServiceBackground})`
							}}
						>
							<h1 className="service__heading">photography</h1>
							<p className="service__desc">
								Specializing in landscape, concept pieces,
								product photography and, advertisements. My
								images capture the emotion and essence of brands
								to create impactful content.
							</p>
							<div className="mask" />
						</div>
					</div>
					<div class="messenger">
						<a
							className="messenger__link"
							href="https://m.me/1805258423119819"
							target="_blank"
						>
							<img
								className="messenger__icon"
								src={messengerIcon}
								alt="Message Anshul Sharma"
							/>
							Message Me Now
						</a>
					</div>
				</Element>
				<Element className="block" name="contact">
					<h1 className="heading">Contact</h1>
					<p className="block__text">
						Let's create art, together. Write me at
					</p>
					<p class="block__herotext">getcreative@anshul.art</p>
				</Element>
			</div>
		);
	}
}
export default HomePage;
