import cookie from 'cookie';
const DISCORD_API_URL = 'https://discord.com/api';
const HOST = import.meta.env.VITE_HOST || 'http://localhost:3000';

export async function getSession(event) {
	console.log(event.request.headers.get('cookie'));
	const cookies = cookie.parse(event.request.headers.get('cookie') || '');

	// if only refresh token is found, then access token has expired. perform a refresh on it.
	if (cookies.refresh_token && !cookies.access_token) {
		const discord_request = await fetch(
			`${HOST}/auth/refresh?refresh_token=${cookies.refresh_token}`
		);
		console.log({ discord_request });
		const discord_response = await discord_request.json();

		if (discord_response.access_token) {
			console.log('setting discord user via refresh token..');
			const request = await fetch(`${DISCORD_API_URL}/users/@me`, {
				headers: { Authorization: `Bearer ${discord_response.access_token}` }
			});

			// returns a discord user if JWT was valid
			const response = await request.json();

			if (response.id) {
				return {
					user: {
						// only include properties needed client-side —
						// exclude anything else attached to the user
						// like access tokens etc
						...response
					}
				};
			}
		}
	}

	if (cookies.access_token) {
		console.log('setting discord user via access token..');
		const request = await fetch(`${DISCORD_API_URL}/users/@me`, {
			headers: { Authorization: `Bearer ${cookies.access_token}` }
		});

		// returns a discord user if JWT was valid
		const response = await request.json();

		if (response.id) {
			return {
				user: {
					// only include properties needed client-side —
					// exclude anything else attached to the user
					// like access tokens etc
					...response
				}
			};
		}
	}

	// not authenticated, return empty user object
	return {
		user: false
	};
}
