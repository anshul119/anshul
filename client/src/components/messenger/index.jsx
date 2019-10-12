import React from 'react';

import styles from './style.scss';

const messengerIconDark = require('assets/icons/fbm-dark.png');
const messengerIconLight = require('assets/icons/fbm-light.svg');

function Messenger(props) {
	return (
		<div
			class={`messenger ${
				props.theme ? `messenger--${props.theme}` : 'messenger--dark'
			}`}
		>
			<a
				className="messenger__link"
				href="https://m.me/1805258423119819"
				target="_blank"
			>
				<img
					className="messenger__icon"
					src={
						props.theme === 'light'
							? messengerIconLight
							: messengerIconDark
					}
					alt="Message Anshul Sharma"
				/>
				Message Me Now
			</a>
		</div>
	);
}
export default Messenger;
