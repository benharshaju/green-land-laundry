<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <title><?php echo $__env->yieldContent('title', 'Green Land Laundry'); ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
    <?php echo app('Illuminate\Foundation\Vite')(['resources/css/app.css', 'resources/js/app.jsx']); ?>
    <?php echo $__env->yieldPushContent('scripts-head'); ?>
</head>
<body class="antialiased">
    <?php echo $__env->yieldContent('content'); ?>
    <script>
        window.csrf_token = "<?php echo e(csrf_token()); ?>";
        window.auth_user = <?php echo json_encode(auth()->user()?->only('id', 'name', 'email')) ?>;
    </script>
    <?php echo $__env->yieldPushContent('scripts'); ?>
</body>
</html>
<?php /**PATH /home/user/green-land-laundry/resources/views/layouts/app.blade.php ENDPATH**/ ?>