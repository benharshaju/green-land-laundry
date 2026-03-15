<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login — Green Land Laundry</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css'])
</head>
<body class="min-h-screen bg-gradient-to-br from-green-land-900 via-green-land-800 to-green-land-900 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
        <!-- Logo -->
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gold-500 rounded-2xl mb-4 shadow-lg">
                <span class="text-white font-bold text-2xl">GL</span>
            </div>
            <h1 class="text-2xl font-bold text-white">Green Land Laundry</h1>
            <p class="text-green-land-400 text-sm mt-1">Bahrain — Management System</p>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-6">Sign In</h2>

            @if ($errors->any())
                <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    @foreach ($errors->all() as $error)
                        <p class="text-red-600 text-sm">{{ $error }}</p>
                    @endforeach
                </div>
            @endif

            <form method="POST" action="{{ route('login') }}" class="space-y-4">
                @csrf
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value="{{ old('email') }}"
                        required
                        autofocus
                        class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-land-500 focus:border-transparent"
                        placeholder="your@email.com"
                    >
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                        type="password"
                        name="password"
                        required
                        class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-land-500 focus:border-transparent"
                        placeholder="••••••••"
                    >
                </div>
                <div class="flex items-center justify-between">
                    <label class="flex items-center space-x-2 text-sm text-gray-600">
                        <input type="checkbox" name="remember" class="rounded border-gray-300 text-green-land-600">
                        <span>Remember me</span>
                    </label>
                </div>
                <button
                    type="submit"
                    class="w-full bg-green-land-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-land-700 transition-colors"
                >
                    Sign In
                </button>
            </form>

            <div class="mt-6 pt-6 border-t border-gray-100">
                <p class="text-xs text-gray-400 text-center">
                    Staff Portal / Admin Panel / Developer Portal
                </p>
            </div>
        </div>

        <p class="text-center text-green-land-500 text-xs mt-6">
            © {{ date('Y') }} Green Land Laundry. All rights reserved.
        </p>
    </div>
</body>
</html>
