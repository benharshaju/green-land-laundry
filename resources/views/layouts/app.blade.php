<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Green Land Laundry')</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    @if(file_exists(public_path('build/manifest.json')))
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @else
        <link href="{{ asset('build/assets/app-73fcfc94.css') }}" rel="stylesheet">
        <script type="module" src="{{ asset('build/assets/app-d9455800.js') }}"></script>
    @endif
    @stack('scripts-head')
</head>
<body class="antialiased">
    @yield('content')
    <script>
        window.csrf_token = "{{ csrf_token() }}";
        window.auth_user = @json(auth()->user()?->only('id', 'name', 'email'));
    </script>
    @stack('scripts')
</body>
</html>
