import React, { Component } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from './style.scss';

library.add(faBars, faTimes);

class Drawer extends Component {
	state = { isOpen: false };

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
			<>
				{isOpen ? (
					<div class="drawer">
						<span
							className="icon"
							onClick={this.handleHamburgerClick}
						>
							<FontAwesomeIcon icon="bars" />
						</span>
						this is my drawer
					</div>
				) : (
					<span className="icon" onClick={this.handleHamburgerClick}>
						<FontAwesomeIcon icon="bars" />
					</span>
				)}
			</>
		);
	}
}
export default Drawer;
