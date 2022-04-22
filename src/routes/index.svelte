<script context="module" lang="ts">
	import { browser } from '$app/env';
	import type { Load } from '@sveltejs/kit';

	const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
	const DISCORD_OAUTH_REDIRECT_URI = import.meta.env.VITE_DISCORD_OAUTH_REDIRECT_URI;

	const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${DISCORD_OAUTH_REDIRECT_URI}&response_type=code&scope=identify%20connections`;

	export const load: Load = async ({ session, fetch }) => {
		if (session['tokens'] && browser) {
			console.log('token refreshed, store tokens in httpOnly cookies');

			await fetch('/store_session', {
				method: 'POST',
				body: JSON.stringify(session['tokens'])
			});
		}

		return {
			props: { user: session['user'] || false }
		};
	};
</script>

<script lang="ts">
	import { session } from '$app/stores';
	export let user;

	let fetchTokensPromise = Promise.resolve([]);

	$: if (user) {
		refetchTokens();
	}

	function refetchTokens() {
		fetchTokensPromise = fetchTokens();
	}

	async function fetchTokens() {
		const res = await fetch('/debug/tokens.json');
		const data = await res.json();

		if (res.ok) {
			return data;
		} else {
			throw new Error('Error fetching tokens');
		}
	}

	async function clearAccessToken() {
		await fetch('/debug/clear_access_token', { method: 'POST' });

		refetchTokens();
	}

	async function clearRefreshToken() {
		await fetch('/debug/clear_refresh_token', { method: 'POST' });

		refetchTokens();
	}
</script>

<h1>SvelteKit Discord Demo</h1>

{#if user}
	<h1>Hello {user.username}!</h1>

	<h3>Session Data</h3>

	<pre>{JSON.stringify($session['user'], null, 2)}</pre>

	<h3>Tokens</h3>

	{#await fetchTokensPromise}
		...
	{:then tokens}
		<pre>{JSON.stringify(tokens, null, 2)}</pre>

		<button on:click={clearAccessToken}>Clear Access Token</button>
		<button on:click={clearRefreshToken}>Clear Refresh Token</button>
		<button
			on:click={() => {
				window.location.reload();
			}}>Reload page</button
		>
	{/await}

	<p><a href="/logout">Log Out</a></p>
{:else}
	<a href={authUrl}>Login with Discord</a>
{/if}
