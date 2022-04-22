import type { GetSession, Handle } from '@sveltejs/kit';
import cookie from 'cookie';
const DISCORD_API_URL = 'https://discord.com/api';
const HOST = import.meta.env.VITE_HOST;

export const handle: Handle = async ({ event, resolve }) => {
	const cookies = cookie.parse(event.request.headers.get('cookie') || '');

	// if only refresh token is found, then access token has expired. perform a refresh on it.
	if (cookies.refresh_token && !cookies.access_token) {
		event.locals['needs_refresh'] = true;
		event.locals['refresh_token'] = cookies.refresh_token;
	}

	if (cookies.access_token) {
		console.log('setting discord user via access token..');
		const request = await fetch(`${DISCORD_API_URL}/users/@me`, {
			headers: { Authorization: `Bearer ${cookies.access_token}` }
		});

		const response = await request.json();

		if (response.id) {
			event.locals['user'] = { ...response };
		}
	}

	const originalResponse = await resolve(event);

	return originalResponse;
};

export const getSession: GetSession = async (event) => {
	const session = {};

	if (event.locals['user']) {
		session['user'] = event.locals['user'];
	}

	if (event.locals['needs_refresh']) {
		console.log('needs refresh');
		const refresh_token = event.locals['refresh_token'];
		console.log({ ...event });
		const refresh_token_response = await fetch(
			`${HOST}/auth/refresh?refresh_token=${refresh_token}`
		);
		const discord_response_data = await refresh_token_response.json();

		if (refresh_token_response.ok) {
			const access_token = discord_response_data.access_token;
			const refresh_token = discord_response_data.refresh_token;

			console.log('setting discord user via access token..');
			const request = await fetch(`${DISCORD_API_URL}/users/@me`, {
				headers: { Authorization: `Bearer ${access_token}` }
			});

			const response = await request.json();

			if (response.id) {
				session['user'] = { ...response };
			}

			const access_token_expires_in = new Date(Date.now() + discord_response_data.expires_in); // 10 minutes
			const refresh_token_expires_in = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days,

			session['tokens'] = {
				access_token,
				access_token_expires_in,
				refresh_token,
				refresh_token_expires_in
			};
		}
	}

	return session;
};
