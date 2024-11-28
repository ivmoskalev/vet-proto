"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type LoginPageProps = {
    searchParams: { [key: string]: string | string[] | undefined };
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const LoginPage = ({ searchParams }: LoginPageProps) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    // const searchParams = useSearchParams();

    useEffect(() => {
        // If user is already authenticated, redirect to /main
        const token = localStorage.getItem("token");
        if (token) {
            router.push("/main");
        }
    }, [router]);

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");

        try {
            const response = await fetch(`${basePath}/api/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            // Check if the response status is OK (status code 200-299)
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            // Parse the JSON response
            const data = await response.json();

            // If login is successful, store the token in local storage
            const { token } = data;
            if (token) {
                localStorage.setItem("token", token);

                // Redirect to the original page or /main
                const redirectPath = (searchParams.redirect as string) || "/main";
                router.push(redirectPath);
            }
        } catch (error) {
            console.error("Login error:", error);
            setError("Invalid username or password.");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center">Login</h2>
                {error && <p>{error}</p>}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
