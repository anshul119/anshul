import React, { Component } from 'react';
import { Element, Link } from 'react-scroll';
import LazyLoad from 'react-lazy-load';
import { latestVideos, YOUTUBE_API_KEY } from 'apis/youtube';

import styles from './style.scss';

const backgroundImg = require('assets/images/background.jpg');
const images = [
	require('assets/images/portfolio/tree.jpg'),
	require('assets/images/portfolio/street.jpg'),
	require('assets/images/portfolio/eibsee.jpg'),
	require('assets/images/portfolio/opera.jpg')
];

class HomePage extends Component {
	state = {
		videos: []
	};

	componentDidMount() {
		latestVideos
			.get('/search', {
				params: {
					part: 'id',
					maxResults: 4,
					type: 'video',
					key: YOUTUBE_API_KEY
				}
			})
			.then(res => {
				const videos = [];
				res.data.items.map(video => {
					videos.push(video.id.videoId);
				});
				this.setState({ videos });
			});
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
					<div className="grid">
						{images.map(image => {
							return (
								<div className="grid__item--small">
									<LazyLoad offsetVertical={500}>
										<img
											src={image}
											alt="anshul-sharma-photography-luxembourg"
										/>
									</LazyLoad>
								</div>
							);
						})}
					</div>
					<a
						href="https://www.instagram.com/visualsofanshul/"
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
}
export default HomePage;
