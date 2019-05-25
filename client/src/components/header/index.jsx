import React, { Component } from 'react';
import Drawer from 'components/Drawer';
import { Link } from 'react-router-dom';

import styles from './style.scss';

const logo = require('assets/logos/symbol.svg');

class Header extends Component {
	state = {
		isOpen: false
	};

	handleHamburgerClick = () => {
		const { isOpen } = this.state;
		if (isOpen) {
			this.setState({ isOpen: false });
		} else {
			this.setState({ isOpen: true });
		}
	};

	render() {
		const { isOpen } = this.state;
		return (
			<header className="header">
				<div className="header__logo">
					<img className="logo_img" src={logo} />
				</div>
				<span
					className="drawer__openicon lnr icon lnr-menu"
					onClick={this.handleHamburgerClick}
				/>
				<Drawer isOpen={isOpen} onClose={this.handleHamburgerClick} />
			</header>
		);
	}
}
export default Header;
