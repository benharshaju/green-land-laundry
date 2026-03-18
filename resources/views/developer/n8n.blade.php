<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>n8n Workflows — Green Land Laundry</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css'])
</head>
<body>
    <div id="developer-n8n-app"></div>
    <script>
        window.csrf_token = "{{ csrf_token() }}";
        window.n8nData = {
            health: @json($health),
            workflows: @json($workflows),
            webhookUrl: @json($webhookUrl),
        };
    </script>
    @vite(['resources/js/developer-n8n.jsx'])
</body>
</html>
