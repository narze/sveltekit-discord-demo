import { serialize } from 'cookie';

export async function get() {
	return {
		headers: {
			Location: '/',
			'Set-Cookie': [
				serialize('access_token', null, {
					path: '/',
					httpOnly: true,
					sameSite: 'strict',
					secure: process.env.NODE_ENV === 'production',
					maxAge: 0
				}),
				serialize('refresh_token', null, {
					path: '/',
					httpOnly: true,
					sameSite: 'strict',
					secure: process.env.NODE_ENV === 'production',
					maxAge: 0
				})
			]
		},
		status: 302
	};
}