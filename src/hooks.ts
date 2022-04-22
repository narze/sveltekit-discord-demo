import type { Handle } from '@sveltejs/kit';
import cookie from 'cookie';
const DISCORD_API_URL = 'https://discord.com/api';
const HOST = import.meta.env.VITE_HOST;

export async function getSession(event) {
	const session = {};

	if (event.locals.user) {
		session['user'] = event.locals.user;
	}

	if (event.locals.needs_refresh) {
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

			// cookies_to_set.push(
			// 	cookie.serialize('access_token', discord_response_data.access_token, {
			// 		path: '/',
			// 		httpOnly: true,
			// 		sameSite: 'strict',
			// 		secure: process.env.NODE_ENV === 'production',
			// 		expires: access_token_expires_in
			// 	})
			// );

			// cookies_to_set.push(
			// 	cookie.serialize('refresh_token', discord_response_data.refresh_token, {
			// 		path: '/',
			// 		httpOnly: true,
			// 		sameSite: 'strict',
			// 		secure: process.env.NODE_ENV === 'production',
			// 		expires: refresh_token_expires_in
			// 	})
			// );
		}
	}

	return session;
}

export const handle: Handle = async ({ event, resolve }) => {
	const cookies = cookie.parse(event.request.headers.get('cookie') || '');

	// console.log('DEBUG: request', { ...event.request });
	// const cookies_to_set = [];

	// if only refresh token is found, then access token has expired. perform a refresh on it.
	if (cookies.refresh_token && !cookies.access_token) {
		event.locals['needs_refresh'] = true;
		event.locals['refresh_token'] = cookies.refresh_token;

		// // FIXME: On vercel, this happens AFTER the cache has been hitn
		// // Maybe move this call out of `handle` and make the client side call (CSR)
		// const refresh_token_response = await fetch(
		// 	`${HOST}/auth/refresh?refresh_token=${cookies.refresh_token}`
		// );
		// const discord_response_data = await refresh_token_response.json();

		// if (refresh_token_response.ok) {
		// 	cookies.access_token = discord_response_data.access_token;

		// 	const access_token_expires_in = new Date(Date.now() + discord_response_data.expires_in); // 10 minutes
		// 	const refresh_token_expires_in = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days,

		// 	cookies_to_set.push(
		// 		cookie.serialize('access_token', discord_response_data.access_token, {
		// 			path: '/',
		// 			httpOnly: true,
		// 			sameSite: 'strict',
		// 			secure: process.env.NODE_ENV === 'production',
		// 			expires: access_token_expires_in
		// 		})
		// 	);

		// 	cookies_to_set.push(
		// 		cookie.serialize('refresh_token', discord_response_data.refresh_token, {
		// 			path: '/',
		// 			httpOnly: true,
		// 			sameSite: 'strict',
		// 			secure: process.env.NODE_ENV === 'production',
		// 			expires: refresh_token_expires_in
		// 		})
		// 	);
		// }
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

	// FIXME: Refresh token does not change on production vercel
	// event.request.headers.append('cookie', '_vercel_no_cache=1');

	const originalResponse = await resolve(event);

	// console.log({ originalResponse });

	// Put the cookies in the original response
	// cookies_to_set.forEach((cookie) => originalResponse.headers.append('set-cookie', cookie));

	return originalResponse;
};
