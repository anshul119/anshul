import React from 'react';

import style from './style.scss';

const fbIcon = require('assets/logos/fb.svg');
const igIcon = require('assets/logos/ig.svg');
const ytIcon = require('assets/logos/yt.svg');

function SocialBlock() {
	return (
		<ul className="socialmenu">
			<li className="socialmenu__item">
				<a
					target="_blank"
					href="https://www.instagram.com/visualsofanshul/"
				>
					<img src={igIcon} className="socialmenu__icon" />
				</a>
			</li>
			<li className="socialmenu__item">
				<a
					target="_blank"
					href="https://www.youtube.com/user/anshul1199"
				>
					<img src={ytIcon} className="socialmenu__icon" />
				</a>
			</li>
			<li className="socialmenu__item">
				<a
					target="_blank"
					href="https://www.facebook.com/allmadeofstarss/"
				>
					<img src={fbIcon} className="socialmenu__icon" />
				</a>
			</li>
		</ul>
	);
}

export default SocialBlock;
