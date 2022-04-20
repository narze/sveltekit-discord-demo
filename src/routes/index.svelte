<script context="module">
	const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
	const DISCORD_OAUTH_REDIRECT_URI = import.meta.env.VITE_DISCORD_OAUTH_REDIRECT_URI;

	export async function load({ session }) {
		return {
			props: { user: session.user || false }
		};
	}

	const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${DISCORD_OAUTH_REDIRECT_URI}&response_type=code&scope=identify%20connections`;
</script>

<script>
	import { session } from '$app/stores';
	export let user;
</script>

<h1>SvelteKit Discord Demo</h1>

{#if user}
	<h1>Hello {user.username}!</h1>

	<p>Your session data : {JSON.stringify($session)}</p>

	<a href="/logout">Log Out</a>
{:else}
	<a href={authUrl}>Login with Discord</a>
{/if}
