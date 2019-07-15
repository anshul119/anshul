import axios from 'axios';

export const YOUTUBE_API_KEY = 'AIzaSyDEsQq9CiH0tEUXPMB7qK3VxAQRH1RX7Y8';

export const latestVideos = axios.create({
	baseURL: 'https://www.googleapis.com/youtube/v3'
});
