import React, { Component } from 'react';
import Gallery from 'react-photo-gallery';
import Carousel, { Modal, ModalGateway } from 'react-images';
import LazyLoad from 'react-lazy-load';

import styles from './style.scss';

const photos = [
	{
		src: require('assets/images/photos/cozy.jpg'),
		title: 'sdf',
		width: 1,
		height: 1,
		alt: 'photographer in luxembourg'
	},
	{
		src: require('assets/images/photos/ice.jpg'),
		title: 'sdf',
		width: 4,
		height: 5,
		alt: 'photographer in luxembourg'
	},
	{
		src: require('assets/images/photos/field.jpg'),
		title: 'sdf',
		width: 4,
		height: 5,
		alt: 'portrait photographer in luxembourg'
	},
	{
		src: require('assets/images/photos/temple.jpg'),
		title: 'sdf',
		width: 4,
		height: 5,
		alt: 'photographer in luxembourg'
	},
	{
		src: require('assets/images/photos/italy.jpg'),
		title: 'sdfasda',
		width: 4,
		height: 5,
		alt: 'photographer in luxembourg'
	},
	{
		src: require('assets/images/photos/green.jpg'),
		title: 'sdf',
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
