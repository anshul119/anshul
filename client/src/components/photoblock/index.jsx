import React, { Component } from 'react';
import Gallery from 'react-photo-gallery';
import Carousel, { Modal, ModalGateway } from 'react-images';
import LazyLoad from 'react-lazy-load';

import styles from './style.scss';

const photos = [
	{
		src: require('assets/images/photos/cozy.jpg'),
		title: 'Product shoot for NEST by Arpit Agarwal, India',
		width: 1,
		height: 1,
		alt: 'product photographer in luxembourg'
	},
	{
		src: require('assets/images/photos/ice.jpg'),
		title: 'Hunting for perspective in Dolomites with Thule backpack',
		width: 4,
		height: 5,
		alt: 'product photographer in luxembourg'
	},
	{
		src: require('assets/images/photos/field.jpg'),
		title: 'Portrait shoot in Luxembourg',
		width: 4,
		height: 5,
		alt: 'portrait photographer in luxembourg'
	},
	{
		src: require('assets/images/photos/temple.jpg'),
		title: 'Framing the temple in Mathura, India',
		width: 4,
		height: 5,
		alt: 'Architecture photographer in luxembourg'
	},
	{
		src: require('assets/images/photos/italy.jpg'),
		title: 'Contrasting nature of South Tyrol, Italy',
		width: 4,
		height: 5,
		alt: 'Landscape photographer in luxembourg'
	},
	{
		src: require('assets/images/photos/green.jpg'),
		title: 'Portrait shoot in Luxembourg',
		width: 1,
		height: 1,
		alt: 'portrait photographer in luxembourg'
	}
];

class PhotoBlock extends Component {
	state = {
		currentImage: 0,
		viewerIsOpen: false
	};

	setCurrentImage(index) {
		this.setState({ currentImage: index });
	}

	setViewerIsOpen(isOpen) {
		this.setState({ viewerIsOpen: isOpen });
	}

	openLightbox(event, { photo, index }) {
		console.log(event, arguments);
		this.setCurrentImage(index);
		this.setViewerIsOpen(true);
	}

	closeLightbox() {
		this.setCurrentImage(0);
		this.setViewerIsOpen(false);
	}

	render() {
		const { currentImage, viewerIsOpen } = this.state;
		return (
			<div className="photoblock">
				<LazyLoad debounce={false} offsetVertical={500}>
					<Gallery
						photos={photos}
						onClick={this.openLightbox.bind(this)}
						targetRowHeight={400}
					/>
				</LazyLoad>
				<ModalGateway>
					{viewerIsOpen ? (
						<Modal onClose={this.closeLightbox.bind(this)}>
							<Carousel
								currentIndex={currentImage}
								views={photos.map(photo => ({
									...photo,
									srcset: photo.srcSet,
									caption: photo.title
								}))}
							/>
						</Modal>
					) : null}
				</ModalGateway>
				<a
					href="https://www.instagram.com/visualsofanshul/"
					target="_blank"
					className="button"
				>
					View More
				</a>
			</div>
		);
	}
}
export default PhotoBlock;
