// src/app/api/login/route.ts
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
    const { username, password } = await request.json();

    const validUsername = process.env.AUTH_USERNAME;
    const validPassword = process.env.AUTH_PASSWORD;

    if (username === validUsername && password === validPassword) {
        // Create a session token
        const sessionToken = uuidv4();

        return new Response(JSON.stringify({ token: sessionToken }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } else {
        return new Response(
            JSON.stringify({ message: "Invalid credentials" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
        );
    }
}