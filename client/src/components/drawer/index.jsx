import React, { Component } from 'react';
import SocialBlock from 'components/socialblock';
import { Link, Events } from 'react-scroll';
import styles from './style.scss';

class Drawer extends Component {
	componentDidMount() {
		Events.scrollEvent.register('begin', () => {
			if (this.props.isOpen) {
				this.props.onClose();
			}
		});
	}

	render() {
		const { isOpen, onClose } = this.props;
		return (
			<div className={`drawer ${isOpen ? 'drawer--isopen' : ''}`}>
				<span
					className="drawer__closeicon icon lnr lnr-cross"
					onClick={onClose}
				/>
				<div className="drawer__content">
					<ul className="menu">
						<li className="menu__item">
							<Link to="home" smooth={true}>
								Home
							</Link>
						</li>
						<li className="menu__item">
							<Link to="story" smooth={true}>
								Story
							</Link>
						</li>
						<li className="menu__item">
							<Link to="videos" smooth={true}>
								Videos
							</Link>
						</li>
						<li className="menu__item">
							<Link to="photos" smooth={true}>
								Photos
							</Link>
						</li>
						<li className="menu__item">
							<Link to="contact" smooth={true}>
								Contact
							</Link>
						</li>
					</ul>
					<SocialBlock />
				</div>
			</div>
		);
	}
}
export default Drawer;
