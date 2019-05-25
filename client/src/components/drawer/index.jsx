import React, { Component } from 'react';
import SocialBlock from 'components/socialblock';
import styles from './style.scss';

class Drawer extends Component {
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
						<li className="menu__item">Home</li>
						<li className="menu__item">Story</li>
						<li className="menu__item">Videos</li>
						<li className="menu__item">Photos</li>
						<li className="menu__item">Pricing</li>
						<li className="menu__item">Contact</li>
					</ul>
					<SocialBlock />
				</div>
			</div>
		);
	}
}
export default Drawer;
