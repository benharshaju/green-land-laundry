<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Machine Remote Control — Green Land Laundry</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/admin.jsx'])
</head>
<body>
    <div id="admin-app"></div>
    <script>
        window.csrf_token = "{{ csrf_token() }}";
        window.machinesData = {
            machines: @json($machines),
            activeOrders: @json($activeOrders),
        };
    </script>
</body>
</html>
