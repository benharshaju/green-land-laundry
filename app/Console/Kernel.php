<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // Daily report generation
        $schedule->command('reports:generate-daily')->dailyAt('23:30');

        // Cleanup old logs
        $schedule->command('log:clear')->weekly();

        // Sync queue
        $schedule->command('queue:work --stop-when-empty')->everyMinute()->withoutOverlapping();
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }
}
