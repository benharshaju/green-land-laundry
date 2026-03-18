<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login — Green Land Laundry</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css'])
</head>
<body class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Animated gradient background -->
    <div class="fixed inset-0 bg-gradient-green"></div>
    <div class="fixed inset-0 opacity-30"
         style="background: radial-gradient(ellipse at 20% 50%, rgba(26,187,107,0.4) 0%, transparent 60%),
                            radial-gradient(ellipse at 80% 20%, rgba(245,158,11,0.2) 0%, transparent 50%),
                            radial-gradient(ellipse at 50% 100%, rgba(59,130,246,0.15) 0%, transparent 50%);">
    </div>

    <!-- Floating decorative shapes -->
    <div class="fixed top-20 left-10 w-72 h-72 bg-green-land-400/10 rounded-full blur-3xl animate-float"></div>
    <div class="fixed bottom-20 right-10 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl animate-float" style="animation-delay: 1.5s;"></div>
    <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-land-500/5 rounded-full blur-3xl"></div>

    <div class="w-full max-w-[420px] relative z-10 animate-fade-in-up">
        <!-- Logo -->
        <div class="text-center mb-10">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl mb-5 shadow-lg shadow-gold-500/30 animate-float">
                <span class="text-white font-extrabold text-3xl tracking-tight">GL</span>
            </div>
            <h1 class="text-3xl font-extrabold text-white tracking-tight">Green Land Laundry</h1>
            <p class="text-green-land-300/80 text-sm mt-2 font-medium">Professional Laundry Management — Bahrain</p>
        </div>

        <!-- Card with glassmorphism -->
        <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-8 border border-white/20">
            <div class="mb-6">
                <h2 class="text-xl font-bold text-gray-900">Welcome back</h2>
                <p class="text-sm text-gray-500 mt-1">Sign in to your account to continue</p>
            </div>

            @if ($errors->any())
                <div class="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl animate-fade-in-down">
                    <div class="flex items-start gap-3">
                        <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <div>
                            @foreach ($errors->all() as $error)
                                <p class="text-red-600 text-sm font-medium">{{ $error }}</p>
                            @endforeach
                        </div>
                    </div>
                </div>
            @endif

            <form method="POST" action="{{ route('login') }}" class="space-y-5">
                @csrf

                <!-- Email Field -->
                <div class="space-y-1.5">
                    <label class="block text-sm font-semibold text-gray-700">Email address</label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg class="w-5 h-5 text-gray-400 group-focus-within:text-green-land-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                        </div>
                        <input
                            type="email"
                            name="email"
                            value="{{ old('email') }}"
                            required
                            autofocus
                            class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm
                                   placeholder-gray-400
                                   hover:border-gray-300 hover:bg-white
                                   focus:bg-white focus:ring-2 focus:ring-green-land-500/20 focus:border-green-land-500
                                   transition-all duration-200"
                            placeholder="your@email.com"
                        >
                    </div>
                </div>

                <!-- Password Field with Toggle -->
                <div class="space-y-1.5">
                    <label class="block text-sm font-semibold text-gray-700">Password</label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg class="w-5 h-5 text-gray-400 group-focus-within:text-green-land-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </div>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            required
                            class="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm
                                   placeholder-gray-400
                                   hover:border-gray-300 hover:bg-white
                                   focus:bg-white focus:ring-2 focus:ring-green-land-500/20 focus:border-green-land-500
                                   transition-all duration-200"
                            placeholder="Enter your password"
                        >
                        <button
                            type="button"
                            onclick="togglePassword()"
                            class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg id="eye-off" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                            <svg id="eye-on" class="w-5 h-5 hidden" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Remember Me -->
                <div class="flex items-center justify-between">
                    <label class="flex items-center gap-2.5 cursor-pointer group">
                        <input type="checkbox" name="remember"
                               class="w-4 h-4 rounded-md border-gray-300 text-green-land-600
                                      focus:ring-green-land-500 focus:ring-offset-0
                                      transition-all duration-200 cursor-pointer">
                        <span class="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                    </label>
                </div>

                <!-- Submit Button -->
                <button
                    type="submit"
                    class="w-full bg-gradient-to-r from-green-land-600 to-green-land-700 text-white py-3 rounded-xl font-semibold text-sm
                           hover:from-green-land-700 hover:to-green-land-800
                           active:from-green-land-800 active:to-green-land-900
                           shadow-lg shadow-green-land-600/30 hover:shadow-xl hover:shadow-green-land-600/40
                           transform hover:-translate-y-0.5 active:translate-y-0
                           transition-all duration-200 ease-out
                           focus:ring-2 focus:ring-green-land-500 focus:ring-offset-2"
                >
                    Sign In
                </button>
            </form>

            <!-- Portal badges -->
            <div class="mt-8 pt-6 border-t border-gray-100">
                <p class="text-xs text-gray-400 text-center mb-3 font-medium uppercase tracking-wide">Access Portals</p>
                <div class="flex justify-center gap-2">
                    <span class="inline-flex items-center px-3 py-1.5 bg-green-land-50 text-green-land-700 rounded-lg text-xs font-medium">
                        <svg class="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        Admin
                    </span>
                    <span class="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                        <svg class="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        Staff
                    </span>
                    <span class="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                        <svg class="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                        </svg>
                        Developer
                    </span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <p class="text-center text-green-land-400/60 text-xs mt-8 font-medium">
            &copy; {{ date('Y') }} Green Land Laundry. All rights reserved.
        </p>
    </div>

    <script>
        function togglePassword() {
            const input = document.getElementById('password');
            const eyeOff = document.getElementById('eye-off');
            const eyeOn = document.getElementById('eye-on');
            if (input.type === 'password') {
                input.type = 'text';
                eyeOff.classList.add('hidden');
                eyeOn.classList.remove('hidden');
            } else {
                input.type = 'password';
                eyeOff.classList.remove('hidden');
                eyeOn.classList.add('hidden');
            }
        }
    </script>
</body>
</html>
