import React, { Component } from 'react';

import styles from './style.scss';

const fbIcon = require('assets/logos/fb.svg');
const igIcon = require('assets/logos/ig.svg');

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
					<ul className="drawer__socialmenu">
						<li className="drawer__socialmenuitem">
							<embed
								type="image/svg+xml"
								src={igIcon}
								className="drawer__socialmenuicon"
							/>
						</li>
						<li className="drawer__socialmenuitem">
							<embed
								type="image/svg+xml"
								src={fbIcon}
								className="drawer__socialmenuicon"
							/>
						</li>
					</ul>
				</div>
			</div>
		);
	}
}
export default Drawer;
