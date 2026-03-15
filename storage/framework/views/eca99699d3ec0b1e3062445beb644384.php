<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <title>Admin Dashboard — Green Land Laundry</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <?php echo app('Illuminate\Foundation\Vite')(['resources/css/app.css', 'resources/js/admin.jsx']); ?>
</head>
<body>
    <div id="admin-app"></div>
    <script>
        window.csrf_token = "<?php echo e(csrf_token()); ?>";
        window.dashboardData = {
            stats: <?php echo json_encode($stats, 15, 512) ?>,
            recentOrders: <?php echo json_encode($recentOrders, 15, 512) ?>,
            revenueChart: <?php echo json_encode($revenueChart, 15, 512) ?>,
        };
    </script>
</body>
</html>
<?php /**PATH /home/user/green-land-laundry/resources/views/admin/dashboard.blade.php ENDPATH**/ ?>