import React, { Component } from 'react';
import Drawer from 'components/Drawer';
import { Link } from 'react-router-dom';

import styles from './style.scss';

const logo = require('../../assets/logos/symbol.svg');

function Header() {
	return (
		<header className="header">
			<div className="header__logo">
				<img className="logo_img" src={logo} />
			</div>
			<Drawer />
		</header>
	);
}
export default Header;
