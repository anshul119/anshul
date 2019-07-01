import React, { Component } from 'react';
import Drawer from 'components/drawer';
import { Link } from 'react-router-dom';

import styles from './style.scss';

const logo = require('assets/logos/symbol.svg');

class Header extends Component {
	state = {
		isDrawerOpen: false,
		isPageScrolled: false
	};

	componentDidMount() {
		window.onscroll = () => {
			this.handleScroll();
		};
	}

	handleScroll = () => {
		if (
			document.body.scrollTop > 50 ||
			document.documentElement.scrollTop > 50
		) {
			this.setState({ isPageScrolled: true });
		} else {
			this.setState({ isPageScrolled: false });
		}
	};

	handleHamburgerClick = () => {
		const { isDrawerOpen } = this.state;
		if (isDrawerOpen) {
			this.setState({ isDrawerOpen: false });
			document.body.classList.remove('isdraweropen');
		} else {
			this.setState({ isDrawerOpen: true });
			document.body.classList.add('isdraweropen');
		}
	};

	render() {
		const { isDrawerOpen, isPageScrolled } = this.state;
		return (
			<header
				className={`header ${isPageScrolled ? `header--sticky` : ``}`}
			>
				<div className="header__logo">
					<img className="logo_img" src={logo} />
				</div>
				<span
					className="drawer__openicon lnr icon lnr-menu"
					onClick={this.handleHamburgerClick}
				/>
				<Drawer
					isOpen={isDrawerOpen}
					onClose={this.handleHamburgerClick}
				/>
			</header>
		);
	}
}
export default Header;
