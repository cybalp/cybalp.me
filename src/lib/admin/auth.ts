// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/lib/admin/auth.ts
// ❯ @desc Admin API auth — extract and validate GitHub token from request
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS

// ❯ @docs Extracts Bearer token from Authorization header or ?token= query
export function getToken(request: Request): string | null {
	const auth = request.headers.get("Authorization");
	if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
	const url = new URL(request.url);
	return url.searchParams.get("token")?.trim() ?? null;
}

// ❯ @docs Returns 401 JSON response for API routes
export function unauthorized(): Response {
	return new Response(
		JSON.stringify({ error: "Unauthorized", message: "Missing or invalid token" }),
		{ status: 401, headers: { "Content-Type": "application/json" } },
	);
}

// ❯ @docs Validates token by calling GitHub user API
export async function validateToken(token: string): Promise<boolean> {
	const res = await fetch("https://api.github.com/user", {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.ok;
}

// ❯ @docs Wrapper: ensures request has valid token, returns token or 401
export async function requireAuth(request: Request): Promise<string | Response> {
	const token = getToken(request);
	if (!token) return unauthorized();
	const valid = await validateToken(token);
	if (!valid) return unauthorized();
	return token;
}
