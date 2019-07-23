import React from 'react';

import styles from './style.scss';

const messengerIcon = require('assets/logos/fbm.png');

function Messenger() {
	return (
		<div class="messenger">
			<a
				className="messenger__link"
				href="https://m.me/1805258423119819"
				target="_blank"
			>
				<img
					className="messenger__icon"
					src={messengerIcon}
					alt="Message Anshul Sharma"
				/>
				Message Me Now
			</a>
		</div>
	);
}
export default Messenger;
