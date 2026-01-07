<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TrainLocalAIModel extends Command
{
    protected $signature = 'ai:train-local';
    protected $description = 'Train local AI model from dataset.jsonl';

    public function handle()
    {
        $aiServiceUrl = config('services.local_ai.url', 'http://127.0.0.1:9009');
        $trainScriptPath = base_path('ai-temp-local/train.py');

        $this->info('Training local AI model...');

        // Chạy train script
        $command = "python \"{$trainScriptPath}\"";
        $output = [];
        $returnVar = 0;
        exec($command, $output, $returnVar);

        if ($returnVar === 0) {
            $this->info(implode("\n", $output));
            
            // Reload model
            try {
                $response = Http::timeout(5)->post($aiServiceUrl . '/reload-model');
                if ($response->successful()) {
                    $this->info('✅ Model reloaded successfully!');
                } else {
                    $this->warn('⚠️  Model trained but reload failed. Please reload manually.');
                }
            } catch (\Exception $e) {
                $this->warn('⚠️  Model trained but reload failed: ' . $e->getMessage());
                $this->info('Please run: curl -X POST ' . $aiServiceUrl . '/reload-model');
            }
        } else {
            $this->error('Training failed:');
            $this->error(implode("\n", $output));
            return 1;
        }

        return 0;
    }
}
