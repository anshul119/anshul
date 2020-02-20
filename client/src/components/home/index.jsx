import React, { Component } from 'react';
import { Element, Link } from 'react-scroll';
import Messenger from 'components/messenger';
import PhotoBlock from 'components/photoblock';
import styles from './style.scss';

const backgroundImg = require('assets/images/background.jpg');
const videosServiceBackground = require('assets/images/videosservicebg.jpg');
const photosServiceBackground = require('assets/images/photosservicebg.jpg');

const clients = [
	{
		logo: require('assets/images/clients/culturetrip.png'),
		link: ''
	},
	{
		logo: require('assets/images/clients/lonely-planet.png'),
		link: ''
	},
	{
		logo: require('assets/images/clients/tomtom.jpg'),
		link: ''
	},
	{
		logo: require('assets/images/clients/ministry-of-finance-kuwait.jpg'),
		link: ''
	},
	{
		logo: require('assets/images/clients/tedx-luxembourg.png'),
		link: ''
	},
	{
		logo: require('assets/images/clients/rajasthan-tourism.jpg'),
		link: ''
	},
	{
		logo: require('assets/images/clients/nest.png'),
		link: ''
	}
];

class HomePage extends Component {
	render() {
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
				<Element className="block block--dark" name="story">
					<div className="block__content">
						<h1 className="heading">About</h1>
						<p class="block__text">
							I am a videographer and photographer from
							Luxembourg. A creative storyteller at heart, I am an
							expert in crafting innovative and engaging content
							for the digital landscape. My powerful imagery,
							relentless dedication and passion to create has
							taken me all over the world and has expTHIS IS HACKED!!!!!!!osed me to
							different environments. I have worked with clients
							like TEDxLuxembourgCity, Ministry of Finance, Kuwait
							and more. I have also been featured on CultureTrip,
							LonelyPlanet and other travel channels.
						</p>
					</div>
				</Element>
				<Element className="block block--dark" name="videos">
					<div className="block__content">
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
					</div>
				</Element>
				<Element className="block block--light" name="photos">
					<div className="block__content">
						<h1 className="heading">Photos</h1>
						<PhotoBlock />
					</div>
				</Element>
				<Element className="block block--dark" name="services">
					<div className="block__content">
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
								<div className="service__text">
									<h1 className="service__heading">
										Video Production
									</h1>
									<p className="service__desc">
										From pre-production, shooting, and
										post-processing to color correction,
										grading and, sound design. I have got
										you covered. Combining creativity with
										your business, I take your videos from
										ideas to epic reality.
									</p>
								</div>
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
								<div className="service__text">
									<h1 className="service__heading">
										Photography
									</h1>
									<p className="service__desc">
										Specializing in landscape, concept
										pieces, product photography and,
										advertisements. My images capture the
										emotion and essence of brands to create
										impactful content.
									</p>
								</div>
							</div>
						</div>
						<Messenger />
					</div>
				</Element>
				<Element className="block block--light" name="clients">
					<div className="block__content">
						<h1 className="heading">Clients & Collaborations</h1>
						<p className="block__text">
							I have had the pleasure to work with clients from
							different domains. Are you the next?
						</p>
						<div className="clients grid">
							{clients.map(client => {
								return (
									<div className="grid__item--small">
										<img src={client.logo} />
									</div>
								);
							})}
						</div>
						<Messenger theme={'light'} />
					</div>
				</Element>
				<Element className="block block--dark" name="contact">
					<div className="block__content">
						<h1 className="heading">Contact</h1>
						<p className="block__text">
							Let's create art, together. Write me at
						</p>
						<p class="block__herotext">
							<a href="mailto:getcreative@anshul.art">
								<span className="block__herotext--highlight">
									getcreative
								</span>
								@anshul.art
							</a>
						</p>
					</div>
				</Element>
			</div>
		);
	}
}
export default HomePage;
