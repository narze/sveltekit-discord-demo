const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = import.meta.env.VITE_DISCORD_CLIENT_SECRET;
const DISCORD_OAUTH_REDIRECT_URI = import.meta.env.VITE_DISCORD_OAUTH_REDIRECT_URI;

export async function get({ url }) {
	const refresh_token = url.searchParams.get('refresh_token');

	if (!refresh_token) {
		return {
			body: JSON.stringify({ error: 'No refresh token found' }),
			status: 500
		};
	}

	// initializing data object to be pushed to Discord's token endpoint.
	// quite similar to what we set up in callback.js, expect with different grant_type.

	const dataObject = {
		client_id: DISCORD_CLIENT_ID,
		client_secret: DISCORD_CLIENT_SECRET,
		grant_type: 'refresh_token',
		redirect_uri: DISCORD_OAUTH_REDIRECT_URI,
		refresh_token: refresh_token,
		scope: 'identify'
	};

	// performing a Fetch request to Discord's token endpoint
	const request = await fetch('https://discord.com/api/oauth2/token', {
		method: 'POST',
		body: new URLSearchParams(dataObject),
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
	});

	const response = await request.json();

	if (response.error) {
		return {
			body: JSON.stringify({ error: response.error }),
			status: 500
		};
	}

	// redirect user to front page with cookies set
	const access_token_expires_in = new Date(Date.now() + response.expires_in); // 10 minutes
	const refresh_token_expires_in = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
	console.log('set refreshed cookies');
	return {
		headers: {
			'set-cookie': [
				`access_token=${response.access_token}; Path=/; HttpOnly; SameSite=Strict; Expires=${access_token_expires_in}}`,
				`refresh_token=${response.refresh_token}; Path=/; HttpOnly; SameSite=Strict; Expires=${refresh_token_expires_in}`
			]
		},
		status: 200,
		body: JSON.stringify({ access_token: response.access_token })
	};
}
