import os from 'node:os';
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(16);
// Never ask for more tabs than the machine has cores (Remotion rejects that).
Config.setConcurrency(Math.min(8, os.availableParallelism?.() ?? os.cpus().length));
