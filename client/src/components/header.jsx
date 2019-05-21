import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from '../scss/header.scss';

const logo = require('../assets/logos/symbol.svg');

class Header extends Component {
	render() {
		return (
			<header className="header">
				<div className="header__logo">
					<img className="logo_img" src={logo} />
				</div>
				<ul id="header__buttons">
					<li className="header__button">
						<FontAwesomeIcon icon="bars" />
					</li>
				</ul>
			</header>
		);
	}
}
export default Header;
